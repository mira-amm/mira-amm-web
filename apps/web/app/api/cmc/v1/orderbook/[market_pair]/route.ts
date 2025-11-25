/**
 * CoinMarketCap Orderbook Endpoint v1
 * @api {get} /api/cmc/v1/orderbook/:market_pair Get market depth for a trading pair
 *
 * For V2 concentrated liquidity pools, uses bins to construct orderbook.
 * For V1 AMM pools, calculates simulated orderbook levels from the bonding curve.
 */
import {NextRequest, NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {SQDIndexerUrl} from "@/web/src/utils/constants";

interface PoolData {
  id: string;
  protocolVersion: number;
  reserve0Decimal: string;
  reserve1Decimal: string;
  price0: string;
  activeBinId: number | null;
  asset0: {
    symbol: string;
    decimals: number;
  };
  asset1: {
    symbol: string;
    decimals: number;
  };
}

interface BinData {
  binId: number;
  reserveXDecimal: string;
  reserveYDecimal: string;
  price: string;
}

export async function GET(
  req: NextRequest,
  {params}: {params: Promise<{market_pair: string}>}
) {
  try {
    const marketPair = (await params).market_pair;
    const url = new URL(req.url);
    const depth = parseInt(url.searchParams.get("depth") || "100");
    const level = parseInt(url.searchParams.get("level") || "2");

    // Parse market pair (e.g., "ETH_USDC")
    const [baseSymbol, quoteSymbol] = marketPair.split("_");
    if (!baseSymbol || !quoteSymbol) {
      return NextResponse.json(
        {error: "Invalid market pair format. Use BASE_QUOTE (e.g., ETH_USDC)"},
        {status: 400}
      );
    }

    // Find the pool for this trading pair
    const poolQuery = gql`
      query GetPoolBySymbols($base: String!, $quote: String!) {
        pools(
          where: {
            AND: [
              {
                OR: [
                  {
                    AND: [
                      {asset0: {symbol_eq: $base}}
                      {asset1: {symbol_eq: $quote}}
                    ]
                  }
                  {
                    AND: [
                      {asset0: {symbol_eq: $quote}}
                      {asset1: {symbol_eq: $base}}
                    ]
                  }
                ]
              }
            ]
          }
          orderBy: tvlUSD_DESC
          limit: 1
        ) {
          id
          protocolVersion
          reserve0Decimal
          reserve1Decimal
          price0
          activeBinId
          asset0 {
            symbol
            decimals
          }
          asset1 {
            symbol
            decimals
          }
        }
      }
    `;

    const {pools} = await request<{pools: PoolData[]}>({
      url: SQDIndexerUrl,
      document: poolQuery,
      variables: {base: baseSymbol, quote: quoteSymbol},
    });

    if (!pools || pools.length === 0) {
      return NextResponse.json(
        {error: `Pool not found for ${marketPair}`},
        {status: 404}
      );
    }

    const pool = pools[0];
    const timestamp = Date.now();

    let bids: Array<[string, string]> = [];
    let asks: Array<[string, string]> = [];

    if (pool.protocolVersion === 2 && pool.activeBinId !== null) {
      // V2 pool - use bins to construct orderbook
      const binsQuery = gql`
        query GetPoolBins($poolId: String!) {
          bins(
            where: {
              AND: [
                {pool: {id_eq: $poolId}}
                {reserveXDecimal_gt: "0"}
                {reserveYDecimal_gt: "0"}
              ]
            }
            orderBy: binId_ASC
            limit: ${depth}
          ) {
            binId
            reserveXDecimal
            reserveYDecimal
            price
          }
        }
      `;

      const {bins} = await request<{bins: BinData[]}>({
        url: SQDIndexerUrl,
        document: binsQuery,
        variables: {poolId: pool.id},
      });

      // Bins below active bin = bids (buy orders for base asset)
      // Bins above active bin = asks (sell orders for base asset)
      bins.forEach((bin) => {
        const price = parseFloat(bin.price);
        const reserveX = parseFloat(bin.reserveXDecimal);
        const reserveY = parseFloat(bin.reserveYDecimal);

        if (bin.binId < pool.activeBinId!) {
          // Bid: amount of base asset available at this price
          bids.push([price.toString(), reserveX.toString()]);
        } else if (bin.binId > pool.activeBinId!) {
          // Ask: amount of base asset available at this price
          asks.push([price.toString(), reserveX.toString()]);
        }
      });

      // Limit to requested depth (depth/2 for each side)
      bids = bids.slice(0, Math.floor(depth / 2));
      asks = asks.slice(0, Math.floor(depth / 2));
    } else {
      // V1 pool - simulate orderbook from constant product curve
      const reserve0 = parseFloat(pool.reserve0Decimal);
      const reserve1 = parseFloat(pool.reserve1Decimal);
      const currentPrice = parseFloat(pool.price0);

      // Generate simulated orderbook levels
      const levels = Math.floor(depth / 2);
      const priceStep = 0.01; // 1% price steps

      // Generate bids (prices below current)
      for (let i = 1; i <= levels; i++) {
        const price = currentPrice * (1 - priceStep * i);
        // Calculate available amount at this price using AMM curve
        const k = reserve0 * reserve1; // constant product
        const newReserve1 = Math.sqrt(k / price);
        const amount = Math.abs(newReserve1 - reserve1);
        bids.push([price.toFixed(8), amount.toFixed(8)]);
      }

      // Generate asks (prices above current)
      for (let i = 1; i <= levels; i++) {
        const price = currentPrice * (1 + priceStep * i);
        const k = reserve0 * reserve1;
        const newReserve1 = Math.sqrt(k / price);
        const amount = Math.abs(newReserve1 - reserve1);
        asks.push([price.toFixed(8), amount.toFixed(8)]);
      }
    }

    // Sort orderbook properly
    bids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])); // Highest bid first
    asks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])); // Lowest ask first

    // Apply level filtering
    // Level 1: Only the best bid and ask
    // Level 2: Arranged by best bids and asks (default)
    // Level 3: Complete order book, no aggregation (same as level 2 for DEX)
    if (level === 1) {
      bids = bids.length > 0 ? [bids[0]] : [];
      asks = asks.length > 0 ? [asks[0]] : [];
    }

    return NextResponse.json(
      {
        timestamp,
        bids,
        asks,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=10", // Cache for 10 seconds
        },
      }
    );
  } catch (error) {
    console.error("Error fetching orderbook data:", error);
    return NextResponse.json(
      {error: "Failed to fetch orderbook data"},
      {status: 500}
    );
  }
}

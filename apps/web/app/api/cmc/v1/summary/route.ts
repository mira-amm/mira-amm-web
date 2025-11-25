/**
 * CoinMarketCap Summary Endpoint v1
 * @api {get} /api/cmc/v1/summary Get overview of market data for all tickers and all markets
 */
import {NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {SQDIndexerUrl} from "@/web/src/utils/constants";

interface PoolData {
  id: string;
  asset0: {
    id: string;
    symbol: string;
  };
  asset1: {
    id: string;
    symbol: string;
  };
  reserve0Decimal: string;
  reserve1Decimal: string;
  price0: string;
  price1: string;
  snapshots: Array<{
    timestamp: number;
    volumeAsset0Decimal: string;
    volumeAsset1Decimal: string;
    price0: string;
    price1: string;
  }>;
}

export async function GET() {
  try {
    const timestamp24hAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

    const query = gql`
      query GetAllPools($timestamp24h: Int!) {
        pools(orderBy: tvlUSD_DESC) {
          id
          asset0 {
            id
            symbol
          }
          asset1 {
            id
            symbol
          }
          reserve0Decimal
          reserve1Decimal
          price0
          price1
          snapshots(
            where: {timestamp_gt: $timestamp24h}
            orderBy: timestamp_ASC
          ) {
            timestamp
            volumeAsset0Decimal
            volumeAsset1Decimal
            price0
            price1
          }
        }
      }
    `;

    const {pools} = await request<{pools: PoolData[]}>({
      url: SQDIndexerUrl,
      document: query,
      variables: {timestamp24h: timestamp24hAgo},
    });

    const summary = pools.map((pool) => {
      const tradingPairs = `${pool.asset0.symbol}_${pool.asset1.symbol}`;

      // Calculate 24h volume in base and quote currency
      const baseVolume = pool.snapshots.reduce(
        (sum, snapshot) =>
          sum + parseFloat(snapshot.volumeAsset0Decimal || "0"),
        0
      );
      const quoteVolume = pool.snapshots.reduce(
        (sum, snapshot) =>
          sum + parseFloat(snapshot.volumeAsset1Decimal || "0"),
        0
      );

      // Get current price
      const lastPrice = parseFloat(pool.price0);

      // Calculate highest and lowest ask/bid (using current reserves as approximation for AMM)
      // For AMMs, the current price is both the ask and bid with minimal spread
      const lowestAsk = lastPrice * 1.001; // 0.1% above current price
      const highestBid = lastPrice * 0.999; // 0.1% below current price

      // Calculate 24h price change
      let priceChangePercent24h = 0;
      let highestPrice24h = lastPrice;
      let lowestPrice24h = lastPrice;

      if (pool.snapshots.length > 0) {
        const firstPrice = parseFloat(pool.snapshots[0].price0 || pool.price0);
        if (firstPrice !== 0) {
          priceChangePercent24h = ((lastPrice - firstPrice) / firstPrice) * 100;
        }

        // Find highest and lowest prices in 24h
        pool.snapshots.forEach((snapshot) => {
          const price = parseFloat(snapshot.price0);
          if (price > highestPrice24h) highestPrice24h = price;
          if (price < lowestPrice24h) lowestPrice24h = price;
        });
      }

      return {
        trading_pairs: tradingPairs,
        base_currency: pool.asset0.symbol,
        quote_currency: pool.asset1.symbol,
        last_price: lastPrice,
        lowest_ask: lowestAsk,
        highest_bid: highestBid,
        base_volume: baseVolume,
        quote_volume: quoteVolume,
        price_change_percent_24h: priceChangePercent24h,
        highest_price_24h: highestPrice24h,
        lowest_price_24h: lowestPrice24h,
      };
    });

    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    console.error("Error fetching summary data:", error);
    return NextResponse.json(
      {error: "Failed to fetch summary data"},
      {status: 500}
    );
  }
}

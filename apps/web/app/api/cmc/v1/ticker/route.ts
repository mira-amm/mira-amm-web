/**
 * CoinMarketCap Ticker Endpoint v1
 * @api {get} /api/cmc/v1/ticker Get 24-hour pricing and volume summary for each market pair
 */
import {NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {SQDIndexerUrl} from "@/web/src/utils/constants";
import {getCMCAssetId} from "../../utils/cmc-asset-map";

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
  snapshots: Array<{
    volumeAsset0Decimal: string;
    volumeAsset1Decimal: string;
  }>;
}

export async function GET() {
  try {
    const timestamp24hAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

    const query = gql`
      query GetAllPoolsForTicker($timestamp24h: Int!) {
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
          snapshots(where: {timestamp_gt: $timestamp24h}) {
            volumeAsset0Decimal
            volumeAsset1Decimal
          }
        }
      }
    `;

    const {pools} = await request<{pools: PoolData[]}>({
      url: SQDIndexerUrl,
      document: query,
      variables: {timestamp24h: timestamp24hAgo},
    });

    // Transform to CoinMarketCap ticker format
    const tickerResponse: Record<string, any> = {};

    // Process each pool and fetch CMC IDs dynamically
    for (const pool of pools) {
      const pairKey = `${pool.asset0.symbol}_${pool.asset1.symbol}`;

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

      const lastPrice = parseFloat(pool.price0);

      // Get CMC asset IDs dynamically (null if not found in CMC)
      const baseId = await getCMCAssetId(pool.asset0.symbol || "");
      const quoteId = await getCMCAssetId(pool.asset1.symbol || "");

      tickerResponse[pairKey] = {
        base_id: baseId ? parseInt(baseId) : null,
        quote_id: quoteId ? parseInt(quoteId) : null,
        last_price: lastPrice,
        base_volume: baseVolume,
        quote_volume: quoteVolume,
        isFrozen: 0, // Market is enabled
      };
    }

    return NextResponse.json(tickerResponse, {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    console.error("Error fetching ticker data:", error);
    return NextResponse.json(
      {error: "Failed to fetch ticker data"},
      {status: 500}
    );
  }
}

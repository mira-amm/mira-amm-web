/**
 * CoinMarketCap Assets Endpoint v1
 * @api {get} /api/cmc/v1/assets Get detailed summary for each currency available on the exchange
 */
import {NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {SQDIndexerUrl} from "@/web/src/utils/constants";
import {getCMCAssetId} from "../../utils/cmc-asset-map";

interface AssetData {
  id: string;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
}

// Fuel network explorer URL
const FUEL_EXPLORER_URL = "https://app-mainnet.fuel.network";

export async function GET() {
  try {
    const query = gql`
      query GetAllAssets {
        assets(orderBy: tradeVolume_DESC) {
          id
          name
          symbol
          decimals
        }
      }
    `;

    const {assets} = await request<{assets: AssetData[]}>({
      url: SQDIndexerUrl,
      document: query,
    });

    // Transform to CoinMarketCap format
    const assetsResponse: Record<string, any> = {};

    // Process each asset and fetch CMC IDs dynamically
    for (const asset of assets) {
      const symbol = asset.symbol || "UNKNOWN";

      // Standard fees for Mira DEX
      const makerFee = "0.003"; // 0.3% for V1 pools
      const takerFee = "0.003"; // 0.3% for V1 pools

      // Get CMC unified cryptoasset ID dynamically (null if not found)
      const cmcId = await getCMCAssetId(symbol);

      assetsResponse[symbol] = {
        name: asset.name || symbol,
        unified_cryptoasset_id: cmcId ? parseInt(cmcId) : null, // Convert to integer or null
        can_withdraw: true,
        can_deposit: true,
        min_withdraw: "0.000001", // Example minimum
        max_withdraw: "1000000", // Example maximum
        maker_fee: makerFee,
        taker_fee: takerFee,
        contractAddress: asset.id,
        contractAddressUrl: `${FUEL_EXPLORER_URL}/asset/${asset.id}`,
      };
    }

    return NextResponse.json(assetsResponse, {
      headers: {
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error("Error fetching assets data:", error);
    return NextResponse.json(
      {error: "Failed to fetch assets data"},
      {status: 500}
    );
  }
}

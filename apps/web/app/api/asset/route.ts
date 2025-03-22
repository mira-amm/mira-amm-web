/**
 * @api {get} /asset Get details of an asset by ID
 */
import {NextRequest, NextResponse} from "next/server";
import {GeckoTerminalQueryResponses} from "@/web/shared/types";
import {MainnetUrl} from "../../../../../libs/web/src/utils/constants";

// Handle GET requests for /api/asset
export async function GET(req: NextRequest) {
  // Extract the 'id' query parameter from the URL
  const url = new URL(req.url);
  const assetId = url.searchParams.get("id");
  // Return a 400 error if no 'id' is provided
  if (!assetId) {
    return NextResponse.json({error: "Asset ID is required"}, {status: 400});
  }

  try {
    const assetUrl = `${MainnetUrl}/assets/${assetId}`;

    // Fetch asset details
    const response = await fetch(assetUrl);

    // Handle non-OK HTTP responses
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          {error: `Asset with ID: ${assetId} not found`},
          {status: 404},
        );
      }
      throw new Error(`Failed to fetch asset data: ${response.statusText}`);
    }

    const asset = await response.json();

    // Transforming to desired format for Gecko Terminal
    const transformedAsset: GeckoTerminalQueryResponses.Asset = {
      id: asset.assetId,
      name: asset.name,
      symbol: asset.symbol,
      decimals: asset.decimals,
      totalSupply: asset.totalSupply,
      circulatingSupply: asset.circulatingSupply,
    };

    const assetResponse: GeckoTerminalQueryResponses.AssetResponse = {
      asset: transformedAsset,
    };

    return NextResponse.json(assetResponse);
  } catch (error) {
    console.error("Error fetching asset data:", error);
    return NextResponse.json(
      {error: "Failed to fetch asset data"},
      {status: 500},
    );
  }
}

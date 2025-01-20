/**
 * @api {get} /asset Get details of an asset by ID
 */
import {NextRequest, NextResponse} from "next/server";
import {GeckoTerminalQueryResponses} from "../shared/types";

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
    /***********************************
     * Question 1: This Url is given in the API spec. Have kept it here instead of constants file which 
     * already has NetworkUrl but is slightly different,  what should be this name and how
     different is this from NetworkUrl given in constants file which is v1
     */
    const assetUrl = `https://mainnet-explorer.fuel.network/assets/${assetId}`;

    // Fetch asset details
    const response = await fetch(assetUrl);

    // Handle non-OK HTTP responses
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({error: "Asset not found"}, {status: 404});
      }
      throw new Error(`Failed to fetch asset data: ${response.statusText}`);
    }

    const asset = await response.json();

    // Transforming to desired format for Gecko Terminal
    const transformedAsset: GeckoTerminalQueryResponses.Asset = {
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      decimals: asset.decimals,
      totalSupply: asset.supply,
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

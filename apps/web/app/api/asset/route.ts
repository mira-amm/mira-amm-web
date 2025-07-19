import {NextRequest, NextResponse} from "next/server";
import {GeckoTerminalQueryResponses} from "@/web/shared/types";
// import { MainnetUrl } from "../../../../../libs/web/src/utils/constants";

export const MainnetUrl = "https://mainnet-explorer.fuel.network";

const cache = new Map<string, GeckoTerminalQueryResponses.AssetResponse>();
const CACHE_TTL = 60 * 1000;
const cacheTimestamps = new Map<string, number>();

/**
 * @api {get} /api/asset Get details of an asset by ID
 */
export async function GET(req: NextRequest) {
  const assetId = new URL(req.url).searchParams.get("id");

  if (!assetId) {
    return NextResponse.json({error: "Asset ID is required"}, {status: 400});
  }

  const now = Date.now();
  const cached = cache.get(assetId);
  const cachedAt = cacheTimestamps.get(assetId);

  if (cached && cachedAt && now - cachedAt < CACHE_TTL) {
    return NextResponse.json(cached, {
      status: 200,
      headers: {
        "X-Cache-Hit": "true",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  const assetUrl = `${MainnetUrl}/assets/${assetId}`;

  try {
    const response = await fetch(assetUrl, {
      next: {revalidate: 60},
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          {error: `Asset with ID: ${assetId} not found`},
          {status: 404}
        );
      }
      throw new Error(`Failed to fetch asset data: ${response.statusText}`);
    }

    const asset = await response.json();

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

    cache.set(assetId, assetResponse);
    cacheTimestamps.set(assetId, now);

    return NextResponse.json(assetResponse, {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    console.error("Error fetching asset data:", error);
    return NextResponse.json(
      {error: "Failed to fetch asset data"},
      {status: 500}
    );
  }
}

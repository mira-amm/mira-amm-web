import {NextRequest, NextResponse} from "next/server";
import path from "path";
import {JSONEpochConfigService} from "@/src/models/campaigns/JSONEpochConfigService";
import {FileCachedPointsPerUserService} from "@/src/models/points/Points";
import {SENTIO_POINTS_ENDPOINT} from "@/src/utils/constants";

// Cache header settings
// These are set low as we are cacheing in a server side file
const CACHE_DURATION = 60; // 1 minute
const CACHE_STALE_WHILE_REVALIDATE = 60; // 1 minute

// Cache control headers
// The response is not permissioned and should yield the same results no matter who is requesting it
const cacheControlHeaders = {
  "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!process.env.SENTIO_API_KEY || !process.env.SENTIO_API_URL) {
    throw new Error("SENTIO_API_KEY and SENTIO_API_URL must be set");
  }

  const pointsService = new FileCachedPointsPerUserService(
    process.env.SENTIO_API_KEY,
    SENTIO_POINTS_ENDPOINT,
    new JSONEpochConfigService(
      path.join(process.cwd(), "../../libs/web/src", "models", "campaigns.json"),
    ),
  );

  const queryParams = request.nextUrl.searchParams;
  const address = queryParams.get("address");
  const limit = queryParams.get("limit");
  const offset = queryParams.get("offset");

  const points = await pointsService.getPoints({
    address: address ?? undefined,
    limit: limit ? parseInt(limit) : undefined,
    offset: offset ? parseInt(offset) : undefined,
  });

  return new NextResponse(JSON.stringify(points), {
    status: 200,
    headers: cacheControlHeaders,
  });
}

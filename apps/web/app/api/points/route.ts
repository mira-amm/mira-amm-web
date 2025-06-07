import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { JSONEpochConfigService } from "@/src/models/campaigns/JSONEpochConfigService";
import { FileCachedPointsPerUserService } from "@/src/models/points/Points";
import { SENTIO_POINTS_ENDPOINT } from "@/src/utils/constants";

const CACHE_DURATION = 60;
const CACHE_STALE_WHILE_REVALIDATE = 60;
const cacheControlHeaders = {
  "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
  "Content-Type": "application/json",
};

const epochConfigService = new JSONEpochConfigService(
  path.join(process.cwd(), "../../libs/web/src", "models", "campaigns.json")
);

const pointsService = process.env.SENTIO_API_KEY
  ? new FileCachedPointsPerUserService(
      process.env.SENTIO_API_KEY,
      SENTIO_POINTS_ENDPOINT,
      epochConfigService
    )
  : null;

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!pointsService) {
    return new NextResponse(
      JSON.stringify({ message: "SENTIO_API_KEY and SENTIO_API_URL must be set" }),
      { status: 500, headers: cacheControlHeaders }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address") || undefined;
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");

  const parsedLimit = limit ? Number(limit) : undefined;
  const parsedOffset = offset ? Number(offset) : undefined;

  try {
    const points = await pointsService.getPoints({
      address,
      limit: parsedLimit,
      offset: parsedOffset,
    });

    return new NextResponse(JSON.stringify(points), {
      status: 200,
      headers: cacheControlHeaders,
    });
  } catch (err) {
    console.error("Unhandled error in /api/points:", err);
    return new NextResponse(
      JSON.stringify({ message: (err as Error).message }),
      { status: 500, headers: cacheControlHeaders }
    );
  }
}

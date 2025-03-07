import {NextRequest, NextResponse} from "next/server";
import path from "path";
import {JSONEpochConfigService} from "@/src/models/campaigns/JSONEpochConfigService";
import {NotFoundError} from "@/src/utils/errors";
import {TmpFilePointsPerUserService} from "@/src/models/points/Points";

// Cache header settings
const CACHE_DURATION = 3600; // 60 minutes
const CACHE_STALE_WHILE_REVALIDATE = 1800;

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    if (!process.env.SENTIO_API_KEY || !process.env.SENTIO_API_URL) {
      throw new Error("SENTIO_API_KEY and SENTIO_API_URL must be set");
    }

    const pointsService = new TmpFilePointsPerUserService(
      process.env.SENTIO_API_KEY,
      process.env.SENTIO_API_URL,
      new JSONEpochConfigService(
        path.join(process.cwd(), "src", "models", "campaigns.json"),
      ),
    );

    const points = await pointsService.updateLatestPoints();

    if (!points) {
      return new NextResponse(JSON.stringify({}), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    return new NextResponse(JSON.stringify(points), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${CACHE_DURATION}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
      },
    });
  } catch (e) {
    if (e instanceof NotFoundError) {
      // return empty value
      return new NextResponse(JSON.stringify({}), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, max-age=${CACHE_DURATION}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
        },
      });
    } else {
      return new NextResponse(JSON.stringify({message: (e as Error).message}), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, max-age=${CACHE_DURATION}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
        },
      });
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!process.env.SENTIO_API_KEY || !process.env.SENTIO_API_URL) {
    throw new Error("SENTIO_API_KEY and SENTIO_API_URL must be set");
  }

  const pointsService = new TmpFilePointsPerUserService(
    process.env.SENTIO_API_KEY,
    process.env.SENTIO_API_URL,
    new JSONEpochConfigService(
      path.join(process.cwd(), "src", "models", "campaigns.json"),
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
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${CACHE_DURATION}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
    },
  });
}

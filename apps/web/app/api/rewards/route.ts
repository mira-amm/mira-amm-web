/**
 * @api {get} /api/rewards Get rewards for a given user and epoch based on their LP tokens
 */
import {JSONEpochConfigService} from "@/src/models/campaigns/JSONEpochConfigService";
import {SentioJSONUserRewardsService} from "@/src/models/rewards/UserRewards";
import {NotFoundError} from "@/src/utils/errors";
import {NextRequest, NextResponse} from "next/server";
import path from "path";

const CACHE_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=1800",
};

function createErrorResponse(status: number, message: string | object) {
  return new NextResponse(
    JSON.stringify(typeof message === "string" ? {message} : message),
    {
      status,
      headers: CACHE_HEADERS,
    }
  );
}

// Example query
// Key consideration, poolId does not include the hex prefix '0x'
// curl --request GET \
//   --url 'http://localhost:3000/api/rewards/?\
//  poolIds=286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b-f8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07-false&\
//  epochNumbers=1&\
//  userId=0x69e6223f2adf576dfefb21873b78e31ba228b094d05f74f59ea60cbd1bf87d0d'

// poolIds and epochNumbers are comma separated,
// eg: epochNumbers=1,2,3&...
export async function GET(request: NextRequest) {
  if (!process.env.SENTIO_API_KEY || !process.env.SENTIO_API_URL) {
    return createErrorResponse(
      500,
      "Sentio API environment variables are not set."
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const epochNumbersParam = searchParams.get("epochNumbers");
  const poolIdsParam = searchParams.get("poolIds");

  const missingParams = [];
  if (!userId) missingParams.push("userId");
  if (!epochNumbersParam) missingParams.push("epochNumbers");
  if (!poolIdsParam) missingParams.push("poolIds");

  if (missingParams.length > 0) {
    return createErrorResponse(
      400,
      `Missing required parameters: ${missingParams.join(", ")}`
    );
  }

  const epochNumbers = epochNumbersParam!.split(",").map(Number);
  const poolIds = poolIdsParam!.split(",");

  const userRewardsService = new SentioJSONUserRewardsService(
    process.env.SENTIO_API_URL,
    process.env.SENTIO_API_KEY,
    new JSONEpochConfigService(
      path.join(process.cwd(), "../../libs/web/src", "models", "campaigns.json")
    )
  );

  try {
    const rewards = await userRewardsService.getRewards({
      userId,
      epochNumbers,
      poolIds,
    });

    return new NextResponse(JSON.stringify(rewards), {
      status: 200,
      headers: CACHE_HEADERS,
    });
  } catch (e) {
    if (e instanceof NotFoundError) {
      return new NextResponse(JSON.stringify({}), {
        status: 200,
        headers: CACHE_HEADERS,
      });
    }

    console.error("Unhandled error in /api/rewards:", e);
    return createErrorResponse(500, (e as Error).message);
  }
}

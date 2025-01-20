/**
 * @api {get} /api/rewards Get rewards for a given user and epoch based on their LP tokens
 */
import {JSONEpochConfigService} from "@/src/models/campaigns/Campaign";
import {SentioJSONUserRewardsService} from "@/src/models/rewards/UserRewards";
import {NotFoundError} from "@/src/utils/errors";
import {NextRequest, NextResponse} from "next/server";
import path from "path";

// Cache header settings
const CACHE_DURATION = 3600; // 60 minutes
const CACHE_STALE_WHILE_REVALIDATE = 1800;

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
  try {
    if (!process.env.SENTIO_API_KEY) {
      throw new Error("No Sentio API key configured");
    }
    if (!process.env.SENTIO_API_URL) {
      throw new Error("No Sentio API URL configured");
    }
    const searchParams = request.nextUrl.searchParams;
    const epochNumbers = searchParams.get("epochNumbers");
    const poolIds = searchParams.get("poolIds");
    const userId = searchParams.get("userId");

    const missingParams = [];
    if (!epochNumbers) missingParams.push("epochNumbers");
    if (!poolIds) missingParams.push("poolIds");
    if (!userId) missingParams.push("userId");

    if (missingParams.length > 0) {
      return new NextResponse(
        JSON.stringify({
          message: `Missing required parameters: ${missingParams.join(", ")}`,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=${CACHE_DURATION}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
          },
        },
      );
    }

    const userRewardsService = new SentioJSONUserRewardsService(
      process.env.SENTIO_API_URL,
      process.env.SENTIO_API_KEY,
      new JSONEpochConfigService(
        path.join(process.cwd(), "src", "models", "campaigns.json"),
      ),
    );
    const rewards = await userRewardsService.getRewards({
      epochNumbers: epochNumbers!.split(",").map(Number),
      poolIds: poolIds!.split(","),
      userId: userId!,
    });

    return new NextResponse(JSON.stringify(rewards), {
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

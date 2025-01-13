/**
 * @api {get} /api/rewards Get rewards for a given user and epoch based on their LP tokens
 */
import {JSONEpochConfigService} from "@/src/models/campaigns/Campaign";
import {SentioJSONUserRewardsService} from "@/src/models/rewards/UserRewards";
import {NotFoundError} from "@/src/utils/errors";
import {NextRequest, NextResponse} from "next/server";
import path from "path";

// Example query
// http://${url}/api/rewards/?userId=0x69e6223f2adf576dfefb21873b78e31ba228b094d05f74f59ea60cbd1bf87d0d&amount=1000&epochNumber=1&poolId=286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b-f8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07-false
export async function GET(request: NextRequest) {
  try {
    if (!process.env.SENTIO_API_KEY) {
      throw new Error("No Sentio API key configured");
    }
    if (!process.env.SENTIO_API_URL) {
      throw new Error("No Sentio API URL configured");
    }
    const searchParams = request.nextUrl.searchParams;
    const epochNumber = searchParams.get("epochNumber");
    const poolId = searchParams.get("poolId");
    const userId = searchParams.get("userId");
    const amount = searchParams.get("amount");

    const missingParams = [];
    if (!epochNumber) missingParams.push("epochNumber");
    if (!poolId) missingParams.push("poolId");
    if (!userId) missingParams.push("userId");
    if (!amount) missingParams.push("amount");

    if (missingParams.length > 0) {
      return new NextResponse(
        JSON.stringify({
          message: `Missing required parameters: ${missingParams.join(", ")}`,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const userRewardsService = new SentioJSONUserRewardsService(
      process.env.SENTIO_API_URL,
      process.env.SENTIO_API_KEY,
      new JSONEpochConfigService(
        path.join(process.cwd(), "src", "models", "campaigns.json")
      )
    );
    const rewards = await userRewardsService.getRewards({
      epochNumber: Number(epochNumber),
      poolId: poolId!,
      userId: userId!,
      amount: Number(amount),
    });

    return new NextResponse(JSON.stringify(rewards), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    if (e instanceof NotFoundError) {
      // return empty value
      return new NextResponse(JSON.stringify({}), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else {
      return new NextResponse(JSON.stringify({message: (e as Error).message}), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }
}

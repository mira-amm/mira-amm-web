/**
 * @api {get} /api/rewards Get rewards for a given user and epoch based on their LP tokens
 */
import {JSONEpochConfigService} from "@/src/models/campaigns/Campaign";
import {SentioJSONUserRewardsService} from "@/src/models/rewards/UserRewards";
import {NotFoundError} from "@/src/utils/errors";
import {NextRequest, NextResponse} from "next/server";
import path from "path";

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

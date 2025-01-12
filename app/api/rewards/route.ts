import { SentioJSONUserRewardsService } from "@/src/models/rewards/UserRewards";
import { NotFoundError } from "@/src/utils/errors";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    if (!process.env.SENTIO_API_KEY) {
      throw new Error("No Sentio API key configured");
    }
    if (!process.env.SENTIO_API_URL) {
      throw new Error("No Sentio API URL configured");
    }
    const searchParams = request.nextUrl.searchParams;
    const epochStart = searchParams.get('epochStart');
    const epochEnd = searchParams.get('epochEnd');
    const lpToken = searchParams.get('lpToken');
    const userId = searchParams.get('userId');
    const amount = searchParams.get('amount');

    if (!epochStart || !epochEnd || !lpToken || !userId) {
      return new NextResponse(JSON.stringify({ message: "Missing required parameters" }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const userRewardsService = new SentioJSONUserRewardsService(
      process.env.SENTIO_API_URL,
      process.env.SENTIO_API_KEY
    );
    const rewards = await userRewardsService.getRewards({
      epochStart: new Date(epochStart),
      epochEnd: new Date(epochEnd),
      lpToken: lpToken,
      userId: userId,
      amount: Number(amount)
    });

    return new NextResponse(JSON.stringify(rewards), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    if (e instanceof NotFoundError) {
      // return empty value
      return new NextResponse(JSON.stringify({}), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      return new NextResponse(JSON.stringify({ message: (e as Error).message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
}

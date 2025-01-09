import { MockJSONUserRewardsService } from "@/src/models/rewards/UserRewards";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {

    const userRewardsService = new MockJSONUserRewardsService("src/models/userRewards.json");

    const rewards = await userRewardsService.getRewards();

    return new NextResponse(JSON.stringify(rewards), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

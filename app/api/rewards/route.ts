import { SentioJSONUserRewardsService } from "@/src/models/rewards/UserRewards";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {

  // const userRewardsService = new SentioJSONUserRewardsService("src/models/userRewards.json");
  const searchParams = request.nextUrl.searchParams;

  const epochStart = searchParams.get('epochStart');
  const epochEnd = searchParams.get('epochEnd');
  const lpToken = searchParams.get('lpToken');
  const userId = searchParams.get('userId');
  const amount = searchParams.get('amount');

  if (!epochStart || !epochEnd || !lpToken || !userId) {
    return new NextResponse("Missing required parameters", {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  const owner = "fuellabs";
  const slug = "mira-mainnet";
  const url = `https://app.sentio.xyz/api/v1/analytics/${owner}/${slug}/sql/execute`;
  const userRewardsService = new SentioJSONUserRewardsService(url);

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
  })
}

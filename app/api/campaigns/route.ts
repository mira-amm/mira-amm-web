import {
  SentioJSONCampaignService,
  JSONEpochConfigService,
  // MockJSONCampaignService,
} from "@/src/models/campaigns/Campaign";
import { CampaignsResponse } from "@/src/models/campaigns/interfaces";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";

// TEST VALUES
// amount = 1000;
// epoch END = 2025-01-08T00:00:00.000Z
// epoch START = 2025-01-01T00:00:00.000Z
// lpToken = 0x6cae200e72709a4be568a816348d02a91e74b059f6fcbc069438981bd30cfbd1
// userId = 0x69e6223f2adf576dfefb21873b78e31ba228b094d05f74f59ea60cbd1bf87d0d

export async function GET(request: NextRequest) {

  // Get campaign by ID
  const searchParams = request.nextUrl.searchParams
  const epochNumbers = searchParams.get('epochNumbers')
  const poolIds = searchParams.get('poolIds')
  const owner = "fuellabs";
  const slug = "mira-mainnet";
  const url = `https://app.sentio.xyz/api/v1/analytics/${owner}/${slug}/sql/execute`;
  const campaignService = new SentioJSONCampaignService(
    // TODO: change to env variable and modify to real value
    url,
    // TODO: complete
    new JSONEpochConfigService("src/models/campaigns.json")
  );

  const campaigns = await campaignService.getCampaigns({
    epochNumbers: epochNumbers
      ? (epochNumbers as string).split(",").map(Number)
      : undefined,
    poolIds: poolIds ? (poolIds as string).split(",") : undefined,
  });

  return new NextResponse(JSON.stringify(campaigns), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

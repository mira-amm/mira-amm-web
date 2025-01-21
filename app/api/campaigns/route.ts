/**
 * @api {get} /campaigns Get list of epochs and their campaigns
 */
import {
  SentioJSONCampaignService,
  JSONEpochConfigService,
} from "@/src/models/campaigns/Campaign";
import {NextRequest, NextResponse} from "next/server";
import path from "path";

// Cache header settings
const CACHE_DURATION = 300; // 5 minutes
const CACHE_STALE_WHILE_REVALIDATE = 150;

// Example query
//   --url 'http://localhost:3000/api/campaigns/'
// if you want to filter for poolIds, or epochNumbers, you can add them as query params
// They take multiple values, comma separated
// eg: epochNumbers=1,2,3&...
// eg: poolIds=286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b-f8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07-false&...

export async function GET(request: NextRequest) {
  try {
    if (!process.env.SENTIO_API_KEY) {
      throw new Error("No Sentio API key provided");
    }
    if (!process.env.SENTIO_API_URL) {
      throw new Error("No Sentio API URL provided");
    }

    // Get campaign by ID
    const searchParams = request.nextUrl.searchParams;
    const epochNumbers = searchParams.get("epochNumbers");
    const poolIds = searchParams.get("poolIds");
    const includeAPR = searchParams.get("includeAPR");
    const campaignService = new SentioJSONCampaignService(
      process.env.SENTIO_API_URL,
      process.env.SENTIO_API_KEY,
      new JSONEpochConfigService(
        path.join(process.cwd(), "src", "models", "campaigns.json"),
      ),
    );

    const campaigns = await campaignService.getCampaigns({
      epochNumbers: epochNumbers
        ? (epochNumbers as string).split(",").map(Number)
        : undefined,
      poolIds: poolIds ? (poolIds as string).split(",") : undefined,
      includeAPR: includeAPR === "true",
    });

    return new NextResponse(JSON.stringify(campaigns), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${CACHE_DURATION}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
      },
    });
  } catch (e) {
    return new NextResponse(JSON.stringify({message: (e as Error).message}), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${CACHE_DURATION}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
      },
    });
  }
}

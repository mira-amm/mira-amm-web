/**
 * @api {get} /campaigns Get list of epochs and their campaigns
 */
import {SentioJSONCampaignService} from "@/src/models/campaigns/Campaign";
import {JSONEpochConfigService} from "@/src/models/campaigns/JSONEpochConfigService";
import {NextRequest, NextResponse} from "next/server";
import path from "path";

const CACHE_DURATION = 300;
const CACHE_STALE_WHILE_REVALIDATE = 150;

// Example query
//   --url 'http://localhost:3000/api/campaigns/'
// if you want to filter for poolIds, or epochNumbers, you can add them as query params
// They take multiple values, comma separated
// eg: epochNumbers=1,2,3&...
// eg: poolIds=286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b-f8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07-false&...

const CACHE_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": `public, max-age=${CACHE_DURATION}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
};

const epochConfigService = new JSONEpochConfigService(
  path.join(process.cwd(), "../../libs/web/src", "models", "campaigns.json"),
);

const campaignService =
  process.env.SENTIO_API_KEY && process.env.SENTIO_API_URL
    ? new SentioJSONCampaignService(
        process.env.SENTIO_API_URL,
        process.env.SENTIO_API_KEY,
        epochConfigService,
      )
    : null;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    if (!campaignService) {
      throw new Error("No Sentio API key or URL provided");
    }

    const searchParams = request.nextUrl.searchParams;
    const epochNumbers = searchParams.get("epochNumbers");
    const poolIds = searchParams.get("poolIds");
    const includeAPR = searchParams.get("includeAPR") === "true";

    const campaigns = await campaignService.getCampaigns({
      epochNumbers: epochNumbers?.split(",").map(Number),
      poolIds: poolIds?.split(","),
      includeAPR,
    });

    return new NextResponse(JSON.stringify(campaigns), {
      status: 200,
      headers: CACHE_HEADERS,
    });
  } catch (e) {
    console.error("Error in /api/campaigns:", e);
    return new NextResponse(JSON.stringify({message: (e as Error).message}), {
      status: 500,
      headers: CACHE_HEADERS,
    });
  }
}

/**
 * @api {get} /campaigns Get list of epochs and their campaigns
 */
import {
  SentioJSONCampaignService,
  JSONEpochConfigService
} from "@/src/models/campaigns/Campaign";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    if (!process.env.SENTIO_API_KEY) {
      throw new Error("No Sentio API key provided");
    }
    if (!process.env.SENTIO_API_URL) {
      throw new Error("No Sentio API URL provided");
    }

    // Get campaign by ID
    const searchParams = request.nextUrl.searchParams
    const epochNumbers = searchParams.get('epochNumbers');
    const poolIds = searchParams.get('poolIds');
    const includeAPR = searchParams.get('includeAPR');
    const campaignService = new SentioJSONCampaignService(
      process.env.SENTIO_API_URL,
      process.env.SENTIO_API_KEY,
      new JSONEpochConfigService("src/models/campaigns.json")
    );

    const campaigns = await campaignService.getCampaigns({
      epochNumbers: epochNumbers
        ? (epochNumbers as string).split(",").map(Number)
        : undefined,
      poolIds: poolIds ? (poolIds as string).split(",") : undefined,
      includeAPR: includeAPR === "true"
    });

    return new NextResponse(JSON.stringify(campaigns), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    } catch (e) {
      return new NextResponse(JSON.stringify({ message: (e as Error).message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
}

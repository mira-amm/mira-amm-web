import {
  SentioJSONCampaignService,
  JSONEpochConfigService,
  // MockJSONCampaignService,
} from "@/src/models/campaigns/Campaign";
import {CampaignsResponse} from "@/src/models/campaigns/interfaces";
import {NextApiRequest, NextApiResponse} from "next";

// TEST VALUES
// amount = 1000;
// epoch END = 2025-01-08T00:00:00.000Z
// epoch START = 2025-01-01T00:00:00.000Z
// lpToken = 0x6cae200e72709a4be568a816348d02a91e74b059f6fcbc069438981bd30cfbd1
// userId = 0x69e6223f2adf576dfefb21873b78e31ba228b094d05f74f59ea60cbd1bf87d0d

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CampaignsResponse | {error: string}>
) {
  const { method } = req;
  console.log("hit campaigns api");

  try {
    switch (method) {
      case "GET":
        // Get campaign by ID
        const {epochNumbers, poolIds} = req.query;

        const campaignService = new SentioJSONCampaignService(
          // TODO: change to env variable and modify to real value
          "https://fake-sentio-api.com/v1/campaigns",
          // TODO: complete
          new JSONEpochConfigService("src/models/campaigns.json")
        );
        // const campaignService = new MockJSONCampaignService("src/models/campaigns.json");

        const campaigns = await campaignService.getCampaigns({
          epochNumbers: epochNumbers
            ? (epochNumbers as string).split(",").map(Number)
            : undefined,
          poolIds: poolIds ? (poolIds as string[]) : undefined,
        });

        return res.status(200).json({campaigns});

      default:
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error("Campaign API Error:", error);
    return res.status(500).json({error: "Internal Server Error"});
  }
}

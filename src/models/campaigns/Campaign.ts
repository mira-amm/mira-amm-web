import axios from "axios";
import fs from "fs";
import {Campaign, CampaignQueryParams, CampaignService} from "./interfaces";
import {EpochConfig, EpochConfigService} from "./interfaces";

export class JSONEpochConfigService implements EpochConfigService {
  constructor(private readonly epochConfigPath: string) {}

  getEpochs(epochNumbers?: number[]): EpochConfig[] {
    // load from json file
    const epochs: EpochConfig[] = JSON.parse(
      fs.readFileSync(this.epochConfigPath, "utf8")
    );

    if (epochNumbers) {
      return epochs.filter((epoch) => epochNumbers.includes(epoch.number));
    }

    return epochs;
  }
}

// Specific implementation for Sentio
export class SentioJSONCampaignService implements CampaignService {
  private readonly apiUrl: string;
  private readonly epochConfigService: EpochConfigService;

  constructor(apiUrl: string, epochConfigService: EpochConfigService) {
    this.apiUrl = apiUrl;
    this.epochConfigService = epochConfigService;
  }

  async getCampaigns(params?: CampaignQueryParams): Promise<Campaign[]> {
    try {
      if (!process.env.SENTIO_API_KEY) {
        throw new Error("No Sentio API key provided");
      }

      const epochConfig = this.epochConfigService.getEpochs(
        params?.epochNumbers ? params.epochNumbers : undefined
      );

      const campaignsWithoutApr: Campaign[] = epochConfig
        .filter((epoch) => {
          // return true if no epochNumbers are provided
          return (
            !params?.epochNumbers || params?.epochNumbers.includes(epoch.number)
          );
        })
        .flatMap((epoch) => {
          // flatten the epoch to just the campaigns
          return epoch.campaigns
            .filter(campaign => {
              // return true if no poolIds are provided
              return (
                !params?.poolIds || params?.poolIds.includes(campaign.pool.id)
              );
            }).map((campaign) => ({
            epoch: {
              startDate: epoch.startDate,
              endDate: epoch.endDate,
              number: epoch.number,
            },
            ...campaign,
            status: "inprogress",
          }));
        });

      if (params?.includeAPR) {
        // get each campaign from sentio
        const options = {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'api-key': process.env.SENTIO_API_KEY
          },
          body: JSON.stringify({
            sqlQuery: {
              sql: 'select 1'
            }
          })
        };
        try {
          const campaigns = campaignsWithoutApr;
          for (const campaign of campaigns) {
            // pass:
            // campaignRewardsAmount
            // poolId
            const response = await fetch(this.apiUrl, options);
            const json = await response.json();
            const currentAPR = json.result.rows[0]["1"];
            campaign.currentAPR = currentAPR;
          }
          return campaigns;
        } catch (error) {
          if (axios.isAxiosError(error)) {
            throw new Error(`Failed to fetch campaigns: ${error.message}`);
          }
          throw error;
        }
      } else {
        return campaignsWithoutApr;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch campaigns: ${error.message}`);
      }
      throw error;
    }
  }
}

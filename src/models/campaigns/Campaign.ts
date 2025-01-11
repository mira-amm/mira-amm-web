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
          let status: "inprogress" | "planned" | "completed";
          const currentTime = new Date();
          if (currentTime >= new Date(epoch.startDate) && currentTime <= new Date(epoch.endDate)) {
            status = "inprogress";
          } else if (currentTime < new Date(epoch.startDate)) {
            status = "planned";
          } else {
            status = "completed";
          }
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
            status: status,
          }));
        });

      if (params?.includeAPR) {
        const sql = fs.readFileSync("src/queries/CampaignsAPR.sql", 'utf8');

        // get each campaign from sentio
        try {
          const campaigns = campaignsWithoutApr;
          for (const campaign of campaigns) {
            const options = {
              method: 'POST',
              headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'api-key': process.env.SENTIO_API_KEY
              },
              body: JSON.stringify({
                sqlQuery: {
                  parameters: {
                    fields: {
                      epochStart: { timestampValue: campaign.epoch.startDate },
                      epochEnd: { timestampValue: campaign.epoch.endDate },
                      poolId: { stringValue: campaign.pool.id },
                      // even though each campaign has a list of rewards
                      // there will always be a single element and the assetId will correspond to FUEL
                      // the amount is in FUEL and needs to be converted to USDC
                      // VerifiedAsset does not have FUEL so we cannot derive fuel symbol from assetId
                      // therefore we hardcode it
                      campaignRewardsAmount: { intValue: campaign.rewards[0].amount },
                      campaignRewardToken: { stringValue: "fuel" }
                    }
                  },
                  sql: sql
                }
              })
            };
            const response = await fetch(this.apiUrl, options);
            const json = await response.json();
            if (json.result.rows.length == 0) {
              throw new Error(`Failed to fetch APR for campaign ${campaign.pool.id}`);
            }
            const currentAPR = json.result.rows[0].APR;
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

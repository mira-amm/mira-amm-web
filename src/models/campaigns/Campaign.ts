/*
 * Campaigns are a collection of pools that are incentivized for a given epoch.
 * For a given epoch, we want to determine the current APR for each campaign
 */
import {loadFile} from "@/src/utils/fileLoader";
import axios from "axios";
import {
  Campaign,
  CampaignQueryParams,
  CampaignService,
  CampaignsResponse,
  EpochConfig,
  EpochConfigService,
} from "./interfaces";
import path from "path";
import {convertDailyRewardsToTotalRewards} from "@/src/utils/common";

const campaignsQuery = loadFile(
  path.join(process.cwd(), "src", "queries", "CampaignsAPR.sql"),
);

export class JSONEpochConfigService implements EpochConfigService {
  private readonly epochs: EpochConfig[];

  constructor(epochConfigPath: string) {
    this.epochs = JSON.parse(loadFile(epochConfigPath));
  }

  getEpochs(epochNumbers?: number[]): EpochConfig[] {
    if (epochNumbers) {
      return this.epochs.filter((epoch) => epochNumbers.includes(epoch.number));
    }

    return this.epochs;
  }
}

// Specific implementation for Sentio
export class SentioJSONCampaignService implements CampaignService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly epochConfigService: EpochConfigService;

  constructor(
    apiUrl: string,
    apiKey: string,
    epochConfigService: EpochConfigService,
  ) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.epochConfigService = epochConfigService;
  }

  /**
   *
   * @param epochNumbers - Optional. If specified only returns campaigns for the specified epochNumbers
   * @param poolIds - Optional. If specified only returns campaigns for the specified poolIds
   * @param includeAPR - Optional. If true, includes the current APR for each campaign
   * @returns CampaignsResponse - A list of campaigns and the current APR for each as a fraction (multiply by 100 for percentage)
   *
   */
  async getCampaigns(params?: CampaignQueryParams): Promise<CampaignsResponse> {
    try {
      const epochConfig = this.epochConfigService.getEpochs(
        params?.epochNumbers ? params.epochNumbers : undefined,
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
          if (
            currentTime >= new Date(epoch.startDate) &&
            currentTime <= new Date(epoch.endDate)
          ) {
            status = "inprogress";
          } else if (currentTime < new Date(epoch.startDate)) {
            status = "planned";
          } else {
            status = "completed";
          }
          // flatten the epoch to just the campaigns
          return epoch.campaigns
            .filter((campaign) => {
              // return true if no poolIds are provided
              return (
                !params?.poolIds || params?.poolIds.includes(campaign.pool.id)
              );
            })
            .map((campaign) => ({
              epoch: {
                startDate: new Date(epoch.startDate),
                endDate: new Date(epoch.endDate),
                number: epoch.number,
              },
              ...campaign,
              status,
            }));
        });

      // Amount represents daily rewards than total epoch rewards
      // We have to adjust the amount based on the number of days in the epoch

      if (params?.includeAPR) {
        // get each campaign from sentio
        try {
          const campaignPromises = campaignsWithoutApr.map(async (campaign) => {
            const options = {
              method: "POST",
              headers: {
                accept: "application/json",
                "content-type": "application/json",
                "api-key": this.apiKey,
              },
              body: JSON.stringify({
                sqlQuery: {
                  parameters: {
                    fields: {
                      epochStart: {timestampValue: campaign.epoch.startDate},
                      epochEnd: {timestampValue: campaign.epoch.endDate},
                      poolId: {stringValue: campaign.pool.id},
                      // even though each campaign has a list of rewards
                      // there will always be a single element and the assetId will correspond to FUEL
                      // the amount is in FUEL and needs to be converted to USDC
                      // VerifiedAsset does not have FUEL so we cannot derive fuel symbol from assetId
                      // therefore we hardcode it
                      campaignRewardsAmount: {
                        intValue: convertDailyRewardsToTotalRewards(
                          campaign.rewards[0].dailyAmount,
                          campaign.epoch.startDate.toISOString(),
                          campaign.epoch.endDate.toISOString(),
                        ),
                      },
                      campaignRewardToken: {stringValue: "fuel"},
                    },
                  },
                  sql: campaignsQuery,
                },
              }),
            };

            try {
              const response = await fetch(this.apiUrl, options);
              const json = await response.json();
              if (json.code === 16) {
                console.log(json.message);
                throw new Error(json.message);
              }

              if (json.result.rows.length === 0) {
                throw new Error(
                  `Failed to fetch APR for campaign ${campaign.pool.id}`,
                );
              }

              if (!json.result.rows[0].APR) {
                throw new Error(
                  `Failed to fetch APR for campaign ${campaign.pool.id}`,
                );
              }

              campaign.currentAPR = json.result.rows[0].APR;
            } catch (error) {
              // Handle any errors that occur during fetch or processing
              console.error(
                `Error fetching APR for campaign ${campaign.pool.id}:`,
                error,
              );
            }
            return campaign;
          });

          const settledCampaigns = await Promise.allSettled(campaignPromises);
          const successfulCampaigns = settledCampaigns
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value);

          return {
            campaigns: successfulCampaigns,
          };
        } catch (error) {
          if (axios.isAxiosError(error)) {
            throw new Error(`Failed to fetch campaigns: ${error.message}`);
          }
          throw error;
        }
      } else {
        return {
          campaigns: campaignsWithoutApr,
        };
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch campaigns: ${error.message}`);
      }
      throw error;
    }
  }
}

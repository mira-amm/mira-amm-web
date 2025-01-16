/**
 * lpTokens entitle users to rewards
 * For a given epoch, we want to determine the amount of FUEL rewards a user received
 * based on the amount of LP tokens they own
 */
import {loadFile} from "@/src/utils/fileLoader";
import {
  UserRewardsQueryParams,
  UserRewardsResponse,
  UserRewardsService,
} from "./interfaces";
import {NotFoundError} from "@/src/utils/errors";
import path from "path";
import {Campaign, EpochConfigService} from "../campaigns/interfaces";
import {convertDailyRewardsToTotalRewards} from "@/src/utils/common";

const userPoolRewardsQuery = loadFile(
  path.join(process.cwd(), "src", "queries", "UserPoolRewards.sql"),
);
const addressPattern: RegExp = /^0x[a-fA-F0-9]{64}$/;
const timestampPattern: RegExp =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const getQueryOptions = (
  apiKey: string,
  epochStart: string,
  epochEnd: string,
  userId: string,
  lpToken: string,
  lpTokenAmount: number,
  campaignRewardToken: string,
) => {
  return {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sqlQuery: {
        sql: userPoolRewardsQuery,
        parameters: {
          fields: {
            epochStart: {timestampValue: epochStart},
            epochEnd: {timestampValue: epochEnd},
            userId: {stringValue: userId},
            lpToken: {stringValue: lpToken},
            rewardsAmount: {intValue: lpTokenAmount},
            campaignRewardToken: {stringValue: campaignRewardToken},
          },
        },
      },
    }),
  };
};

export class SentioJSONUserRewardsService implements UserRewardsService {
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
   * Rewards are calculated weighted average of percentage (num relative to total) of lp that a user provides over the epoch period
   *
   * @param epochNumbers - epoch number to fetch rewards for
   * @param poolIds - e.g. Mira poolid asset1-asset2-<stable?>; sentio leaves off the hex prefix '0x'
   * @param userId - Identifies a wallet
   * @returns UserRewardsResponse - Rewards for the user
   *
   */
  async getRewards(
    params: UserRewardsQueryParams,
  ): Promise<UserRewardsResponse> {
    const {epochNumbers, poolIds} = params;

    const userId = params.userId.toLowerCase();

    if (!addressPattern.test(userId)) {
      console.log(`Invalid wallet address: ${userId}`);
      throw new Error(`Invalid wallet address: ${userId}`);
    }

    // get campaign for poolId
    const epochs = await this.epochConfigService.getEpochs(epochNumbers);

    if (epochs.length === 0) {
      console.error(`No epoch found for epoch numbers ${epochNumbers}`);
      throw new NotFoundError(
        `No epoch found for epoch numbers ${epochNumbers}`,
      );
    }

    const matchingCampaigns = epochs
      .flatMap((epoch) =>
        poolIds.map((poolId) => ({
          epoch,
          campaign: epoch.campaigns.find(
            (campaign) => campaign.pool.id === poolId,
          ),
        })),
      )
      .filter(
        (item): item is {epoch: typeof item.epoch; campaign: Campaign} =>
          item.campaign !== undefined,
      );

    if (matchingCampaigns.length === 0) {
      console.error(
        `No campaign found for poolId ${poolIds} and epoch numbers ${epochNumbers}`,
      );
      throw new NotFoundError(
        `No campaign found for poolId ${poolIds} and epoch numbers ${epochNumbers}`,
      );
    }

    const rewardsPromises = matchingCampaigns.map(async ({epoch, campaign}) => {
      const {startDate: epochStart, endDate: epochEnd} = epoch;

      const lpToken = campaign.pool.lpToken.toLowerCase();

      // check the validity of the json data

      if (!addressPattern.test(userId)) {
        console.log(`Invalid wallet address: ${userId}`);
        throw new Error(`Invalid wallet address: ${userId}`);
      }

      if (!timestampPattern.test(epochStart)) {
        console.log(`Invalid epoch start time: ${epochStart}`);
        throw new Error(`Invalid epoch start time: ${epochStart}`);
      }

      if (!timestampPattern.test(epochEnd)) {
        console.log(`Invalid epoch end time: ${epochEnd}`);
        throw new Error(`Invalid epoch end time: ${epochEnd}`);
      }

      const campaignRewardAmount = convertDailyRewardsToTotalRewards(
        campaign.rewards[0].dailyAmount,
        epochStart,
        epochEnd,
      );

      const options = getQueryOptions(
        this.apiKey,
        epochStart,
        epochEnd,
        userId,
        lpToken,
        campaignRewardAmount,
        "fuel",
      );

      const response = await fetch(this.apiUrl, options);

      const json = await response.json();

      if (json.code === 16) {
        console.log(json.message);
        throw new Error(json.message);
      }
      if (json.result.rows.length == 0) {
        console.log(
          `Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`,
        );
        throw new NotFoundError(
          `Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`,
        );
      }
      const fuelRewards = json.result.rows[0].FuelRewards;
      if (fuelRewards == null) {
        console.log(
          `Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`,
        );
        throw new NotFoundError(
          `Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`,
        );
      }

      return fuelRewards;
    });

    const rewards: number[] = await Promise.all(rewardsPromises).catch(
      (error) => {
        console.error(error);
        throw new Error(error);
      },
    );

    // sum up the rewards
    const fuelRewards = rewards.reduce((acc, reward) => acc + reward, 0);

    return {
      rewardsAmount: fuelRewards,
      userId: userId,
      epochNumbers: epochNumbers,
      poolIds: poolIds,
    };
  }
}

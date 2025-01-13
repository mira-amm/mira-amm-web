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
import {EpochConfigService} from "../campaigns/interfaces";

const userPoolRewardsQuery = loadFile(
  path.join(process.cwd(), "src", "queries", "UserPoolRewards.sql")
);
const addressPattern: RegExp = /^0x[a-fA-F0-9]{64}$/;
const timestampPattern: RegExp =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export class SentioJSONUserRewardsService implements UserRewardsService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly epochConfigService: EpochConfigService;

  constructor(
    apiUrl: string,
    apiKey: string,
    epochConfigService: EpochConfigService
  ) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.epochConfigService = epochConfigService;
  }
  /**
   * Rewards are calculated weighted average of percentage (num relative to total) of lp that a user provides over the epoch period
   *
   * @param epochNumber - epoch number to fetch rewards for
   * @param poolId - e.g. Mira poolid asset1-asset2-<stable?>; sentio leaves off the hex prefix '0x'
   * @param userId - Identifies a wallet
   * @param amount - amount of LP tokens the user owns
   * @returns UserRewardsResponse - Rewards for the user
   *
   */
  async getRewards(
    params: UserRewardsQueryParams
  ): Promise<UserRewardsResponse> {
    const {epochNumber, poolId, userId, amount} = params;

    if (!addressPattern.test(userId)) {
      console.log(`Invalid wallet address: ${userId}`);
      throw new Error(`Invalid wallet address: ${userId}`);
    }

    if (amount <= 0) {
      console.log(`Invalid amount: ${amount}`);
      throw new Error(`Invalid amount: ${amount}`);
    }

    // get campaign for poolId
    const epochs = await this.epochConfigService.getEpochs([epochNumber]);

    if (epochs.length === 0) {
      console.error(`No epoch found for epoch number ${epochNumber}`);
      throw new NotFoundError(`No epoch found for epoch number ${epochNumber}`);
    }

    const epoch = epochs[0];

    const campaign = epoch.campaigns.find(
      (campaign) => campaign.pool.id === poolId
    );

    if (!campaign) {
      console.error(`No campaign found for poolId ${poolId}`);
      throw new NotFoundError(`No campaign found for poolId ${poolId}`);
    }

    const {startDate: epochStart, endDate: epochEnd} = epoch;

    const lpToken = campaign.pool.lpToken;

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
              epochStart: {timestampValue: epochStart},
              epochEnd: {timestampValue: epochEnd},
              userId: {stringValue: userId},
              lpToken: {stringValue: lpToken},
              lpTokenAmount: {intValue: amount},
              campaignRewardToken: {stringValue: "fuel"},
            },
          },
          sql: userPoolRewardsQuery,
        },
      }),
    };

    const response = await fetch(this.apiUrl, options);
    const json = await response.json();

    if (json.code === 16) {
      console.log(json.message);
      throw new Error(json.message);
    }
    if (json.result.rows.length == 0) {
      console.log(
        `Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`
      );
      throw new NotFoundError(
        `Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`
      );
    }
    const fuelRewards = json.result.rows[0].FuelRewards;
    const usdRewards = json.result.rows[0].USDRewards;
    if (!fuelRewards || !usdRewards) {
      console.log(
        `Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`
      );
      throw new NotFoundError(
        `Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`
      );
    }

    return {
      rewardsAmount: fuelRewards,
      userId: userId,
      epochNumbers: [epochNumber],
      poolIds: [poolId],
      rewardsUSD: usdRewards,
    };
  }
}

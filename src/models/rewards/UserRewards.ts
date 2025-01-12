/**
 * lpTokens entitle users to rewards
 * For a given epoch, we want to determine the amount of FUEL/USDC rewards a user received
 * based on the amount of LP tokens they own
 */
import { loadFile } from "@/src/utils/fileLoader";
import { UserRewardsQueryParams, UserRewardsResponse, UserRewardsService } from "./interfaces";
import { NotFoundError } from "@/src/utils/errors";

const userPoolRewardsQuery = loadFile("src/queries/UserPoolRewards.sql");
const addressPattern: RegExp = /^0x[a-fA-F0-9]{64}$/;
const timestampPattern: RegExp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export class SentioJSONUserRewardsService implements UserRewardsService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }
  /**
   * Rewards are calculated weighted average of percentage (num relative to total) of lp that a user provides over the epoch period
   *
   * @param epochStart - Start of epoch
   * @param epochEnd - End of epoch
   * @param lpToken - e.g. lpUSDETH
   * @param userId - Identifies a wallet
   * @param amount - amount of LP tokens the user owns
   * @returns UserRewardsResponse - Rewards for the user
   *
   */
  async getRewards(params: UserRewardsQueryParams): Promise<UserRewardsResponse> {
    const { epochStart, epochEnd, lpToken, userId, amount } = params;

    if (!addressPattern.test(userId)) {
      console.log(`Invalid wallet address: ${userId}`);
      throw new Error(`Invalid wallet address: ${userId}`);
    }

    if (!addressPattern.test(lpToken)) {
      console.log(`Invalid lp token: ${lpToken}`);
      throw new Error(`Invalid lp token: ${lpToken}`);
    }

    if (!timestampPattern.test(epochStart)) {
      console.log(`Invalid epoch start time: ${epochStart}`);
      throw new Error(`Invalid epoch start time: ${epochStart}`);
    }

    if (!timestampPattern.test(epochEnd)) {
      console.log(`Invalid epoch start time: ${epochStart}`);
      throw new Error(`Invalid epoch start time: ${epochStart}`);
    }

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': this.apiKey
      },
      body: JSON.stringify({
        sqlQuery: {
          parameters: {
            fields: {
              epochStart: { timestampValue: epochStart },
              epochEnd: { timestampValue: epochEnd },
              userId: { stringValue: userId },
              lpToken: { stringValue: lpToken },
              lpTokenAmount: { intValue: amount },
              campaignRewardToken: { stringValue: "fuel" }
            }
          },
          sql: userPoolRewardsQuery
        }
      })
    };

    const response = await fetch(this.apiUrl, options);
    const json = await response.json();
    if (json.code === 16) {
      console.log(json.message);
      throw new Error(json.message);
    }
    if (json.result.rows.length == 0) {
      console.log(`Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`);
      throw new NotFoundError(`Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`);
    }
    const fuelRewards = json.result.rows[0].FuelRewards;
    const usdRewards = json.result.rows[0].USDRewards;
    if (!fuelRewards || !usdRewards) {
      console.log(`Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`);
      throw new NotFoundError(`Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`);
    }

    return {
      rewardsAmount: fuelRewards,
      userId: userId,
      epochNumbers: [],
      poolIds: [],
      rewardsUSD: usdRewards
    };
  }
}

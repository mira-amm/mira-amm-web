import { UserRewardsQueryParams, UserRewardsResponse, UserRewardsService } from "./interfaces";
import fs from "fs";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class SentioJSONUserRewardsService implements UserRewardsService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }
  async getRewards(params: UserRewardsQueryParams): Promise<UserRewardsResponse> {
    const { epochStart, epochEnd, lpToken, userId, amount } = params;

    const sql = fs.readFileSync("src/queries/UserPoolRewards.sql", 'utf8');

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
              amount: { intValue: amount }
            }
          },
          sql: sql
        }
      })
    };

    const response = await fetch(this.apiUrl, options);
    const json = await response.json();
    if (json.result.rows.length == 0) {
      console.log(`Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`);
      throw new NotFoundError(`Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`);
    }
    const rewards = json.result.rows[0].ComputedValue;
    if (!rewards) {
      console.log(`Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`);
      throw new NotFoundError(`Failed to fetch ${lpToken} rewards for user ${userId} in epoch ${epochStart} to ${epochEnd}`);
    }
    return rewards;
  }
}

import { UserRewardsService } from "./interfaces";
import fs from "fs";

export interface UserRewardsResponse {
  // amount of tokens
  rewardsAmount: number;
  // Dollar value of tokens
  rewardsUSD: number;
  // epoch numbers included in response
  epochNumbers: number[];
  // pool ids include in response
  poolIds: string[];
  // wallet address of user
  userId: string;
}

export interface UserRewardsQueryParams {
  epochStart: Date;
  epochEnd: Date;
  lpToken: string;
  userId: string;
  amount: number;
}

export class SentioJSONUserRewardsService implements UserRewardsService {
  private readonly apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }
  async getRewards(params: UserRewardsQueryParams): Promise<UserRewardsResponse> {
    if (!process.env.SENTIO_API_KEY) {
      throw new Error("No Sentio API key provided");
    }

    const { epochStart, epochEnd, lpToken, userId, amount } = params;

    const sql = fs.readFileSync("src/queries/UserPoolRewards.sql", 'utf8');

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
    const rewards = json.result.rows[0]["ComputedValue"];
    return rewards;
  }
}

import fs from "fs";
import { UserRewardsService } from "./interfaces";

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

export class MockJSONUserRewardsService implements UserRewardsService {
  private readonly userRewardsPath: string;

  constructor(userRewardsPath: string) {
    this.userRewardsPath = userRewardsPath;
  }
  getRewards(): Promise<UserRewardsResponse> {
    // load from json file
    const userRewards: UserRewardsResponse = JSON.parse(
      fs.readFileSync(this.userRewardsPath, "utf8")
    );

    return Promise.resolve(userRewards);
  }
}

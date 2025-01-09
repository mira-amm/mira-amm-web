interface UserRewardsResponse {
  // amount of tokens
  rewardsAmount: number;
  // Dollar value of tokens
  rewardsUSD: number;
  // epoch numbers
  epochNumbers: number[];
  // pool ids
  poolIds: string[];
}

/*
 * This file contains the interfaces for the user rewards module.
 */
export interface UserRewardsService {
    getRewards(params?: UserRewardsQueryParams): Promise<UserRewardsResponse>;
}

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
    epochStart: string;
    epochEnd: string;
    lpToken: string;
    userId: string;
    amount: number;
}

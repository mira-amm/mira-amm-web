// Define the interface for any user rewards service
export interface UserRewardsService {
    getRewards(params?: UserRewardsQueryParams): Promise<UserRewardsResponse>;
}
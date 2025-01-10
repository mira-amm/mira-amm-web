// Define the interface for any user rewards service
export interface UserRewardsService {
    getRewards(): Promise<UserRewardsResponse>;
}
export interface CampaignsResponse {
  campaigns: Campaign[];
}

export interface EpochConfig {
  startDate: Date;
  endDate: Date;
  number: number;
  campaigns: {
    pool: {
      id: string;
      lpToken: string;
    };
    rewards: {
      amount: number;
      assetId: string;
    }[];
  }[];
}

export interface CampaignReward {
  assetId: string;
  amount: number;
}

export interface Epoch {
  startDate: Date;
  endDate: Date;
  number: number;
}

export interface Campaign {
  pool: Pool;
  rewards: CampaignReward[];
  epoch: Epoch;
  currentAPR?: number;
  status: "active" | "inactive" | "completed";
}

export interface Pool {
  id: string;
  lpToken: string;
}

export interface CampaignQueryParams {
  epochNumbers?: number[];
  poolIds?: string[];
  includeAPR?: boolean;
}

export interface EpochConfigService {
  getEpochs(epochNumbers?: number[]): EpochConfig[];
}

// Define the interface for any campaign service
export interface CampaignService {
  getCampaigns(params?: CampaignQueryParams): Promise<Campaign[]>;
}
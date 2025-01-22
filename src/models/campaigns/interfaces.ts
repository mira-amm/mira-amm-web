/*
 * This file contains the interfaces for the campaigns module.
 */
export interface CampaignsResponse {
  campaigns: Campaign[];
}

export interface EpochConfig {
  startDate: string;
  endDate: string;
  number: number;
  campaigns: {
    pool: {
      id: string;
      lpToken: string;
    };
    rewards: {
      dailyAmount: number;
      assetId: string;
    }[];
  }[];
}

export interface CampaignReward {
  assetId: string;
  dailyAmount: number;
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
  status: "inprogress" | "planned" | "completed";
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
  getCampaigns(params?: CampaignQueryParams): Promise<CampaignsResponse>;
}

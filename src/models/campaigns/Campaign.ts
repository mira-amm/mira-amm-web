import axios from "axios";
import fs from "fs";
import {Campaign, CampaignQueryParams, CampaignService} from "./interfaces";
import {EpochConfig, EpochConfigService} from "./interfaces";

export class JSONEpochConfigService implements EpochConfigService {
  constructor(private readonly epochConfigPath: string) {}

  getEpochs(epochNumbers?: number[]): EpochConfig[] {
    // load from json file
    const epochs: EpochConfig[] = JSON.parse(
      fs.readFileSync(this.epochConfigPath, "utf8")
    );

    if (epochNumbers) {
      return epochs.filter((epoch) => epochNumbers.includes(epoch.number));
    }

    return epochs;
  }
}

// Specific implementation for Sentio
export class SentioJSONCampaignService implements CampaignService {
  private readonly apiUrl: string;
  private readonly epochConfigService: EpochConfigService;

  constructor(apiUrl: string, epochConfigService: EpochConfigService) {
    this.apiUrl = apiUrl;
    this.epochConfigService = epochConfigService;
  }

  async getCampaigns(params?: CampaignQueryParams): Promise<Campaign[]> {
    try {
      const epochConfig = this.epochConfigService.getEpochs(
        params?.epochNumbers ? params.epochNumbers : undefined
      );

      const campaignsWithoutApr: Campaign[] = epochConfig
        .filter((epoch) => {
          // return true if no epochNumbers are provided
          return (
            !params?.epochNumbers || params?.epochNumbers.includes(epoch.number)
          );
        })
        .flatMap((epoch) => {
          // flatten the epoch to just the campaigns
          return epoch.campaigns.map((campaign) => ({
            epoch: {
              startDate: epoch.startDate,
              endDate: epoch.endDate,
              number: epoch.number,
            },
            ...campaign,
          }));
        });

      if (params?.includeAPR) {
        // TODO: implement
        // get each campaign from sentio
        //   const response = await axios.get(url);
        const campaigns = campaignsWithoutApr;
        return campaigns;
      } else {
        return campaignsWithoutApr;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch campaigns: ${error.message}`);
      }
      throw error;
    }
  }
}

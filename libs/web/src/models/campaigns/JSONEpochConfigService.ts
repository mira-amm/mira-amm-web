import {EpochConfigService, EpochConfig} from "./interfaces";
import {loadFile} from "../../utils/fileLoader";

export class JSONEpochConfigService implements EpochConfigService {
  private readonly epochs: EpochConfig[];

  constructor(epochConfigPath: string) {
    this.epochs = JSON.parse(loadFile(epochConfigPath));
  }

  getEpochs(epochNumbers?: number[]): EpochConfig[] {
    if (epochNumbers) {
      return this.epochs.filter((epoch) => epochNumbers.includes(epoch.number));
    }

    return this.epochs;
  }

  getCurrentEpochs(): EpochConfig[] {
    // current time is within startDate and endDate
    const currentTime = new Date();
    return this.epochs.filter((epoch) => {
      const startDate = new Date(epoch.startDate);
      const endDate = new Date(epoch.endDate);
      return currentTime >= startDate && currentTime <= endDate;
    });
  }

  /// Gets epochs that have campaigns that have rewards with the given assetId
  /// Omits any rewards that are not that given assetId, and campaigns that do not have rewards, and epochs that do not have campaigns
  getEpochsByRewardAssetId(assetId: string): EpochConfig[] {
    return this.epochs
      .map((epoch) => ({
        ...epoch,
        campaigns: epoch.campaigns
          .map((campaign) => ({
            ...campaign,
            rewards: campaign.rewards.filter(
              (reward) => reward.assetId === assetId
            ),
          }))
          .filter((campaign) => campaign.rewards.length > 0),
      }))
      .filter((epoch) => epoch.campaigns.length > 0);
  }
}

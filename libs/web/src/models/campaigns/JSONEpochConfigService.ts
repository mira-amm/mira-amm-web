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
}

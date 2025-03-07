import {EpochConfigService} from "@/src/models/campaigns/interfaces";
import {
  PointsResponse,
  PointsQueryParams,
  PointsPerUserService,
} from "@/src/models/points/interfaces";
import fs from "fs/promises";
import {loadFile} from "@/src/utils/fileLoader";
import path from "path";

const pointsPerUserQuery = loadFile(
  path.join(process.cwd(), "src", "queries", "PointsPerUser.sql"),
);

const FILE_PATH = "/tmp/latestPoints.json";

// A service that fetches the latest points from the sentio API and saves them to a temporary file
// This is used to avoid configuring vercel kv or postgres
export class TmpFilePointsPerUserService implements PointsPerUserService {
  constructor(
    private readonly apiKey: string,
    private readonly apiUrl: string,
    private readonly epochConfigService: EpochConfigService,
  ) {}

  async updateLatestPoints(): Promise<PointsResponse[]> {
    const points = await this.fetchLatestPoints();

    await fs.writeFile(FILE_PATH, JSON.stringify(points));

    return points;
  }

  async getPoints(queryParams: PointsQueryParams): Promise<PointsResponse[]> {
    let parsedPoints;

    try {
      const points = await fs.readFile(FILE_PATH, "utf8");
      parsedPoints = JSON.parse(points);
    } catch (e) {
      // If file doesn't exist or can't be read, fetch and save the latest points
      console.log(
        "Points file not found or invalid, fetching latest points...",
      );
      parsedPoints = await this.updateLatestPoints();
    }

    if (queryParams.address) {
      parsedPoints = parsedPoints.filter(
        (point: PointsResponse) => point.address === queryParams.address,
      );
    }

    if (queryParams.offset) {
      parsedPoints = parsedPoints.slice(queryParams.offset);
    }

    if (queryParams.limit) {
      parsedPoints = parsedPoints.slice(0, queryParams.limit);
    }

    return parsedPoints;
  }

  private async fetchLatestPoints(): Promise<PointsResponse[]> {
    const epoch = this.epochConfigService.getCurrentEpochs()[0];

    const epochStart = epoch.startDate;
    const epochEnd = epoch.endDate;

    const lpTokens = epoch.campaigns.map((campaign) => campaign.pool.lpToken);
    const rewardRates = epoch.campaigns.map(
      (campaign) => campaign.rewards[0].dailyAmount,
    );

    const options = this.getQueryOptions(
      this.apiKey,
      epochStart,
      epochEnd,
      lpTokens,
      rewardRates,
    );

    const response = await fetch(this.apiUrl, options);

    const json = await response.json();

    if (json.code) {
      console.log(json.message);
      throw new Error(json.message);
    }

    return json.data;
  }

  private getQueryOptions(
    apiKey: string,
    epochStart: string,
    epochEnd: string,
    lpTokens: string[],
    rewardRates: number[],
  ) {
    // convert the reward rates to an array string
    const rewardRatesString = `[${rewardRates.join(",")}]`;
    const lpTokensString = `['${lpTokens.join("','")}']`;

    return {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sqlQuery: {
          sql: pointsPerUserQuery,
          parameters: {
            fields: {
              epochStart: {timestampValue: epochStart},
              epochEnd: {timestampValue: epochEnd},
              lpTokens: {stringArrayValue: lpTokensString},
              rewardRates: {stringArrayValue: rewardRatesString},
            },
          },
        },
      }),
    };
  }
}

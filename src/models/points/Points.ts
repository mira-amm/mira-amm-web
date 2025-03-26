import {EpochConfigService} from "@/src/models/campaigns/interfaces";
import {
  PointsResponse,
  PointsQueryParams,
  PointsPerUserService,
} from "@/src/models/points/interfaces";
import fs from "fs/promises";

const ONE_HOUR_IN_SECONDS = 60 * 60;
const ONE_MINUTE_IN_SECONDS = 60;
const ONE_SECOND_IN_MS = 1000;
const FILE_PATH = "/tmp/latestPoints.json";
const RESULT_POLL_RETRIES = 20;
const RESULT_POLL_INTERVAL_MS = 5 * ONE_SECOND_IN_MS; // 5 seconds

const POINTS_CACHE_EXPIRATION_MS = 5 * ONE_MINUTE_IN_SECONDS * ONE_SECOND_IN_MS; // 5 minutes
const SENTIO_STALE_WHILE_REVALIDATE_SECS = ONE_HOUR_IN_SECONDS; // 1 hour
const SENTIO_CACHE_TTL_SECS = 20 * ONE_MINUTE_IN_SECONDS; // 20 minutes
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

    // add a timestamp to the overall object
    const pointsCache = {
      expiresAt: new Date(
        Date.now() + POINTS_CACHE_EXPIRATION_MS,
      ).toISOString(),
      points,
    };

    await fs.writeFile(FILE_PATH, JSON.stringify(pointsCache));

    return points;
  }

  async getPoints(
    queryParams: PointsQueryParams,
  ): Promise<{data: PointsResponse[]; totalCount: number}> {
    let totalCount;
    let parsedPoints;

    try {
      const points = await fs.readFile(FILE_PATH, "utf8");
      const pointsCache = JSON.parse(points);
      parsedPoints = pointsCache.points;
      if (
        !pointsCache.expiresAt ||
        new Date(pointsCache.expiresAt) < new Date(Date.now())
      ) {
        console.log(
          `Points cache is older than ${POINTS_CACHE_EXPIRATION_MS / 1000 / ONE_MINUTE_IN_SECONDS} minutes, updating in the background...`,
        );
        // update the points cache non-blocking
        Promise.resolve().then(async () => {
          this.updateLatestPoints();
        });
      }
      totalCount = parsedPoints.length;
    } catch (e) {
      // If file doesn't exist or can't be read, fetch and save the latest points
      console.log(
        "Points file not found or invalid, fetching latest points...",
      );
      parsedPoints = await this.updateLatestPoints();
    }

    if (queryParams.address) {
      parsedPoints = parsedPoints.filter(
        (point: PointsResponse) =>
          point.address.toLowerCase() === queryParams.address?.toLowerCase(),
      );
    }

    if (queryParams.offset) {
      parsedPoints = parsedPoints.slice(queryParams.offset);
    }

    if (queryParams.limit) {
      parsedPoints = parsedPoints.slice(0, queryParams.limit);
    }

    return {
      data: parsedPoints,
      totalCount,
    };
  }

  private async fetchLatestPoints(): Promise<PointsResponse[]> {
    try {
      const epoch = this.epochConfigService.getCurrentEpochs()[0];

      const epochStart = epoch.startDate;
      const epochEnd = epoch.endDate;

      const lpTokens = epoch.campaigns.map((campaign) => campaign.pool.lpToken);
      const rewardRates = epoch.campaigns.map(
        (campaign) => campaign.rewards[0].dailyAmount,
      );

      // trigger the job
      const {resultUrl} = await this.triggerUpdateLatestPoints(
        this.apiKey,
        epochStart,
        epochEnd,
        lpTokens,
        rewardRates,
      );

      console.log("Sentio job triggered, resultUrl:", resultUrl);

      return await this.pollForResults(this.apiKey, resultUrl);
    } catch (error) {
      console.error("Error fetching latest points:", error);
      throw error;
    }
  }

  private async triggerUpdateLatestPoints(
    apiKey: string,
    epochStart: string,
    epochEnd: string,
    lpTokens: string[],
    rewardRates: number[],
  ): Promise<{resultUrl: string}> {
    const queryParams = new URLSearchParams({
      version: "0",
      "cache_policy.ttl_secs": SENTIO_CACHE_TTL_SECS.toString(),
      "cache_policy.refresh_ttl_secs":
        SENTIO_STALE_WHILE_REVALIDATE_SECS.toString(),
      // This is a hack to force the job to run, sentio will not run the job if the seconds per row is too high
      size: "100000",
    }).toString();

    const data = {
      epochEnd,
      epochStart,
      lpTokens: `[${lpTokens.map((token) => `'${token}'`).join(", ")}]`,
      rewardRates: `[${rewardRates.join(", ")}]`,
    };

    const response = await fetch(`${this.apiUrl}?${queryParams}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(data),
    });

    console.log("Sentio job response:", response);

    const json = await response.json();
    return {
      resultUrl: json.asyncResponse.resultUrl,
    };
  }

  private async fetchJobResult(
    apiKey: string,
    resultUrl: string,
  ): Promise<PointsResponse[]> {
    // try fetching the resultUrl
    const response = await fetch(resultUrl, {
      headers: {
        "api-key": apiKey,
      },
    });

    const json = await response.json();

    // if it is finished, return the points
    if (json.sqlQueryResult?.executionInfo?.status === "FINISHED") {
      const rows = json.sqlQueryResult.executionInfo.result.rows;
      const points: PointsResponse[] = rows;

      return points;
    } else {
      throw new Error("Job not finished yet");
    }
  }

  // poll the resultUrl until it is finished, or maxRetries is reached
  private async pollForResults(
    apiKey: string,
    resultUrl: string,
    maxRetries = RESULT_POLL_RETRIES,
  ) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.fetchJobResult(apiKey, resultUrl);
        if (result.length > 0) {
          return result;
        }
      } catch (error) {
        console.log(
          `Attempt ${attempt + 1}/${maxRetries}: Job not finished yet, retrying in ${RESULT_POLL_INTERVAL_MS}ms...`,
        );
      }

      await new Promise((resolve) =>
        setTimeout(resolve, RESULT_POLL_INTERVAL_MS),
      );
    }

    throw new Error(`Job polling timed out after ${maxRetries} attempts`);
  }
}

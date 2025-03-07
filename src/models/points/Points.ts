import {EpochConfigService} from "@/src/models/campaigns/interfaces";
import {
  PointsResponse,
  PointsQueryParams,
  PointsPerUserService,
} from "@/src/models/points/interfaces";
import fs from "fs/promises";
import {loadFile} from "@/src/utils/fileLoader";
import path from "path";
import {log} from "console";

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
    try {
      console.log("Starting fetchLatestPoints...");
      const epoch = this.epochConfigService.getCurrentEpochs()[0];
      console.log("Current epoch:", {
        startDate: epoch.startDate,
        endDate: epoch.endDate,
        campaignsCount: epoch.campaigns.length,
      });

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

      console.log(
        "Sending request to Sentio API (this may take up to a minute)...",
      );

      // Set a longer timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      try {
        const response = await fetch(this.apiUrl, {
          ...options,
          signal: controller.signal,
        });

        console.log("Sentio API response status:", response.status);

        if (!response.ok) {
          throw new Error(
            `Sentio API request failed with status ${response.status}: ${response.statusText}`,
          );
        }

        // Get the full response text
        const responseText = await response.text();
        console.log("Response received, length:", responseText.length);

        if (!responseText) {
          throw new Error("Received empty response from Sentio API");
        }

        let json;
        try {
          json = JSON.parse(responseText);
        } catch (e) {
          console.error("Failed to parse JSON response:", e);
          console.error("Response preview:", responseText.substring(0, 500));
          throw new Error("Failed to parse JSON response from Sentio API");
        }

        if (json.error) {
          console.error("Sentio API error:", json.error);
          throw new Error(`Sentio API error: ${json.error}`);
        }

        // Check for result.rows structure instead of data
        if (json.result && json.result.rows) {
          console.log(
            `Successfully retrieved ${json.result.rows.length} records`,
          );

          // Transform the rows into the expected PointsResponse format
          const columns = json.result.columns;
          const points = json.result.rows.map((row) => {
            const point: any = {};
            columns.forEach((column: string, index: number) => {
              point[column] = row[index];
            });

            // Map to expected PointsResponse format
            return {
              address: point.distinct_id,
              points: point.total_points,
              rank: point.row_num,
            };
          });

          return points;
        }

        console.error("Unexpected response format:", json);
        throw new Error("Sentio API returned unexpected data format");
      } finally {
        clearTimeout(timeoutId); // Clear the timeout if the request completes
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("Request timed out after 2 minutes");
        throw new Error("Sentio API request timed out after 2 minutes");
      }
      console.error("Error in fetchLatestPoints:", error);
      throw error;
    }
  }

  private getQueryOptions(
    apiKey: string,
    epochStart: string,
    epochEnd: string,
    lpTokens: string[],
    rewardRates: number[],
  ) {
    console.log({
      rewardRates,
      lpTokens,
    });

    // Let's examine the SQL query to see what it expects
    console.log("SQL Query:", pointsPerUserQuery);

    // Create a modified SQL query with the variables directly replaced
    let modifiedQuery = pointsPerUserQuery;

    // Format the arrays for SQL
    const lpTokensFormatted = lpTokens.map((token) => `'${token}'`).join(",");
    const rewardRatesFormatted = rewardRates.join(",");

    // Replace the template variables in the SQL query
    modifiedQuery = modifiedQuery.replace(
      "${lpTokens}",
      `[${lpTokensFormatted}]`,
    );
    modifiedQuery = modifiedQuery.replace(
      "${rewardRates}",
      `[${rewardRatesFormatted}]`,
    );

    console.log("Modified SQL Query:", modifiedQuery);

    return {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sqlQuery: {
          sql: modifiedQuery,
          parameters: {
            fields: {
              epochStart: {timestampValue: epochStart},
              epochEnd: {timestampValue: epochEnd},
            },
          },
        },
        size: 10000,
      }),
    };
  }
}

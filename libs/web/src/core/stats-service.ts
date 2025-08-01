import {cachedSubsquidClient} from "./cached-graphql-client";
import {
  PROTOCOL_STATS_QUERY,
  BASIC_PROTOCOL_STATS_QUERY,
} from "../queries/protocol-stats";
import type {
  GraphQLResponse,
  ProtocolStatsData,
  QueryVariables,
  PoolData,
} from "../types/protocol-stats";

/**
 * Core service for fetching and calculating protocol statistics
 * Handles GraphQL queries, data validation, and statistical calculations
 */
export class StatsService {
  /**
   * Fetch complete protocol statistics with time-based data
   */
  async fetchProtocolStats(): Promise<ProtocolStatsData> {
    try {
      const variables: QueryVariables = {
        timestamp24h: this.formatTimestamp(1), // 1 day ago
        timestamp7d: this.formatTimestamp(7), // 7 days ago
      };

      const response = await this.querySubsquid(
        PROTOCOL_STATS_QUERY,
        variables
      );
      this.validateGraphQLResponse(response);

      return this.calculateStats(response.pools);
    } catch (error) {
      console.error("Failed to fetch protocol stats:", error);

      // Fallback to basic query without time-based data
      try {
        const basicResponse = await this.querySubsquid(
          BASIC_PROTOCOL_STATS_QUERY
        );
        this.validateGraphQLResponse(basicResponse);

        return this.calculateBasicStats(basicResponse.pools);
      } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        throw new Error("Unable to fetch protocol statistics");
      }
    }
  }

  /**
   * Execute GraphQL query against Subsquid endpoint with error handling
   */
  private async querySubsquid(
    query: string,
    variables?: QueryVariables
  ): Promise<GraphQLResponse> {
    try {
      return await cachedSubsquidClient.query<GraphQLResponse>(
        query,
        variables
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown GraphQL error";
      throw new Error(`GraphQL query failed: ${errorMessage}`);
    }
  }

  /**
   * Validate GraphQL response structure and data integrity
   */
  private validateGraphQLResponse(response: GraphQLResponse): void {
    if (!response) {
      throw new Error("GraphQL response is null or undefined");
    }

    if (!Array.isArray(response.pools)) {
      throw new Error("GraphQL response does not contain valid pools array");
    }

    // Validate each pool has required fields
    response.pools.forEach((pool, index) => {
      if (typeof pool.poolTVL !== "number" && pool.poolTVL !== null) {
        throw new Error(`Pool ${index}: poolTVL must be a number or null`);
      }
      if (
        typeof pool.poolAlltimeVolume !== "number" &&
        pool.poolAlltimeVolume !== null
      ) {
        throw new Error(
          `Pool ${index}: poolAlltimeVolume must be a number or null`
        );
      }
      if (pool.snapshot24hours && !Array.isArray(pool.snapshot24hours)) {
        throw new Error(`Pool ${index}: snapshot24hours must be an array`);
      }
      if (pool.snapshot7days && !Array.isArray(pool.snapshot7days)) {
        throw new Error(`Pool ${index}: snapshot7days must be an array`);
      }
    });
  }

  /**
   * Calculate timestamp for queries (days ago from current time)
   */
  private formatTimestamp(daysAgo: number): number {
    const now = new Date();
    const targetDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return Math.floor(targetDate.getTime() / 1000);
  }

  /**
   * Calculate complete statistics from pool data with comprehensive validation
   */
  private calculateStats(pools: PoolData[]): ProtocolStatsData {
    if (!pools || pools.length === 0) {
      return this.getDefaultStats();
    }

    const stats = pools.reduce(
      (acc, pool) => {
        // Safely handle null/undefined values with validation
        const poolTVL = this.sanitizeNumber(pool.poolTVL);
        const poolAllTimeVolume = this.sanitizeNumber(pool.poolAlltimeVolume);

        // Calculate 24h volume from snapshots with validation
        const oneDayVolume = this.calculateVolumeFromSnapshots(
          pool.snapshot24hours
        );

        // Calculate 7d volume from snapshots with validation
        const sevenDayVolume = this.calculateVolumeFromSnapshots(
          pool.snapshot7days
        );

        return {
          totalTVL: acc.totalTVL + poolTVL,
          allTimeVolume: acc.allTimeVolume + poolAllTimeVolume,
          oneDayVolume: acc.oneDayVolume + oneDayVolume,
          sevenDayVolume: acc.sevenDayVolume + sevenDayVolume,
        };
      },
      {
        totalTVL: 0,
        allTimeVolume: 0,
        oneDayVolume: 0,
        sevenDayVolume: 0,
      }
    );

    return this.validateCalculatedStats(stats);
  }

  /**
   * Calculate volume from snapshot array with error handling
   */
  private calculateVolumeFromSnapshots(snapshots: any[]): number {
    if (!Array.isArray(snapshots)) {
      return 0;
    }

    return snapshots.reduce((sum, snapshot) => {
      if (!snapshot || typeof snapshot !== "object") {
        return sum;
      }
      return sum + this.sanitizeNumber(snapshot.poolHourVolume);
    }, 0);
  }

  /**
   * Sanitize and validate numeric values
   */
  private sanitizeNumber(value: any): number {
    if (typeof value === "number" && !isNaN(value) && isFinite(value)) {
      return Math.max(0, value); // Ensure non-negative
    }
    return 0;
  }

  /**
   * Validate calculated statistics for consistency
   */
  private validateCalculatedStats(stats: ProtocolStatsData): ProtocolStatsData {
    // Ensure all values are valid numbers
    const validatedStats = {
      totalTVL: this.sanitizeNumber(stats.totalTVL),
      allTimeVolume: this.sanitizeNumber(stats.allTimeVolume),
      oneDayVolume: this.sanitizeNumber(stats.oneDayVolume),
      sevenDayVolume: this.sanitizeNumber(stats.sevenDayVolume),
    };

    // Logical validation: 7-day volume should be >= 1-day volume
    if (validatedStats.sevenDayVolume < validatedStats.oneDayVolume) {
      console.warn(
        "Data inconsistency: 7-day volume is less than 1-day volume"
      );
    }

    return validatedStats;
  }

  /**
   * Calculate basic statistics without time-based data (fallback)
   */
  private calculateBasicStats(pools: PoolData[]): ProtocolStatsData {
    if (!pools || pools.length === 0) {
      return this.getDefaultStats();
    }

    const stats = pools.reduce(
      (acc, pool) => ({
        totalTVL: acc.totalTVL + (pool.poolTVL || 0),
        allTimeVolume: acc.allTimeVolume + (pool.poolAlltimeVolume || 0),
        oneDayVolume: 0, // Not available in basic query
        sevenDayVolume: 0, // Not available in basic query
      }),
      {
        totalTVL: 0,
        allTimeVolume: 0,
        oneDayVolume: 0,
        sevenDayVolume: 0,
      }
    );

    return stats;
  }

  /**
   * Get default stats when no data is available
   */
  private getDefaultStats(): ProtocolStatsData {
    return {
      totalTVL: 0,
      allTimeVolume: 0,
      oneDayVolume: 0,
      sevenDayVolume: 0,
    };
  }
}

// Export singleton instance
export const statsService = new StatsService();

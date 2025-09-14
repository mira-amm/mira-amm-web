import {IStatsIndexer} from "../interfaces";
import {
  ProtocolStats,
  TimeSeriesData,
  HistoricalParams,
  TimePeriod,
  VolumeData,
  TVLData,
} from "../types";
import {
  PROTOCOL_STATS_QUERY,
  BASIC_PROTOCOL_STATS_QUERY,
  GET_POOL_VOLUME,
  GET_POOL_TVL,
  GET_HISTORICAL_DATA,
  GET_PROTOCOL_FEES,
} from "../queries";

export class StatsIndexer implements IStatsIndexer {
  constructor(
    private indexer: {query: <T>(query: string, variables?: any) => Promise<T>}
  ) {}

  async getTVL(): Promise<TVLData> {
    const response = await this.indexer.query<{
      pools: Array<{poolTVL: string; id: string}>;
    }>(BASIC_PROTOCOL_STATS_QUERY);

    const byPool: Record<string, number> = {};
    let totalTVL = 0;

    response.pools.forEach((pool) => {
      const tvl = parseFloat(pool.poolTVL || "0");
      byPool[pool.id] = tvl;
      totalTVL += tvl;
    });

    return {
      current: totalTVL,
      change24h: 0, // Would need historical data to calculate
      change7d: 0, // Would need historical data to calculate
      byPool,
    };
  }

  async getVolume(period: TimePeriod): Promise<VolumeData> {
    const timestamp = this.getTimestampForPeriod(period);

    const response = await this.indexer.query<{
      pools: Array<{
        id: string;
        snapshot24hours?: Array<{poolHourVolume: string}>;
        snapshot7days?: Array<{poolHourVolume: string}>;
        poolAlltimeVolume: string;
      }>;
    }>(PROTOCOL_STATS_QUERY, {
      timestamp24h: period === "24h" ? timestamp : undefined,
      timestamp7d: period === "7d" ? timestamp : undefined,
    });

    const byPool: Record<string, number> = {};
    let totalVolume = 0;

    response.pools.forEach((pool) => {
      let poolVolume = 0;

      if (period === "24h" && pool.snapshot24hours) {
        poolVolume = pool.snapshot24hours.reduce(
          (sum, snapshot) => sum + parseFloat(snapshot.poolHourVolume || "0"),
          0
        );
      } else if (period === "7d" && pool.snapshot7days) {
        poolVolume = pool.snapshot7days.reduce(
          (sum, snapshot) => sum + parseFloat(snapshot.poolHourVolume || "0"),
          0
        );
      } else if (period === "all") {
        poolVolume = parseFloat(pool.poolAlltimeVolume || "0");
      }

      byPool[pool.id] = poolVolume;
      totalVolume += poolVolume;
    });

    return {
      total: totalVolume,
      byPool,
      change: 0, // Would need comparison period to calculate
    };
  }

  async getProtocolStats(): Promise<ProtocolStats> {
    const timestamp24h = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
    const timestamp7d = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;

    const response = await this.indexer.query<{
      pools: Array<{
        poolTVL: string;
        poolAlltimeVolume: string;
        snapshot24hours: Array<{poolHourVolume: string}>;
        snapshot7days: Array<{poolHourVolume: string}>;
      }>;
    }>(PROTOCOL_STATS_QUERY, {timestamp24h, timestamp7d});

    let tvl = 0;
    let volume24h = 0;
    let volume7d = 0;
    let volumeAll = 0;
    const poolCount = response.pools.length;

    response.pools.forEach((pool) => {
      tvl += parseFloat(pool.poolTVL || "0");
      volumeAll += parseFloat(pool.poolAlltimeVolume || "0");

      // Calculate 24h volume
      volume24h += pool.snapshot24hours.reduce(
        (sum, snapshot) => sum + parseFloat(snapshot.poolHourVolume || "0"),
        0
      );

      // Calculate 7d volume
      volume7d += pool.snapshot7days.reduce(
        (sum, snapshot) => sum + parseFloat(snapshot.poolHourVolume || "0"),
        0
      );
    });

    return {
      tvl,
      tvlChange24h: 0, // Would need historical TVL data
      volume24h,
      volume7d,
      volumeAll,
      fees24h: volume24h * 0.003, // Estimate based on 0.3% fee
      fees7d: volume7d * 0.003,
      feesAll: volumeAll * 0.003,
      poolCount,
      transactionCount24h: 0, // Would need transaction count query
      uniqueUsers24h: 0, // Would need unique users query
    };
  }

  async getHistoricalData(params: HistoricalParams): Promise<TimeSeriesData> {
    const response = await this.indexer.query<{
      snapshots: Array<{
        timestamp: number;
        tvlUSD: string;
        volumeUSD: string;
        feesUSD: string;
      }>;
    }>(GET_HISTORICAL_DATA, {
      poolId: params.poolId,
      fromTimestamp: params.from,
      toTimestamp: params.to,
    });

    const timestamps = response.snapshots.map((s) => s.timestamp);
    let values: number[] = [];
    let label = "";

    switch (params.metric) {
      case "tvl":
        values = response.snapshots.map((s) => parseFloat(s.tvlUSD || "0"));
        label = "TVL";
        break;
      case "volume":
        values = response.snapshots.map((s) => parseFloat(s.volumeUSD || "0"));
        label = "Volume";
        break;
      case "fees":
        values = response.snapshots.map((s) => parseFloat(s.feesUSD || "0"));
        label = "Fees";
        break;
      default:
        values = response.snapshots.map((s) => parseFloat(s.tvlUSD || "0"));
        label = "TVL";
    }

    return {
      timestamps,
      values,
      label,
    };
  }

  async getFees(period: TimePeriod) {
    const fromTimestamp = this.getTimestampForPeriod(period);

    const response = await this.indexer.query<{
      pools: Array<{
        id: string;
        snapshots: Array<{feesUSD: string}>;
      }>;
    }>(GET_PROTOCOL_FEES, {fromTimestamp});

    const pools: Record<string, number> = {};
    let total = 0;

    response.pools.forEach((pool) => {
      const poolFees = pool.snapshots.reduce(
        (sum, snapshot) => sum + parseFloat(snapshot.feesUSD || "0"),
        0
      );
      pools[pool.id] = poolFees;
      total += poolFees;
    });

    return {
      total,
      pools,
    };
  }

  async getPoolVolume(poolId: string, period: TimePeriod): Promise<number> {
    const fromTimestamp = this.getTimestampForPeriod(period);

    const response = await this.indexer.query<{
      pool: {
        snapshots: Array<{volumeUSD: string}>;
      };
    }>(GET_POOL_VOLUME, {poolId, fromTimestamp});

    if (!response.pool) {
      return 0;
    }

    return response.pool.snapshots.reduce(
      (sum, snapshot) => sum + parseFloat(snapshot.volumeUSD || "0"),
      0
    );
  }

  async getPoolTVL(poolId: string): Promise<number> {
    const response = await this.indexer.query<{
      pool: {tvlUSD: string};
    }>(GET_POOL_TVL, {poolId});

    if (!response.pool) {
      return 0;
    }

    return parseFloat(response.pool.tvlUSD || "0");
  }

  private getTimestampForPeriod(period: TimePeriod): number {
    const now = Math.floor(Date.now() / 1000);

    switch (period) {
      case "24h":
        return now - 24 * 60 * 60;
      case "7d":
        return now - 7 * 24 * 60 * 60;
      case "30d":
        return now - 30 * 24 * 60 * 60;
      case "all":
      default:
        return 0;
    }
  }
}

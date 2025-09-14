import {
  ProtocolStats,
  TimeSeriesData,
  HistoricalParams,
  TimePeriod,
  VolumeData,
  TVLData,
} from "../types";

export interface IStatsIndexer {
  getTVL(): Promise<TVLData>;

  getVolume(period: TimePeriod): Promise<VolumeData>;

  getProtocolStats(): Promise<ProtocolStats>;

  getHistoricalData(params: HistoricalParams): Promise<TimeSeriesData>;

  getFees(period: TimePeriod): Promise<{
    total: number;
    pools: Record<string, number>;
  }>;

  getPoolVolume(poolId: string, period: TimePeriod): Promise<number>;

  getPoolTVL(poolId: string): Promise<number>;
}

import {PaginationParams, OrderByParams, TimeRange, TimePeriod} from "./common";

export interface PoolListParams extends PaginationParams, OrderByParams {
  search?: string;
  assetIds?: string[];
  minTvl?: number;
  maxTvl?: number;
  poolType?: "v1-volatile" | "v1-stable" | "v2-concentrated" | "all";
  includeSnapshots?: boolean;
  snapshotTimeRange?: TimeRange;
}

export interface PoolListResponse {
  pools: any[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface EventParams extends PaginationParams, TimeRange {
  poolId?: string;
  userAddress?: string;
  eventTypes?: string[];
  fromBlock?: number;
  toBlock?: number;
}

export interface HistoricalParams extends TimeRange {
  interval?: "hour" | "day" | "week" | "month";
  poolId?: string;
  metric?: "tvl" | "volume" | "fees" | "price";
}

export interface AssetSearchParams {
  query: string;
  limit?: number;
  includePrice?: boolean;
  includeMetadata?: boolean;
}

export interface TransactionParams extends PaginationParams {
  address: string;
  type?: string;
  status?: "success" | "failed" | "pending" | "all";
  fromBlock?: number;
  toBlock?: number;
}

import {
  Pool,
  PoolWithReserves,
  PoolSnapshot,
  PoolListParams,
  PoolListResponse,
  PoolStats,
  PoolPosition,
} from "../types";

export interface IPoolIndexer {
  getById(id: string): Promise<Pool>;

  list(params?: PoolListParams): Promise<PoolListResponse>;

  getWithReserves(poolIds?: string[]): Promise<PoolWithReserves[]>;

  getSnapshots(poolId: string, fromTimestamp: number): Promise<PoolSnapshot[]>;

  search(searchQuery: string): Promise<Pool[]>;

  getAPR(poolId: string): Promise<number>;

  getStats(poolId: string): Promise<PoolStats>;

  getUserPositions(userAddress: string): Promise<PoolPosition[]>;

  getReserves(poolId: string): Promise<{
    reserve0: string;
    reserve1: string;
    reserve0Decimal: string;
    reserve1Decimal: string;
  }>;
}

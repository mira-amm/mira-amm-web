import {IPoolIndexer} from "../interfaces";
import {
  Pool,
  PoolWithReserves,
  PoolSnapshot,
  PoolListParams,
  PoolListResponse,
  PoolStats,
  PoolPosition,
} from "../types";
import {
  GET_POOL_BY_ID,
  GET_POOLS_CONNECTION,
  GET_POOLS_WITH_RESERVES,
  GET_USER_POSITIONS,
  GET_POOL_APR,
} from "../queries";

export class PoolIndexer implements IPoolIndexer {
  constructor(
    private indexer: {query: <T>(query: string, variables?: any) => Promise<T>}
  ) {}

  async getById(id: string): Promise<Pool> {
    const response = await this.indexer.query<{poolById: any}>(GET_POOL_BY_ID, {
      id,
    });

    if (!response.poolById) {
      throw new Error(`Pool with ID ${id} not found`);
    }

    return this.transformPoolData(response.poolById);
  }

  async list(params?: PoolListParams): Promise<PoolListResponse> {
    const variables = {
      first: params?.limit || 10,
      after:
        params?.page && params.page > 1
          ? String((params.page - 1) * (params.limit || 10))
          : null,
      orderBy: params?.orderBy || "tvlUSD_DESC",
      poolWhereInput: this.buildWhereInput(params),
      timestamp24hAgo: Math.floor(Date.now() / 1000) - 24 * 60 * 60,
    };

    const response = await this.indexer.query<{
      poolsConnection: {
        totalCount: number;
        edges: {node: any}[];
      };
    }>(GET_POOLS_CONNECTION, variables);

    const pools = response.poolsConnection.edges.map((edge) =>
      this.transformPoolData(edge.node)
    );

    return {
      pools,
      totalCount: response.poolsConnection.totalCount,
      page: params?.page || 1,
      pageSize: params?.limit || 10,
      hasMore: pools.length === (params?.limit || 10),
    };
  }

  async getWithReserves(poolIds?: string[]): Promise<PoolWithReserves[]> {
    const response = await this.indexer.query<{pools: any[]}>(
      GET_POOLS_WITH_RESERVES,
      {poolIds}
    );

    return response.pools.map((pool) => ({
      ...this.transformPoolData(pool),
      reserve0: pool.reserve0,
      reserve1: pool.reserve1,
      reserve0Decimal: pool.reserve0Decimal,
      reserve1Decimal: pool.reserve1Decimal,
    }));
  }

  async getSnapshots(
    poolId: string,
    fromTimestamp: number
  ): Promise<PoolSnapshot[]> {
    // This would need a specific query for pool snapshots
    // For now, return empty array as placeholder
    return [];
  }

  async search(searchQuery: string): Promise<Pool[]> {
    // Implement pool search logic
    const params: PoolListParams = {
      search: searchQuery,
      limit: 20,
    };
    const result = await this.list(params);
    return result.pools;
  }

  async getAPR(poolId: string): Promise<number> {
    const timestamp24h = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

    const response = await this.indexer.query<{
      pool: {
        tvlUSD: string;
        snapshots: {feesUSD: string; volumeUSD: string}[];
      };
    }>(GET_POOL_APR, {poolId, timestamp24h});

    if (!response.pool) {
      return 0;
    }

    const tvl = parseFloat(response.pool.tvlUSD || "0");
    const fees24h = response.pool.snapshots.reduce(
      (sum, snapshot) => sum + parseFloat(snapshot.feesUSD || "0"),
      0
    );

    if (tvl === 0) return 0;

    // Calculate APR: (fees24h * 365) / tvl * 100
    return ((fees24h * 365) / tvl) * 100;
  }

  async getStats(poolId: string): Promise<PoolStats> {
    const pool = await this.getById(poolId);
    const apr = await this.getAPR(poolId);

    return {
      tvl: parseFloat(pool.tvlUSD || "0"),
      volume24h: 0, // Would need additional query
      volume7d: 0, // Would need additional query
      fees24h: 0, // Would need additional query
      fees7d: 0, // Would need additional query
      apr,
      transactions: 0, // Would need additional query
    };
  }

  async getUserPositions(userAddress: string): Promise<PoolPosition[]> {
    const response = await this.indexer.query<{positions: any[]}>(
      GET_USER_POSITIONS,
      {userAddress}
    );

    return response.positions.map((position) => ({
      id: position.id,
      poolId: position.pool.id,
      userAddress: position.user,
      liquidity: position.liquidity,
      share: 0, // Would need calculation
      value: 0, // Would need calculation
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    }));
  }

  async getReserves(poolId: string) {
    const pool = await this.getWithReserves([poolId]);
    if (pool.length === 0) {
      throw new Error(`Pool ${poolId} not found`);
    }

    const poolData = pool[0];
    return {
      reserve0: poolData.reserve0,
      reserve1: poolData.reserve1,
      reserve0Decimal: poolData.reserve0Decimal,
      reserve1Decimal: poolData.reserve1Decimal,
    };
  }

  private transformPoolData(poolData: any): Pool {
    return {
      id: poolData.id,
      asset0: poolData.asset0,
      asset1: poolData.asset1,
      asset0Id: poolData.asset0?.id || poolData.asset0Id,
      asset1Id: poolData.asset1?.id || poolData.asset1Id,
      tvlUSD: poolData.tvlUSD,
      volumeUSD: poolData.volumeUSD,
      creationBlock: poolData.creationBlock,
      creationTime: poolData.creationTime,
      creationTx: poolData.creationTx,
      creator: poolData.creator,
      feeBps: poolData.feeBps,
      poolType: "v1-volatile", // Default, would need logic to determine actual type
    };
  }

  private buildWhereInput(params?: PoolListParams) {
    if (!params) return undefined;

    const where: any = {};

    if (params.search) {
      where.OR = [
        {asset0: {symbol_contains_insensitive: params.search}},
        {asset1: {symbol_contains_insensitive: params.search}},
      ];
    }

    if (params.assetIds && params.assetIds.length > 0) {
      where.OR = [
        {asset0: {id_in: params.assetIds}},
        {asset1: {id_in: params.assetIds}},
      ];
    }

    if (params.minTvl) {
      where.tvlUSD_gte = params.minTvl.toString();
    }

    if (params.maxTvl) {
      where.tvlUSD_lte = params.maxTvl.toString();
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }
}

import {
  ISubsquidIndexer,
  IPoolIndexer,
  IAssetIndexer,
  IEventIndexer,
  IStatsIndexer,
  IndexerConfig,
} from "../interfaces";
import {
  Pool,
  Asset,
  Event,
  ProtocolStats,
  PoolListParams,
  PoolListResponse,
  EventParams,
  HistoricalParams,
  TimeSeriesData,
  AssetPrice,
  AssetMetadata,
  PoolWithReserves,
  PoolSnapshot,
  PoolStats,
  PoolPosition,
  Transaction,
  BlockInfo,
  Action,
  SwapEvent,
  LiquidityEvent,
  TimePeriod,
  TVLData,
  VolumeData,
} from "../types";

export class MockPoolIndexer implements IPoolIndexer {
  async getById(id: string): Promise<Pool> {
    return {
      id,
      asset0: {id: "asset0", name: "Asset 0", symbol: "A0", decimals: 18},
      asset1: {id: "asset1", name: "Asset 1", symbol: "A1", decimals: 18},
      asset0Id: "asset0",
      asset1Id: "asset1",
      tvlUSD: "1000000",
      volumeUSD: "500000",
      creationBlock: 1000,
      creationTime: Date.now() - 86400000,
      creationTx: "tx_hash",
      poolType: "v1-volatile",
    };
  }

  async list(params?: PoolListParams): Promise<PoolListResponse> {
    const mockPools = Array.from({length: params?.limit || 10}, (_, i) => ({
      id: `pool_${i}`,
      asset0: {
        id: `asset0_${i}`,
        name: `Asset ${i}A`,
        symbol: `A${i}A`,
        decimals: 18,
      },
      asset1: {
        id: `asset1_${i}`,
        name: `Asset ${i}B`,
        symbol: `A${i}B`,
        decimals: 18,
      },
      asset0Id: `asset0_${i}`,
      asset1Id: `asset1_${i}`,
      tvlUSD: `${(i + 1) * 100000}`,
      volumeUSD: `${(i + 1) * 50000}`,
      creationBlock: 1000 + i,
      creationTime: Date.now() - i * 3600000,
      creationTx: `tx_hash_${i}`,
      poolType: "v1-volatile" as const,
    }));

    return {
      pools: mockPools,
      totalCount: 100,
      page: params?.page || 1,
      pageSize: params?.limit || 10,
      hasMore: true,
    };
  }

  async getWithReserves(poolIds?: string[]): Promise<PoolWithReserves[]> {
    const pools = await this.list({limit: poolIds?.length || 10});
    return pools.pools.map((pool) => ({
      ...pool,
      reserve0: "1000000000000000000000",
      reserve1: "2000000000000000000000",
      reserve0Decimal: "1000.0",
      reserve1Decimal: "2000.0",
    }));
  }

  async getSnapshots(
    poolId: string,
    fromTimestamp: number
  ): Promise<PoolSnapshot[]> {
    return [];
  }

  async search(searchQuery: string): Promise<Pool[]> {
    const pools = await this.list({limit: 5});
    return pools.pools;
  }

  async getAPR(poolId: string): Promise<number> {
    return 15.5;
  }

  async getStats(poolId: string): Promise<PoolStats> {
    return {
      tvl: 1000000,
      volume24h: 50000,
      volume7d: 350000,
      fees24h: 150,
      fees7d: 1050,
      apr: 15.5,
      transactions: 1250,
    };
  }

  async getUserPositions(userAddress: string): Promise<PoolPosition[]> {
    return [];
  }

  async getReserves(poolId: string) {
    return {
      reserve0: "1000000000000000000000",
      reserve1: "2000000000000000000000",
      reserve0Decimal: "1000.0",
      reserve1Decimal: "2000.0",
    };
  }
}

export class MockAssetIndexer implements IAssetIndexer {
  async getById(id: string): Promise<Asset> {
    return {
      id,
      name: `Mock Asset ${id}`,
      symbol: `MA${id.slice(-2)}`,
      decimals: 18,
      price: "1.50",
    };
  }

  async getPrice(id: string): Promise<AssetPrice> {
    return {
      price: 1.5,
      timestamp: Date.now(),
      change24h: 5.2,
    };
  }

  async getPrices(ids: string[]): Promise<Record<string, AssetPrice>> {
    const prices: Record<string, AssetPrice> = {};
    for (const id of ids) {
      prices[id] = await this.getPrice(id);
    }
    return prices;
  }

  async list(): Promise<Asset[]> {
    return Array.from({length: 10}, (_, i) => ({
      id: `asset_${i}`,
      name: `Asset ${i}`,
      symbol: `A${i}`,
      decimals: 18,
      price: `${1 + i * 0.1}`,
    }));
  }

  async getMetadata(id: string): Promise<AssetMetadata> {
    return {
      id,
      name: `Mock Asset ${id}`,
      symbol: `MA${id.slice(-2)}`,
      decimals: 18,
      image: "https://example.com/image.png",
      description: "Mock asset for testing",
    };
  }

  async getImage(id: string): Promise<string | null> {
    return "https://example.com/image.png";
  }

  async getBatch(ids: string[]): Promise<Asset[]> {
    return Promise.all(ids.map((id) => this.getById(id)));
  }

  async search(query: string): Promise<Asset[]> {
    return this.list();
  }
}

export class MockEventIndexer implements IEventIndexer {
  async getEvents(params: EventParams): Promise<Event[]> {
    return [];
  }

  async getTransactions(
    address: string,
    limit?: number
  ): Promise<Transaction[]> {
    return [];
  }

  async getLatestBlock(): Promise<BlockInfo> {
    return {
      blockNumber: 1000000,
      blockTimestamp: Date.now(),
    };
  }

  async getBlockByNumber(blockNumber: number): Promise<BlockInfo> {
    return {
      blockNumber,
      blockTimestamp: Date.now() - (1000000 - blockNumber) * 1000,
    };
  }

  async getActions(fromBlock: number, toBlock: number): Promise<Action[]> {
    return [];
  }

  async getSwaps(poolId?: string, limit?: number): Promise<SwapEvent[]> {
    return [];
  }

  async getLiquidityEvents(
    poolId?: string,
    limit?: number
  ): Promise<LiquidityEvent[]> {
    return [];
  }

  async getSquidStatus() {
    return {
      finalizedHeight: 1000000,
      timestamp: Date.now(),
    };
  }
}

export class MockStatsIndexer implements IStatsIndexer {
  async getTVL(): Promise<TVLData> {
    return {
      current: 10000000,
      change24h: 5.2,
      change7d: 12.3,
      byPool: {},
    };
  }

  async getVolume(period: TimePeriod): Promise<VolumeData> {
    return {
      total: 1000000,
      byPool: {},
      change: 8.5,
    };
  }

  async getProtocolStats(): Promise<ProtocolStats> {
    return {
      tvl: 10000000,
      tvlChange24h: 5.2,
      volume24h: 500000,
      volume7d: 3500000,
      volumeAll: 50000000,
      fees24h: 1500,
      fees7d: 10500,
      feesAll: 150000,
      poolCount: 25,
      transactionCount24h: 1250,
      uniqueUsers24h: 350,
    };
  }

  async getHistoricalData(params: HistoricalParams): Promise<TimeSeriesData> {
    return {
      timestamps: [],
      values: [],
      label: "Mock data",
    };
  }

  async getFees(period: TimePeriod) {
    return {
      total: 1500,
      pools: {},
    };
  }

  async getPoolVolume(poolId: string, period: TimePeriod): Promise<number> {
    return 50000;
  }

  async getPoolTVL(poolId: string): Promise<number> {
    return 1000000;
  }
}

export class MockSubsquidIndexer implements ISubsquidIndexer {
  readonly pools: IPoolIndexer;
  readonly assets: IAssetIndexer;
  readonly events: IEventIndexer;
  readonly stats: IStatsIndexer;
  readonly endpoint: string;
  readonly config?: IndexerConfig;

  constructor(endpoint = "https://mock-indexer.com", config?: IndexerConfig) {
    this.endpoint = endpoint;
    this.config = config;
    this.pools = new MockPoolIndexer();
    this.assets = new MockAssetIndexer();
    this.events = new MockEventIndexer();
    this.stats = new MockStatsIndexer();
  }

  async query<T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<T> {
    return {} as T;
  }
}

export function createMockIndexer(
  endpoint?: string,
  config?: IndexerConfig,
  overrides?: {
    pools?: Partial<IPoolIndexer>;
    assets?: Partial<IAssetIndexer>;
    events?: Partial<IEventIndexer>;
    stats?: Partial<IStatsIndexer>;
  }
): ISubsquidIndexer {
  const indexer = new MockSubsquidIndexer(endpoint, config);

  if (overrides?.pools) {
    Object.assign(indexer.pools, overrides.pools);
  }
  if (overrides?.assets) {
    Object.assign(indexer.assets, overrides.assets);
  }
  if (overrides?.events) {
    Object.assign(indexer.events, overrides.events);
  }
  if (overrides?.stats) {
    Object.assign(indexer.stats, overrides.stats);
  }

  return indexer;
}

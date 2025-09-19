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
    const isStable = id.includes("stable") || id.includes("true");
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
      poolType: isStable ? "v1-stable" : "v1-volatile",
    };
  }

  async list(params?: PoolListParams): Promise<PoolListResponse> {
    const mockPools = Array.from({length: params?.limit || 10}, (_, i) => {
      const asset0Id = `0x${i.toString().padStart(2, "0")}${"1".repeat(61)}${i}`;
      const asset1Id = `0x${i.toString().padStart(2, "0")}${"2".repeat(61)}${i}`;
      const isStable = i % 3 === 0; // Make some pools stable for variety
      const poolId = `${asset0Id}-${asset1Id}-${isStable}`;

      return {
        id: poolId,
        asset0: {
          id: asset0Id,
          name: `Asset ${i}A`,
          symbol: `A${i}A`,
          decimals: 18,
        },
        asset1: {
          id: asset1Id,
          name: `Asset ${i}B`,
          symbol: `A${i}B`,
          decimals: 18,
        },
        asset0Id,
        asset1Id,
        tvlUSD: `${(i + 1) * 100000}`,
        volumeUSD: `${(i + 1) * 50000}`,
        creationBlock: 1000 + i,
        creationTime: Date.now() - i * 3600000,
        creationTx: `tx_hash_${i}`,
        poolType: isStable ? "v1-stable" : ("v1-volatile" as const),
      };
    });

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
      name: `Mock Asset ${id.slice(-4)}`,
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
      id: `0x${i.toString().padStart(2, "0")}${"0".repeat(61)}${i}`,
      name: `Asset ${i}`,
      symbol: `A${i}`,
      decimals: 18,
      price: `${1 + i * 0.1}`,
    }));
  }

  async listWithPools(): Promise<Asset[]> {
    // More realistic dev data with valid 66-character B256 asset IDs
    return [
      {
        id: "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07",
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        price: "3250.50",
        image:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23627eea'/%3E%3Ctext x='16' y='20' text-anchor='middle' fill='white' font-family='Arial' font-size='10'%3EETH%3C/text%3E%3C/svg%3E",
        numPools: 12,
        contractId:
          "0xb4bb1bbecb02ed1a3d91fe7e93a2fad1b20cdc6b2c4f1c70c95d55c6f6a51a01",
        subId:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        l1Address: "0xA0b86a33E6842a7E648c9e863fb16Eb8c6E1c0e3",
      },
      {
        id: "0x336b7c06352a4b736ff6de65ca7b5e6fd71e2a742e3fbc5a67c85dd8ddbf5a0c",
        name: "USD Coin",
        symbol: "USDC",
        decimals: 6,
        price: "1.00",
        image:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%2326a69a'/%3E%3Ctext x='16' y='20' text-anchor='middle' fill='white' font-family='Arial' font-size='9'%3EUSDC%3C/text%3E%3C/svg%3E",
        numPools: 8,
        contractId:
          "0xa6e58b58d4e9e0ccf7f826a2e7b2f3d3b8b4e4b0a1234567890abcdef1234567",
        subId:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        l1Address: "0xA0b86a33E6842a7E648c9e863fb16Eb8c6E1c0e4",
      },
      {
        id: "0x1b99de5c3b9b9b5b5b9b5b5b9b5b5b9b5b5b9b5b5b9b5b5b9b5b5b9b5b5b9b5b",
        name: "Fuel Token",
        symbol: "FUEL",
        decimals: 18,
        price: "0.045",
        image:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23ff6b35'/%3E%3Ctext x='16' y='20' text-anchor='middle' fill='white' font-family='Arial' font-size='8'%3EFUEL%3C/text%3E%3C/svg%3E",
        numPools: 6,
        contractId:
          "0xc5ae4b2a5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b",
        subId:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        l1Address: "0xA0b86a33E6842a7E648c9e863fb16Eb8c6E1c0e5",
      },
      {
        id: "0x2cafad89999cc6b3462c3de05a6e41aaed8f6b5b5b5b5b5b5b5b5b5b5b5b5b5b",
        name: "Bitcoin",
        symbol: "BTC",
        decimals: 8,
        price: "67890.25",
        image:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23f7931a'/%3E%3Ctext x='16' y='20' text-anchor='middle' fill='white' font-family='Arial' font-size='10'%3EBTC%3C/text%3E%3C/svg%3E",
        numPools: 4,
        contractId:
          "0xd6bf8b2c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c",
        subId:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        l1Address: "0xA0b86a33E6842a7E648c9e863fb16Eb8c6E1c0e6",
      },
    ];
  }

  async getMetadata(id: string): Promise<AssetMetadata> {
    return {
      id,
      name: `Mock Asset ${id}`,
      symbol: `MA${id.slice(-2)}`,
      decimals: 18,
      image:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23667eea'/%3E%3Ctext x='16' y='20' text-anchor='middle' fill='white' font-family='Arial' font-size='12'%3EMA%3C/text%3E%3C/svg%3E",
      description: "Mock asset for testing",
    };
  }

  async getImage(id: string): Promise<string | null> {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23667eea'/%3E%3Ctext x='16' y='20' text-anchor='middle' fill='white' font-family='Arial' font-size='12'%3EMA%3C/text%3E%3C/svg%3E";
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
    // Mock response for protocol stats queries
    if (query.includes("pools") && query.includes("poolTVL")) {
      // Return mock data for protocol stats query
      return {
        pools: [
          {
            poolTVL: 1000000,
            poolAlltimeVolume: 5000000,
            snapshot24hours: [
              {poolHourVolume: 10000},
              {poolHourVolume: 15000},
              {poolHourVolume: 12000},
            ],
            snapshot7days: [
              {poolHourVolume: 50000},
              {poolHourVolume: 60000},
              {poolHourVolume: 55000},
            ],
          },
          {
            poolTVL: 500000,
            poolAlltimeVolume: 2500000,
            snapshot24hours: [
              {poolHourVolume: 5000},
              {poolHourVolume: 7500},
              {poolHourVolume: 6000},
            ],
            snapshot7days: [
              {poolHourVolume: 25000},
              {poolHourVolume: 30000},
              {poolHourVolume: 27500},
            ],
          },
          {
            poolTVL: 250000,
            poolAlltimeVolume: 1000000,
            snapshot24hours: [
              {poolHourVolume: 2500},
              {poolHourVolume: 3000},
              {poolHourVolume: 2750},
            ],
            snapshot7days: [
              {poolHourVolume: 10000},
              {poolHourVolume: 12000},
              {poolHourVolume: 11000},
            ],
          },
        ],
      } as T;
    }

    // Default empty response for other queries
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

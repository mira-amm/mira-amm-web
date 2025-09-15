import {ActionType, EventType, Reserves} from "./common";

export interface Asset {
  id: string;
  l1Address?: string;
  name: string;
  symbol: string;
  decimals: number;
  supply?: string | number;
  circulatingSupply?: string | number;
  coinGeckoId?: string;
  coinMarketCapId?: string;
  metadata?: Record<string, any>;
  price?: string;
  image?: string;
  numPools?: string | number;
  contractId?: string;
  subId?: string;
}

export interface AssetPrice {
  price: number;
  timestamp?: number;
  change24h?: number;
}

export interface AssetMetadata {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  image?: string;
  description?: string;
  website?: string;
  social?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
}

export interface Pool {
  id: string;
  asset0: Asset;
  asset1: Asset;
  asset0Id: string;
  asset1Id: string;
  feesUSD?: string;
  tvlUSD?: string;
  volumeUSD?: string;
  creationBlock: number;
  creationTime: number;
  creationTx: string;
  creator?: string;
  feeBps?: number;
  isStable?: boolean;
  poolType?: "v1-volatile" | "v1-stable" | "v2-concentrated";
  metadata?: Record<string, any>;
}

export interface PoolWithReserves extends Pool {
  reserve0: string;
  reserve1: string;
  reserve0Decimal: string;
  reserve1Decimal: string;
}

export interface PoolSnapshot {
  id: string;
  poolId: string;
  timestamp: number;
  tvlUSD: string;
  volumeUSD: string;
  feesUSD: string;
  reserves0: string;
  reserves1: string;
}

export interface PoolStats {
  tvl: number;
  volume24h: number;
  volume7d: number;
  fees24h: number;
  fees7d: number;
  apr: number;
  transactions: number;
}

export interface PoolPosition {
  id: string;
  poolId: string;
  userAddress: string;
  liquidity: string;
  share: number;
  value: number;
  createdAt: number;
  updatedAt: number;
}

export interface Action {
  pool: Pool;
  recipient: string;
  asset0: {
    id: string;
    decimals: number;
  };
  asset1: {
    id: string;
    decimals: number;
  };
  amount0In?: string;
  amount0Out?: string;
  amount1In?: string;
  amount1Out?: string;
  reserves0After: string;
  reserves1After: string;
  type: ActionType;
  transaction: string;
  timestamp: number;
  blockNumber: number;
}

export interface BlockInfo {
  blockNumber: number;
  blockTimestamp: number;
  hash?: string;
  metadata?: Record<string, any>;
}

export interface Transaction {
  id: string;
  hash: string;
  from: string;
  to?: string;
  blockNumber: number;
  timestamp: number;
  type: string;
  status: "success" | "failed" | "pending";
  value?: string;
  fee?: string;
  data?: any;
}

export interface Event {
  eventType: EventType;
  txnId: string;
  txnIndex: number;
  eventIndex: number;
  maker: string;
  pairId: string;
  reserves: Reserves;
  block: BlockInfo;
  metadata?: Record<string, any>;
}

export interface SwapEvent extends Event {
  eventType: EventType.SWAP;
  priceNative: number | string;
  asset0In?: number | string;
  asset1Out?: number | string;
  asset1In?: number | string;
  asset0Out?: number | string;
}

export interface LiquidityEvent extends Event {
  eventType: EventType.JOIN | EventType.EXIT;
  amount0: number | string;
  amount1: number | string;
}

export interface ProtocolStats {
  tvl: number;
  tvlChange24h: number;
  volume24h: number;
  volume7d: number;
  volumeAll: number;
  fees24h: number;
  fees7d: number;
  feesAll: number;
  poolCount: number;
  transactionCount24h: number;
  uniqueUsers24h: number;
}

export interface TVLData {
  current: number;
  change24h: number;
  change7d: number;
  byPool: Record<string, number>;
}

export interface VolumeData {
  total: number;
  byPool: Record<string, number>;
  change: number;
}

export interface TimeSeriesData {
  timestamps: number[];
  values: number[];
  label?: string;
}

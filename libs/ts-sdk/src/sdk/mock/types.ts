import {BN, AssetId} from "fuels";
import {
  PoolIdV2,
  Amounts,
  PoolMetadataV2,
  TxParams,
  PrepareRequestOptions,
} from "../model";

/**
 * Configuration for the mock SDK
 */
export interface MockSDKConfig {
  /** Enable persistence across browser sessions using localStorage */
  enablePersistence: boolean;
  /** Key used for localStorage persistence */
  persistenceKey: string;
  /** Auto-persist state after every operation */
  autoPersist: boolean;
  /** Maximum number of transactions to persist */
  maxPersistedTransactions: number;
  /** Persistence version for migration support */
  persistenceVersion: string;
  /** Default failure rate for transaction simulation (0-1) */
  defaultFailureRate: number;
  /** Default latency for transaction simulation in milliseconds */
  defaultLatencyMs: number;
  /** Enable realistic gas price simulation */
  enableRealisticGas: boolean;
  /** Enable price impact calculations during swaps */
  enablePriceImpact: boolean;
  /** Enable slippage simulation */
  enableSlippageSimulation: boolean;
  /** Initial pool scenarios to load on startup */
  initialPoolScenarios: MockPoolScenario[];
}

/**
 * Default configuration for mock SDK
 */
export const DEFAULT_MOCK_CONFIG: MockSDKConfig = {
  enablePersistence: false,
  persistenceKey: "mira-mock-sdk-state",
  autoPersist: true,
  maxPersistedTransactions: 1000,
  persistenceVersion: "1.0.0",
  defaultFailureRate: 0.05, // 5% failure rate
  defaultLatencyMs: 1000,
  enableRealisticGas: true,
  enablePriceImpact: true,
  enableSlippageSimulation: true,
  initialPoolScenarios: [],
};

/**
 * Result of a mock transaction
 */
export interface MockTransactionResult {
  /** Whether the transaction succeeded */
  success: boolean;
  /** Unique transaction identifier */
  transactionId: string;
  /** Gas used in the transaction */
  gasUsed: BN;
  /** Gas price for the transaction */
  gasPrice: BN;
  /** Block number where transaction was included */
  blockNumber: number;
  /** Transaction timestamp */
  timestamp: Date;
  /** Error message if transaction failed */
  error?: string;
  /** Events emitted by the transaction */
  events: MockTransactionEvent[];
}

/**
 * Mock transaction event
 */
export interface MockTransactionEvent {
  /** Event type */
  type: string;
  /** Event data */
  data: Record<string, any>;
  /** Event timestamp */
  timestamp: Date;
}

/**
 * Mock transaction request matching the real SDK interface
 */
export interface MockScriptTransactionRequest {
  /** Transaction type */
  type: "script";
  /** Script bytecode */
  script: string;
  /** Script data */
  scriptData: string;
  /** Gas limit */
  gasLimit: BN;
  /** Gas price */
  gasPrice: BN;
  /** Transaction inputs */
  inputs: any[];
  /** Transaction outputs */
  outputs: any[];
  /** Transaction witnesses */
  witnesses: any[];
}

/**
 * Mock transaction with gas price (matches real SDK return type)
 */
export interface MockTransactionWithGasPrice {
  /** The transaction request */
  transactionRequest: MockScriptTransactionRequest;
  /** Gas price for the transaction */
  gasPrice: BN;
  /** Transaction result (available after execution) */
  result?: MockTransactionResult;
}

/**
 * State of a single bin in a v2 pool
 */
export interface MockBinState {
  /** Bin ID */
  binId: number;
  /** Token reserves in this bin */
  reserves: Amounts;
  /** Total LP tokens for this bin */
  totalLpTokens: BN;
  /** Price at this bin */
  price: BN;
  /** Whether this is the active bin */
  isActive: boolean;
  /** Last time this bin was involved in a swap */
  lastSwapTime?: Date;
}

/**
 * Complete state of a v2 pool
 */
export interface MockPoolState {
  /** Pool identifier */
  poolId: string;
  /** Pool metadata */
  metadata: PoolMetadataV2;
  /** Map of bin ID to bin state */
  bins: Map<number, MockBinState>;
  /** Currently active bin ID */
  activeBinId: number;
  /** Total reserves across all bins */
  totalReserves: Amounts;
  /** Protocol fees accumulated */
  protocolFees: Amounts;
  /** 24-hour trading volume */
  volume24h: BN;
  /** Pool creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  lastUpdated: Date;
}

/**
 * User's position in a specific bin
 */
export interface MockBinPosition {
  /** Bin ID */
  binId: number;
  /** Amount of LP tokens owned */
  lpTokenAmount: BN;
  /** Underlying token amounts */
  underlyingAmounts: Amounts;
  /** Fees earned from this position */
  feesEarned: Amounts;
  /** Price when position was entered */
  entryPrice: BN;
  /** Timestamp when position was created */
  entryTime: Date;
}

/**
 * User's complete position in a pool
 */
export interface MockUserPosition {
  /** User identifier */
  userId: string;
  /** Pool identifier */
  poolId: string;
  /** Map of bin ID to bin position */
  binPositions: Map<number, MockBinPosition>;
  /** Total value of all positions */
  totalValue: Amounts;
  /** Total fees earned across all positions */
  totalFeesEarned: Amounts;
  /** Position creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  lastUpdated: Date;
}

/**
 * Mock transaction record for history tracking
 */
export interface MockTransaction {
  /** Transaction ID */
  id: string;
  /** Transaction type */
  type: "addLiquidity" | "removeLiquidity" | "swap" | "createPool";
  /** User who initiated the transaction */
  userId: string;
  /** Pool involved in the transaction */
  poolId?: string;
  /** Transaction parameters */
  params: Record<string, any>;
  /** Transaction result */
  result: MockTransactionResult;
  /** Transaction timestamp */
  timestamp: Date;
}

/**
 * Predefined pool scenario for testing
 */
export interface MockPoolScenario {
  /** Scenario name */
  name: string;
  /** Scenario description */
  description: string;
  /** Pool configuration */
  poolConfig: {
    poolId: string;
    metadata: PoolMetadataV2;
    activeBinId: number;
  };
  /** Bin configurations */
  bins: Array<{
    binId: number;
    reserves: Amounts;
    lpTokens: BN;
  }>;
  /** Initial user positions */
  positions?: Array<{
    userId: string;
    binPositions: Array<{
      binId: number;
      lpTokenAmount: BN;
    }>;
  }>;
}

/**
 * Error types that can be simulated by the mock SDK
 */
export enum MockErrorType {
  INSUFFICIENT_LIQUIDITY = "InsufficientLiquidity",
  SLIPPAGE_EXCEEDED = "SlippageExceeded",
  DEADLINE_EXCEEDED = "DeadlineExceeded",
  INSUFFICIENT_BALANCE = "InsufficientBalance",
  POOL_NOT_FOUND = "PoolNotFound",
  INVALID_BIN_RANGE = "InvalidBinRange",
  NETWORK_ERROR = "NetworkError",
  GAS_ESTIMATION_FAILED = "GasEstimationFailed",
}

/**
 * Mock error class for simulating realistic errors
 */
export class MockError extends Error {
  constructor(
    public type: MockErrorType,
    message: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = "MockError";
  }
}

/**
 * Configuration for mock environment
 */
export interface MockEnvironmentConfig {
  development: MockSDKConfig;
  testing: MockSDKConfig;
  staging: MockSDKConfig;
}

/**
 * Environment-specific default configurations
 */
export const ENVIRONMENT_CONFIGS: MockEnvironmentConfig = {
  development: {
    ...DEFAULT_MOCK_CONFIG,
    enablePersistence: true,
    persistenceKey: "mira-mock-sdk-dev",
    defaultFailureRate: 0.1, // Higher failure rate for testing
    defaultLatencyMs: 500,
    autoPersist: true,
    maxPersistedTransactions: 500,
  },
  testing: {
    ...DEFAULT_MOCK_CONFIG,
    enablePersistence: false, // No persistence in tests
    persistenceKey: "mira-mock-sdk-test",
    defaultFailureRate: 0, // No failures in tests unless explicitly set
    defaultLatencyMs: 0, // Instant transactions in tests
    autoPersist: false,
    maxPersistedTransactions: 100,
  },
  staging: {
    ...DEFAULT_MOCK_CONFIG,
    enablePersistence: true,
    persistenceKey: "mira-mock-sdk-staging",
    defaultFailureRate: 0.02, // Lower failure rate
    defaultLatencyMs: 800,
    autoPersist: true,
    maxPersistedTransactions: 1000,
  },
};

/**
 * SDK initialization options
 */
export interface MockSDKInitOptions {
  /** Environment to use for configuration */
  environment?: keyof MockEnvironmentConfig;
  /** Custom configuration overrides */
  config?: Partial<MockSDKConfig>;
  /** Account to use for transactions */
  account?: MockAccount;
  /** Provider configuration */
  provider?: MockProvider;
  /** Auto-load predefined scenarios */
  autoLoadScenarios?: boolean;
  /** Scenario types to auto-load */
  scenarioTypes?: Array<"uniform" | "concentrated" | "wide" | "asymmetric">;
}

/**
 * Mock provider interface
 */
export interface MockProvider {
  /** Provider URL */
  url: string;
  /** Network configuration */
  network: {
    chainId: number;
    name: string;
  };
  /** Get current block number */
  getBlockNumber(): Promise<number>;
  /** Get gas price */
  getGasPrice(): Promise<BN>;
}

/**
 * Mock account interface
 */
export interface MockAccount {
  /** Account address */
  address: string;
  /** Account balances by asset ID */
  balances: Map<string, BN>;
  /** Get balance for specific asset */
  getBalance(assetId: string): BN;
  /** Update balance for specific asset */
  updateBalance(assetId: string, amount: BN): void;
  /** Check if account has sufficient balance */
  hasBalance(assetId: string, amount: BN): boolean;
}

/**
 * Runtime configuration for debugging and monitoring
 */
export interface MockRuntimeConfig {
  /** Enable debug logging */
  enableDebugLogging: boolean;
  /** Log all transactions */
  logTransactions: boolean;
  /** Validate state consistency after operations */
  validateStateConsistency: boolean;
  /** Enable performance metrics collection */
  enablePerformanceMetrics: boolean;
}

/**
 * Persistence configuration options
 */
export interface MockPersistenceConfig {
  /** Enable persistence */
  enabled: boolean;
  /** Storage key prefix */
  keyPrefix: string;
  /** Custom storage implementation */
  storage?: MockStorage;
  /** Compression enabled */
  compression: boolean;
  /** Encryption enabled */
  encryption: boolean;
  /** Maximum storage size in bytes */
  maxStorageSize: number;
}

/**
 * Custom storage interface for persistence
 */
export interface MockStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

/**
 * Serialized state structure for persistence
 */
export interface MockSerializedState {
  /** State version for migration */
  version: string;
  /** Timestamp when state was saved */
  timestamp: Date;
  /** Serialized pools data */
  pools: Array<[string, any]>;
  /** Serialized positions data */
  positions: Array<[string, Array<[string, any]>]>;
  /** Serialized transactions (limited by maxPersistedTransactions) */
  transactions: MockTransaction[];
  /** Configuration at time of persistence */
  config: MockSDKConfig;
}

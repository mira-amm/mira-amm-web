export const DEFAULT_AMM_CONTRACT_ID =
  "0x2e40f2b244b98ed6b8204b3de0156c6961f98525c8162f80162fcf53eebd90e7";

// v2 constants
export const DEFAULT_AMM_V2_CONTRACT_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000000"; // TODO: Replace with actual v2 contract address

// v2 specific configuration constants
export const DEFAULT_BIN_STEP = 25; // 0.25% bin step
export const MIN_BIN_STEP = 1;
export const MAX_BIN_STEP = 10000;
export const DEFAULT_BASE_FACTOR = 10000;
export const MAX_BINS_PER_OPERATION = 100;

// Bin step ranges and configurations
export const BIN_STEP_RANGES = {
  ULTRA_LOW: 1, // 0.01% - for very stable pairs
  LOW: 5, // 0.05% - for stable pairs
  MEDIUM: 25, // 0.25% - default for most pairs
  HIGH: 100, // 1.00% - for volatile pairs
  ULTRA_HIGH: 500, // 5.00% - for highly volatile pairs
} as const;

// Base factor ranges
export const BASE_FACTOR_RANGES = {
  MIN: 5000, // Minimum base factor
  DEFAULT: 10000, // Default base factor
  MAX: 50000, // Maximum base factor
} as const;

// Active bin ID constants
export const ACTIVE_BIN_ID = {
  CENTER: 8388608, // 2^23 - center bin ID
  MIN: 0, // Minimum bin ID
  MAX: 16777215, // 2^24 - 1 - maximum bin ID
} as const;

// Liquidity distribution constants
export const LIQUIDITY_DISTRIBUTION = {
  MAX_BINS: 100, // Maximum bins per liquidity operation
  MIN_DISTRIBUTION: 1, // Minimum distribution percentage
  MAX_DISTRIBUTION: 100, // Maximum distribution percentage
  DEFAULT_RANGE: 5, // Default number of bins around active bin
} as const;

// Cache configuration for v2
export const V2_CACHE_CONFIG = {
  POOL_METADATA_TTL: 60000, // 1 minute
  BIN_DATA_TTL: 30000, // 30 seconds
  FEE_DATA_TTL: 300000, // 5 minutes
  BATCH_SIZE: 50, // Maximum items per batch operation
  PRELOAD_BIN_RANGE: 10, // Number of bins to preload around active bin
} as const;

// Transaction configuration
export const V2_TRANSACTION_CONFIG = {
  DEFAULT_SLIPPAGE: 50, // 0.5% in basis points
  MAX_SLIPPAGE: 5000, // 50% in basis points
  DEFAULT_DEADLINE_MINUTES: 20, // 20 minutes
  MAX_DEADLINE_MINUTES: 60, // 1 hour
} as const;

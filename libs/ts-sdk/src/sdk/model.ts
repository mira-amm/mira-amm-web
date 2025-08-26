import {AssetId, type BN, type Address, type BigNumberish} from "fuels";

// v1 types (existing)
export type PoolId = [AssetId, AssetId, boolean];

export type Asset = [AssetId, BN];

export type PoolMetadata = {
  poolId: PoolId;
  reserve0: BN;
  reserve1: BN;
  liquidity: Asset;
  decimals0: number;
  decimals1: number;
};

export type AmmMetadata = {
  id: string;
  fees: AmmFees;
  hook: string | null;
  totalAssets: BN;
  owner: string | null;
};

export type AmmFees = {
  lpFeeVolatile: BN;
  lpFeeStable: BN;
  protocolFeeVolatile: BN;
  protocolFeeStable: BN;
};

export type LpAssetInfo = {
  assetId: AssetId;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: BN;
};

// v2 types (new)

/**
 * Pool identifier for v2 pools
 *
 * Unlike v1 which uses tuple-based pool IDs, v2 uses simple numeric identifiers.
 * Each pool is assigned a unique BN when created.
 *
 * @example
 * ```typescript
 * const poolId: PoolIdV2 = new BN("12345");
 * ```
 */
export type PoolIdV2 = BN;

/**
 * Complete metadata for a v2 pool including bin structure and reserves
 *
 * Contains all essential information about a binned liquidity pool:
 * - Pool configuration (assets, bin step, base factor)
 * - Current active bin ID (represents current price)
 * - Total reserves across all bins
 * - Protocol fees accumulated
 *
 * @example
 * ```typescript
 * const metadata: PoolMetadataV2 = {
 *   poolId: new BN("12345"),
 *   pool: {
 *     assetX: {bits: "0x..."},
 *     assetY: {bits: "0x..."},
 *     binStep: 25, // 0.25% per bin
 *     baseFactor: 10000
 *   },
 *   activeId: 8388608, // Current price bin
 *   reserves: {x: new BN("1000000"), y: new BN("2000000")},
 *   protocolFees: {x: new BN("1000"), y: new BN("2000")}
 * };
 * ```
 */
export type PoolMetadataV2 = {
  /** Unique pool identifier */
  poolId: PoolIdV2;
  /** Pool configuration and asset information */
  pool: PoolInfo;
  /** Currently active bin ID representing the current price */
  activeId: number;
  /** Total reserves across all bins */
  reserves: Amounts;
  /** Accumulated protocol fees */
  protocolFees: Amounts;
};

/**
 * Core pool configuration for v2 binned liquidity pools
 *
 * Defines the fundamental parameters of a binned liquidity pool:
 * - Asset pair being traded
 * - Bin step (price increment between adjacent bins)
 * - Base factor (precision multiplier for calculations)
 *
 * @example
 * ```typescript
 * const poolInfo: PoolInfo = {
 *   assetX: {bits: "0x..."}, // First token
 *   assetY: {bits: "0x..."}, // Second token
 *   binStep: 25,             // 0.25% price step between bins
 *   baseFactor: 10000        // Precision factor
 * };
 * ```
 */
export type PoolInfo = {
  /** First asset in the pair (typically the base asset) */
  assetX: AssetId;
  /** Second asset in the pair (typically the quote asset) */
  assetY: AssetId;
  /** Price step between adjacent bins (in basis points) */
  binStep: number;
  /** Base factor for precision in calculations */
  baseFactor: number;
};

/**
 * Token amounts for both assets in a pool
 *
 * Represents quantities of both tokens in an asset pair.
 * Used throughout v2 for reserves, liquidity amounts, and user positions.
 *
 * @example
 * ```typescript
 * const amounts: Amounts = {
 *   x: new BN("1000000"), // 1 token X (6 decimals)
 *   y: new BN("2000000")  // 2 token Y (6 decimals)
 * };
 * ```
 */
export type Amounts = {
  /** Amount of asset X */
  x: BN;
  /** Amount of asset Y */
  y: BN;
};

/**
 * Liquidity information for a specific bin
 *
 * Contains the liquidity reserves and price for a single bin in the pool.
 * Bins represent discrete price points where liquidity can be concentrated.
 *
 * @example
 * ```typescript
 * const binInfo: BinLiquidityInfo = {
 *   binId: 8388608,                    // Bin identifier
 *   liquidity: {                       // Token reserves in this bin
 *     x: new BN("500000"),
 *     y: new BN("1000000")
 *   },
 *   price: new BN("2000000")           // Price represented by this bin
 * };
 * ```
 */
export type BinLiquidityInfo = {
  /** Unique identifier for the bin */
  binId: number;
  /** Token reserves held in this bin */
  liquidity: Amounts;
  /** Price level represented by this bin */
  price: BN;
};

/**
 * Complete liquidity distribution across all bins in a pool
 *
 * Provides a comprehensive view of how liquidity is distributed across
 * the entire price range of a binned liquidity pool.
 *
 * @example
 * ```typescript
 * const distribution: LiquidityDistribution = {
 *   totalLiquidity: {x: new BN("10000000"), y: new BN("20000000")},
 *   activeBinId: 8388608,
 *   bins: [
 *     {binId: 8388607, liquidity: {x: new BN("2000000"), y: new BN("0")}, price: new BN("1950000")},
 *     {binId: 8388608, liquidity: {x: new BN("3000000"), y: new BN("6000000")}, price: new BN("2000000")},
 *     {binId: 8388609, liquidity: {x: new BN("0"), y: new BN("4000000")}, price: new BN("2050000")}
 *   ]
 * };
 * ```
 */
export type LiquidityDistribution = {
  /** Sum of all liquidity across all bins */
  totalLiquidity: Amounts;
  /** Currently active bin ID */
  activeBinId: number;
  /** Array of individual bin liquidity information */
  bins: BinLiquidityInfo[];
};

/**
 * User's liquidity position in a specific bin
 *
 * Represents a user's ownership stake in a particular bin, including
 * their LP token balance and the underlying token amounts.
 *
 * @example
 * ```typescript
 * const position: UserBinPosition = {
 *   binId: 8388608,                           // Bin where liquidity is provided
 *   lpTokenAmount: new BN("1000000"),         // LP tokens owned
 *   underlyingAmounts: {                      // Underlying token amounts
 *     x: new BN("500000"),
 *     y: new BN("1000000")
 *   }
 * };
 * ```
 */
export type UserBinPosition = {
  /** Bin ID where the position exists */
  binId: number;
  /** Amount of LP tokens owned in this bin */
  lpTokenAmount: BN;
  /** Underlying token amounts represented by the LP tokens */
  underlyingAmounts: Amounts;
};

/**
 * Configuration for distributing liquidity across bins
 *
 * Defines how liquidity should be allocated to a specific bin when
 * adding liquidity to a pool. Distribution percentages must sum to 100
 * across all bins in the configuration.
 *
 * @example
 * ```typescript
 * const configs: LiquidityConfig[] = [
 *   {binId: 8388607, distributionX: 20, distributionY: 0},   // 20% X, 0% Y below price
 *   {binId: 8388608, distributionX: 60, distributionY: 80},  // 60% X, 80% Y at price
 *   {binId: 8388609, distributionX: 20, distributionY: 20}   // 20% X, 20% Y above price
 * ];
 * ```
 */
export type LiquidityConfig = {
  /** Target bin ID for liquidity placement */
  binId: number;
  /** Percentage of X tokens to allocate to this bin (0-100) */
  distributionX: number;
  /** Percentage of Y tokens to allocate to this bin (0-100) */
  distributionY: number;
};

/**
 * Relative position from the active bin
 *
 * Used to specify bin positions relative to the currently active bin.
 * Positive values are bins above the current price, negative values
 * are bins below the current price.
 *
 * @example
 * ```typescript
 * const deltas: BinIdDelta[] = [
 *   {Negative: 2},  // 2 bins below active (lower price)
 *   {Negative: 1},  // 1 bin below active
 *   {Positive: 0},  // Active bin (current price)
 *   {Positive: 1},  // 1 bin above active
 *   {Positive: 2}   // 2 bins above active (higher price)
 * ];
 * ```
 */
export type BinIdDelta = {
  /** Number of bins below the active bin */
  Negative?: number;
  /** Number of bins above the active bin */
  Positive?: number;
};

/**
 * Metadata for the v2 AMM contract
 *
 * Contains global information about the v2 AMM contract instance,
 * including ownership, fee configuration, and total assets managed.
 *
 * @example
 * ```typescript
 * const metadata: AmmMetadataV2 = {
 *   id: "0x...",                    // Contract ID
 *   hook: "0x...",                  // Optional hook contract
 *   totalAssets: new BN("1000"),    // Number of asset types
 *   owner: "fuel1...",              // Contract owner
 *   feeRecipient: "fuel1...",       // Fee recipient address
 *   protocolFees: 25                // Protocol fee in basis points
 * };
 * ```
 */
export type AmmMetadataV2 = {
  /** Contract identifier */
  id: string;
  /** Optional hook contract for custom logic */
  hook: string | null;
  /** Total number of different assets managed */
  totalAssets: BN;
  /** Contract owner address */
  owner: string | null;
  /** Address that receives protocol fees */
  feeRecipient: string;
  /** Protocol fee rate (note: v2 has per-pool fees, this is a default) */
  protocolFees: number;
};

// v2 specific input types for contract calls
export type PoolInput = {
  assetX: AssetId;
  assetY: AssetId;
  binStep: BigNumberish;
  baseFactor: BigNumberish;
};

// Error types for v2
export enum PoolCurveStateError {
  PoolAlreadyExists = "PoolAlreadyExists",
  InvalidParameters = "InvalidParameters",
  PoolNotFound = "PoolNotFound",
  Unauthorized = "Unauthorized",
  InvalidBinStep = "InvalidBinStep",
  InvalidActiveId = "InvalidActiveId",
  IdenticalAssets = "IdenticalAssets",
  ZeroAddress = "ZeroAddress",
  MaxLiquidityPerBinExceeded = "MaxLiquidityPerBinExceeded",
  ZeroShares = "ZeroShares",
  CompositionFactorFlawed = "CompositionFactorFlawed",
  InvalidLPTokenBalance = "InvalidLPTokenBalance",
  UnknownLPToken = "UnknownLPToken",
  LPTokenFromWrongPool = "LPTokenFromWrongPool",
  InsufficientAmountIn = "InsufficientAmountIn",
  OutOfLiquidity = "OutOfLiquidity",
  InsufficientAmountOut = "InsufficientAmountOut",
  AlreadyInitialized = "AlreadyInitialized",
  NotInitialized = "NotInitialized",
  SwapNotPossible = "SwapNotPossible",
}

export class MiraV2Error extends Error {
  constructor(
    public readonly errorType: PoolCurveStateError,
    message: string,
    public readonly context?: any
  ) {
    super(message);
    this.name = "MiraV2Error";
  }
}

// Cache options are defined in cache/types.ts

// Transaction parameters for v2 operations
export type TxParams = {
  gasLimit?: BigNumberish;
  gasPrice?: BigNumberish;
  maxFee?: BigNumberish;
};

// Prepare request options for v2 operations
export type PrepareRequestOptions = {
  fundTransaction?: boolean;
  estimateGas?: boolean;
};

import {AssetId, BigNumberish, BN, Provider} from "fuels";

import {
  AmmFees,
  AmmMetadata,
  LpAssetInfo,
  PoolId,
  PoolMetadata,
} from "../model";

import {CacheOptions} from "../cache";

/**
 * Interface for ReadonlyMiraAmm - Read-only operations for Mira v1 constant product AMM pools
 *
 * This interface defines methods for querying Mira v1 pool data without executing transactions.
 * It includes caching mechanisms for improved performance and batch operations for efficiency.
 */
export interface IReadonlyMiraAmm {
  /**
   * The Fuel provider for blockchain queries
   */
  readonly provider: Provider;

  /**
   * Gets the contract ID of the v1 AMM contract
   * @returns The contract ID as a string
   */
  id(): string;

  /**
   * Get comprehensive AMM metadata including fees, hook, and ownership
   *
   * @returns AMM metadata including all global settings
   */
  ammMetadata(): Promise<AmmMetadata>;

  /**
   * Get metadata for multiple v1 pools efficiently in a single batch operation
   *
   * @param poolIds - Array of v1 pool identifiers to query
   * @param options - Caching and refresh options applied to all pools
   * @returns Array of pool metadata (null for non-existent pools)
   */
  poolMetadataBatch(
    poolIds: PoolId[],
    options?: CacheOptions
  ): Promise<(PoolMetadata | null)[]>;

  /**
   * Get comprehensive metadata for a single v1 pool
   *
   * @param poolId - The v1 pool identifier
   * @param options - Caching and refresh options
   * @returns Pool metadata or null if pool doesn't exist
   */
  poolMetadata(
    poolId: PoolId,
    options?: CacheOptions
  ): Promise<PoolMetadata | null>;

  /**
   * Get the current fee configuration for the AMM
   *
   * @returns Fee configuration including LP, protocol, and hook fees
   */
  fees(): Promise<AmmFees>;

  /**
   * Get the current hook contract address
   *
   * @returns Hook contract address or null if not set
   */
  hook(): Promise<string | null>;

  /**
   * Get the total number of unique assets in all pools
   *
   * @returns Total number of unique assets
   */
  totalAssets(): Promise<BN>;

  /**
   * Get information about an LP token
   *
   * @param assetId - The LP token asset ID
   * @returns LP asset information or null if not found
   */
  lpAssetInfo(assetId: AssetId): Promise<LpAssetInfo | null>;

  /**
   * Get the total supply of an LP token
   *
   * @param assetId - The LP token asset ID
   * @returns Total supply or undefined if not found
   */
  totalSupply(assetId: AssetId): Promise<BN | undefined>;

  /**
   * Get the current owner of the AMM contract
   *
   * @returns Owner address or null if not set
   */
  owner(): Promise<string | null>;

  /**
   * Calculate optimal amounts for adding liquidity to maintain current pool ratio
   *
   * @param poolId - The v1 pool identifier
   * @param isFirstToken0 - Whether the first token is token0
   * @param amountADesired - Desired amount of token A
   * @param amountBDesired - Desired amount of token B
   * @returns Tuple of [optimal amount A, optimal amount B]
   */
  getOtherTokenToAddLiquidity(
    poolId: PoolId,
    isFirstToken0: boolean,
    amountADesired: BigNumberish,
    amountBDesired: BigNumberish
  ): Promise<[BN, BN]>;

  /**
   * Get a user's liquidity position in a pool
   *
   * @param poolId - The v1 pool identifier
   * @param lpTokenBalance - User's LP token balance
   * @returns Tuple of [amount of token A, amount of token B]
   */
  getLiquidityPosition(
    poolId: PoolId,
    lpTokenBalance: BigNumberish
  ): Promise<[BN, BN]>;

  /**
   * Calculate output amounts for a given input amount through multiple pools
   *
   * @param assetIn - Input asset ID
   * @param amountIn - Amount of input tokens
   * @param pools - Array of v1 pool IDs to route through
   * @returns Array of output amounts for each step
   */
  getAmountsOut(
    assetIn: AssetId,
    amountIn: BigNumberish,
    pools: PoolId[]
  ): Promise<BN[]>;

  /**
   * Calculate required input amounts for a desired output amount through multiple pools
   *
   * @param assetOut - Output asset ID
   * @param amountOut - Desired output amount
   * @param pools - Array of v1 pool IDs to route through
   * @returns Array of input amounts for each step
   */
  getAmountsIn(
    assetOut: AssetId,
    amountOut: BigNumberish,
    pools: PoolId[]
  ): Promise<BN[]>;

  /**
   * Preview the output amount for a swap with exact input through v1 pools
   *
   * @param assetIn - Input asset ID
   * @param amountIn - Exact amount of input tokens
   * @param pools - Array of v1 pool IDs to route through
   * @returns Tuple of [asset out ID, amount out]
   */
  previewSwapExactInput(
    assetIn: AssetId,
    amountIn: BigNumberish,
    pools: PoolId[]
  ): Promise<[AssetId, BN]>;

  /**
   * Preview the input amount required for a swap with exact output through v1 pools
   *
   * @param assetOut - Output asset ID
   * @param amountOut - Exact amount of output tokens desired
   * @param pools - Array of v1 pool IDs to route through
   * @returns Tuple of [asset in ID, amount in required]
   */
  previewSwapExactOutput(
    assetOut: AssetId,
    amountOut: BigNumberish,
    pools: PoolId[]
  ): Promise<[AssetId, BN]>;

  /**
   * Preview swaps with exact input for multiple route combinations in batch
   *
   * @param assetIn - Input asset ID
   * @param amountIn - Exact amount of input tokens
   * @param routes - Array of routes (each route is an array of pool IDs)
   * @returns Array of [asset out ID, amount out] tuples for each route
   */
  previewSwapExactInputBatch(
    assetIn: AssetId,
    amountIn: BigNumberish,
    routes: PoolId[][]
  ): Promise<[AssetId, BN][]>;

  /**
   * Preview swaps with exact output for multiple route combinations in batch
   *
   * @param assetOut - Output asset ID
   * @param amountOut - Exact amount of output tokens desired
   * @param routes - Array of routes (each route is an array of pool IDs)
   * @returns Array of [asset in ID, amount in] tuples for each route
   */
  previewSwapExactOutputBatch(
    assetOut: AssetId,
    amountOut: BigNumberish,
    routes: PoolId[][]
  ): Promise<[AssetId, BN][]>;

  /**
   * Preload pool data for anticipated routes with automatic change detection
   *
   * @param routes - Array of routes that will be used
   * @param options - Caching options
   */
  preloadPoolsForRoutesWithChangeDetection(
    routes: PoolId[][],
    options?: CacheOptions
  ): Promise<void>;

  /**
   * Preload pool data for anticipated routes to optimize subsequent operations
   *
   * @param routes - Array of routes that will be used
   * @param options - Caching options
   */
  preloadPoolsForRoutes(
    routes: PoolId[][],
    options?: CacheOptions
  ): Promise<void>;
}

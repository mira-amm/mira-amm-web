import {AssetId, BigNumberish, BN, Provider, Address} from "fuels";

import {
  PoolIdV2,
  PoolMetadataV2,
  Amounts,
  BinLiquidityInfo,
  LiquidityDistribution,
  UserBinPosition,
  AmmMetadataV2,
  LpAssetInfo,
} from "../model";

import {CacheOptions} from "../cache";

/**
 * Interface for ReadonlyMiraAmmV2 - Read-only operations for Mira v2 binned liquidity pools
 *
 * This interface defines methods for querying Mira v2 pool data without executing transactions.
 * It includes advanced caching mechanisms optimized for the binned liquidity model and
 * supports batch operations for improved performance.
 */
export interface IReadonlyMiraAmmV2 {
  /**
   * The Fuel provider for blockchain queries
   */
  readonly provider: Provider;

  /**
   * Gets the contract ID of the v2 AMM contract
   * @returns The contract ID as a B256 string
   */
  id(): string;

  /**
   * Get comprehensive metadata for a single v2 pool
   *
   * @param poolId - The v2 pool identifier (BN)
   * @param options - Caching and refresh options
   * @returns Pool metadata or null if pool doesn't exist
   */
  poolMetadata(
    poolId: PoolIdV2,
    options?: CacheOptions
  ): Promise<PoolMetadataV2 | null>;

  /**
   * Get metadata for multiple v2 pools efficiently in a single batch operation
   *
   * @param poolIds - Array of v2 pool identifiers to query
   * @param options - Caching and refresh options applied to all pools
   * @returns Array of pool metadata (null for non-existent pools)
   */
  poolMetadataBatch(
    poolIds: PoolIdV2[],
    options?: CacheOptions
  ): Promise<(PoolMetadataV2 | null)[]>;

  /**
   * Get the fee rate for a specific v2 pool
   *
   * @param poolId - The v2 pool identifier
   * @returns Fee rate in basis points (10000 = 100%)
   */
  fees(poolId: PoolIdV2): Promise<BN>;

  /**
   * Get global AMM v2 metadata including contract settings and limits
   *
   * @returns AMM v2 metadata including hook address and flash loan fee
   */
  ammMetadata(): Promise<AmmMetadataV2>;

  /**
   * Get information about an LP token for a specific bin
   *
   * @param assetId - The LP token asset ID
   * @returns LP asset information or null if not found
   */
  lpAssetInfo(assetId: AssetId): Promise<LpAssetInfo | null>;

  /**
   * Preview the output amount for a swap with exact input through v2 pools
   *
   * @param assetIn - Input asset ID
   * @param amountIn - Exact amount of input tokens
   * @param pools - Array of v2 pool IDs to route through
   * @returns Tuple of [asset out ID, amount out]
   */
  previewSwapExactInput(
    assetIn: AssetId,
    amountIn: BigNumberish,
    pools: PoolIdV2[]
  ): Promise<[AssetId, BN]>;

  /**
   * Preview the input amount required for a swap with exact output through v2 pools
   *
   * @param assetOut - Output asset ID
   * @param amountOut - Exact amount of output tokens desired
   * @param pools - Array of v2 pool IDs to route through
   * @returns Tuple of [asset in ID, amount in required]
   */
  previewSwapExactOutput(
    assetOut: AssetId,
    amountOut: BigNumberish,
    pools: PoolIdV2[]
  ): Promise<[AssetId, BN]>;

  /**
   * Calculate output amounts for a given input amount through multiple pools
   *
   * @param assetIn - Input asset ID
   * @param amountIn - Amount of input tokens
   * @param pools - Array of v2 pool IDs to route through
   * @returns Array of output amounts for each step
   */
  getAmountsOut(
    assetIn: AssetId,
    amountIn: BigNumberish,
    pools: PoolIdV2[]
  ): Promise<BN[]>;

  /**
   * Calculate required input amounts for a desired output amount through multiple pools
   *
   * @param assetOut - Output asset ID
   * @param amountOut - Desired output amount
   * @param pools - Array of v2 pool IDs to route through
   * @returns Array of input amounts for each step
   */
  getAmountsIn(
    assetOut: AssetId,
    amountOut: BigNumberish,
    pools: PoolIdV2[]
  ): Promise<BN[]>;

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
    routes: PoolIdV2[][]
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
    routes: PoolIdV2[][]
  ): Promise<[AssetId, BN][]>;

  /**
   * Get detailed liquidity information for a specific bin in a v2 pool
   *
   * @param poolId - The v2 pool identifier
   * @param binId - The bin identifier
   * @returns Bin liquidity information or null if bin has no liquidity
   */
  getBinLiquidity(
    poolId: PoolIdV2,
    binId: BigNumberish
  ): Promise<BinLiquidityInfo | null>;

  /**
   * Get the current active bin ID for a v2 pool
   *
   * @param poolId - The v2 pool identifier
   * @returns Active bin ID or null if pool doesn't exist
   */
  getActiveBin(poolId: PoolIdV2): Promise<number | null>;

  /**
   * Get liquidity information for a range of bins in a v2 pool
   *
   * @param poolId - The v2 pool identifier
   * @param startBinId - Starting bin ID (inclusive)
   * @param endBinId - Ending bin ID (inclusive)
   * @returns Map of bin IDs to liquidity information
   */
  getBinRange(
    poolId: PoolIdV2,
    startBinId: BigNumberish,
    endBinId: BigNumberish
  ): Promise<Map<number, BinLiquidityInfo>>;

  /**
   * Get comprehensive liquidity distribution analysis for a v2 pool
   *
   * @param poolId - The v2 pool identifier
   * @param binRange - Optional range of bins to analyze (defaults to ±100 from active)
   * @returns Liquidity distribution analysis
   */
  getLiquidityDistribution(
    poolId: PoolIdV2,
    binRange?: number
  ): Promise<LiquidityDistribution>;

  /**
   * Get reserves for a specific bin in a v2 pool
   *
   * @param poolId - The v2 pool identifier
   * @param binId - The bin identifier
   * @returns Reserves amounts for the bin
   */
  getBinReserves(poolId: PoolIdV2, binId: BigNumberish): Promise<Amounts>;

  /**
   * Get all bin positions for a user in a specific v2 pool
   *
   * @param poolId - The v2 pool identifier
   * @param userAddress - User's address
   * @param maxBinsToCheck - Maximum number of bins to check (default 200)
   * @returns Array of user's bin positions
   */
  getUserBinPositions(
    poolId: PoolIdV2,
    userAddress: Address,
    maxBinsToCheck?: number
  ): Promise<UserBinPosition[]>;

  /**
   * Get total reserves for a v2 pool across all bins
   *
   * @param poolId - The v2 pool identifier
   * @returns Total reserves across all bins
   */
  getPoolReserves(poolId: PoolIdV2): Promise<Amounts>;

  /**
   * Find the next non-empty bin in a given direction
   *
   * @param poolId - The v2 pool identifier
   * @param currentBinId - Starting bin ID
   * @param searchUp - Search direction (true = higher bins, false = lower bins)
   * @returns Next non-empty bin ID or null if none found
   */
  getNextNonEmptyBin(
    poolId: PoolIdV2,
    currentBinId: BigNumberish,
    searchUp: boolean
  ): Promise<number | null>;

  /**
   * Calculate the price for a specific bin ID
   *
   * @param poolId - The v2 pool identifier
   * @param binId - The bin identifier
   * @returns Price represented by the bin
   */
  getPriceFromId(poolId: PoolIdV2, binId: BigNumberish): Promise<BN>;

  /**
   * Calculate optimal amounts for adding liquidity to maintain current pool ratio
   *
   * @param poolId - The v2 pool identifier
   * @param binId - Target bin ID for liquidity
   * @param amountA - Amount of token A
   * @param amountB - Amount of token B
   * @param isFirstTokenX - Whether the first token is X
   * @returns Tuple of [optimal amount A, optimal amount B]
   */
  getOtherTokenToAddLiquidity(
    poolId: PoolIdV2,
    binId: BigNumberish,
    amountA: BigNumberish,
    amountB: BigNumberish,
    isFirstTokenX: boolean
  ): Promise<[BN, BN]>;

  /**
   * Get detailed liquidity position information for a user
   *
   * @param poolId - The v2 pool identifier
   * @param userAddress - User's address
   * @param binIds - Specific bin IDs to check (optional, checks all if not provided)
   * @returns Detailed position information including values and shares
   */
  getLiquidityPositionDetailed(
    poolId: PoolIdV2,
    userAddress: Address,
    binIds?: BigNumberish[]
  ): Promise<{
    positions: UserBinPosition[];
    totalValueX: BN;
    totalValueY: BN;
    activeBinId: number;
  }>;

  /**
   * Get simplified liquidity position for a user across all their bins
   *
   * @param poolId - The v2 pool identifier
   * @param userAddress - User's address
   * @returns Aggregated position amounts
   */
  getLiquidityPosition(
    poolId: PoolIdV2,
    userAddress: Address
  ): Promise<{
    amountX: BN;
    amountY: BN;
    binCount: number;
  }>;

  /**
   * Calculate optimal liquidity distribution across bins for a given amount
   *
   * @param poolId - The v2 pool identifier
   * @param amountX - Amount of token X to distribute
   * @param amountY - Amount of token Y to distribute
   * @param strategy - Distribution strategy ('concentrated', 'normal', 'wide')
   * @param numBins - Number of bins to distribute across
   * @returns Optimal distribution configuration
   */
  calculateOptimalLiquidityDistribution(
    poolId: PoolIdV2,
    amountX: BigNumberish,
    amountY: BigNumberish,
    strategy?: "concentrated" | "normal" | "wide",
    numBins?: number
  ): Promise<{
    deltaIds: Array<{Positive?: number; Negative?: number}>;
    distributionX: number[];
    distributionY: number[];
    activeBinId: number;
  }>;

  /**
   * Preload pool data for an anticipated route to optimize subsequent operations
   *
   * @param pools - Array of v2 pool IDs that will be used
   * @param preloadBins - Whether to preload bin data (default: false)
   * @param binRange - Range of bins around active to preload (default: 10)
   */
  preloadRoute(
    pools: PoolIdV2[],
    preloadBins?: boolean,
    binRange?: number
  ): Promise<void>;

  /**
   * Warm up the cache with frequently accessed pool data
   *
   * @param poolIds - Specific pool IDs to warm up (optional)
   * @param options - Cache warming options
   */
  warmUpCache(
    poolIds?: PoolIdV2[],
    options?: {
      includeMetadata?: boolean;
      includeBins?: boolean;
      binRange?: number;
    }
  ): Promise<void>;
}

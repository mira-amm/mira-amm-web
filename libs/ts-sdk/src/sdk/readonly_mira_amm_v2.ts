import {
  DEFAULT_AMM_V2_CONTRACT_ID,
  BASE_FACTOR_RANGES,
  V2_CACHE_CONFIG,
  ACTIVE_BIN_ID,
} from "./constants";
import {AssetId, BigNumberish, BN, Provider, Address} from "fuels";
import {
  Asset,
  PoolIdV2,
  PoolMetadataV2,
  PoolInfo,
  Amounts,
  BinLiquidityInfo,
  LiquidityDistribution,
  UserBinPosition,
  AmmMetadataV2,
  LpAssetInfo,
  MiraV2Error,
  PoolCurveStateError,
} from "./model";

import {
  poolIdV2Input,
  poolContainsAssetV2,
  assetInput,
  addressInput,
} from "./utils";

import {
  withErrorHandling,
  createErrorContext,
  EnhancedMiraV2Error,
} from "./errors/v2-errors";

import {validatePoolId, validateAssetId, validateBinId} from "./validation";

import type {CacheOptions} from "./cache";
import {
  DEFAULT_CACHE_OPTIONS,
  globalPoolDataCacheV2,
  PoolDataCacheV2,
  CacheManagerV2,
} from "./cache";

import {PoolCurveState} from "./typegen/contracts-v2";
import {IReadonlyMiraAmmV2} from "./interfaces/IReadonlyMiraAmmV2";

/**
 * ReadonlyMiraAmmV2 - Read-only operations for Mira v2 binned liquidity pools
 *
 * This class provides methods for querying Mira v2 pool data without executing transactions.
 * It includes advanced caching mechanisms optimized for the binned liquidity model and
 * supports batch operations for improved performance.
 *
 * Key features:
 * - Bin-specific liquidity queries for granular pool analysis
 * - Intelligent caching with bin-level granularity
 * - Batch operations for efficient multi-pool queries
 * - Swap preview calculations using binned liquidity math
 * - Position management utilities for concentrated liquidity
 *
 * @example
 * ```typescript
 * import { Provider } from "fuels";
 * import { ReadonlyMiraAmmV2 } from "mira-dex-ts";
 *
 * const provider = await Provider.create("https://testnet.fuel.network/v1/graphql");
 * const readonlyAmm = new ReadonlyMiraAmmV2(provider);
 *
 * // Query pool metadata
 * const poolId = new BN("12345");
 * const metadata = await readonlyAmm.poolMetadata(poolId);
 * console.log(`Active bin: ${metadata.activeId}`);
 *
 * // Analyze liquidity distribution
 * const distribution = await readonlyAmm.getLiquidityDistribution(poolId);
 * console.log(`Total liquidity: ${distribution.totalLiquidity.x} X, ${distribution.totalLiquidity.y} Y`);
 *
 * // Preview swap with bin-aware calculations
 * const preview = await readonlyAmm.previewSwapExactInput(
 *   assetIn,
 *   new BN("1000000"),
 *   [poolId]
 * );
 * console.log(`Expected output: ${preview[1]} tokens`);
 * ```
 */
export class ReadonlyMiraAmmV2 implements IReadonlyMiraAmmV2 {
  provider: Provider;
  ammContract: PoolCurveState;
  private poolCache: PoolDataCacheV2;
  private lastRouteSignature: string | null = null;
  private cacheManager: CacheManagerV2;

  /**
   * Creates a new ReadonlyMiraAmmV2 instance for querying v2 pool data
   *
   * @param provider - Fuel provider for blockchain queries
   * @param contractIdOpt - Optional v2 contract ID (uses default if not provided)
   */
  constructor(provider: Provider, contractIdOpt?: string) {
    const contractId = contractIdOpt ?? DEFAULT_AMM_V2_CONTRACT_ID;
    this.provider = provider;
    this.ammContract = new PoolCurveState(contractId, provider);
    this.poolCache = globalPoolDataCacheV2;
    this.cacheManager = new CacheManagerV2(this.poolCache, this);
  }

  /**
   * Gets the contract ID of the v2 AMM contract
   *
   * @returns The contract ID as a B256 string
   */
  id(): string {
    return this.ammContract.id.toB256();
  }

  /**
   * Get comprehensive metadata for a single v2 pool
   *
   * Retrieves complete pool information including bin structure, active bin,
   * total reserves, and protocol fees. Uses intelligent caching to minimize
   * contract calls while ensuring data freshness.
   *
   * @param poolId - The v2 pool identifier (BN)
   * @param options - Caching and refresh options
   * @returns Pool metadata or null if pool doesn't exist
   *
   * @example
   * ```typescript
   * const poolId = new BN("12345");
   * const metadata = await readonlyAmm.poolMetadata(poolId);
   *
   * if (metadata) {
   *   console.log(`Pool ${poolId}:`);
   *   console.log(`  Assets: ${metadata.pool.assetX.bits} / ${metadata.pool.assetY.bits}`);
   *   console.log(`  Active bin: ${metadata.activeId}`);
   *   console.log(`  Reserves: ${metadata.reserves.x} X, ${metadata.reserves.y} Y`);
   *   console.log(`  Bin step: ${metadata.pool.binStep} basis points`);
   * }
   * ```
   */
  async poolMetadata(
    poolId: PoolIdV2,
    options: CacheOptions = {}
  ): Promise<PoolMetadataV2 | null> {
    const context = createErrorContext("poolMetadata", {poolId});
    validatePoolId(poolId, context);

    return withErrorHandling(async () => {
      const results = await this.poolMetadataBatch([poolId], options);
      return results[0];
    }, context);
  }

  /**
   * Get metadata for multiple v2 pools efficiently in a single batch operation
   *
   * Optimizes performance by batching multiple pool queries and leveraging
   * intelligent caching. Significantly reduces network overhead compared to
   * individual queries when working with multiple pools.
   *
   * @param poolIds - Array of v2 pool identifiers to query
   * @param options - Caching and refresh options applied to all pools
   * @returns Array of pool metadata (null for non-existent pools)
   *
   * @example
   * ```typescript
   * const poolIds = [new BN("12345"), new BN("67890"), new BN("11111")];
   * const metadataList = await readonlyAmm.poolMetadataBatch(poolIds);
   *
   * metadataList.forEach((metadata, index) => {
   *   if (metadata) {
   *     console.log(`Pool ${poolIds[index]}: Active bin ${metadata.activeId}`);
   *   } else {
   *     console.log(`Pool ${poolIds[index]}: Not found`);
   *   }
   * });
   * ```
   */
  async poolMetadataBatch(
    poolIds: PoolIdV2[],
    options: CacheOptions = {}
  ): Promise<(PoolMetadataV2 | null)[]> {
    const context = createErrorContext("poolMetadataBatch");

    // Validate all pool IDs
    poolIds.forEach((poolId, index) => {
      validatePoolId(poolId, {...context, poolIndex: index});
    });

    return withErrorHandling(async () => {
      const effectiveOptions = {...DEFAULT_CACHE_OPTIONS, ...options};

      // If caching is disabled, use direct fetch
      if (!effectiveOptions.useCache) {
        return this.poolMetadataBatchDirect(poolIds);
      }

      const results: (PoolMetadataV2 | null)[] = [];
      const poolsToFetch: PoolIdV2[] = [];
      const fetchIndices: number[] = [];

      // Check cache for each pool
      for (let i = 0; i < poolIds.length; i++) {
        const poolId = poolIds[i];
        const cached = this.poolCache.getPoolMetadata(poolId);

        if (cached && !this.poolCache.isStale(poolId)) {
          // Use cached data
          results[i] = cached.metadata;
        } else if (cached && this.poolCache.isStale(poolId)) {
          // Handle stale data
          if (effectiveOptions.refreshStaleData) {
            // Mark for refresh
            poolsToFetch.push(poolId);
            fetchIndices.push(i);
            // Use stale data temporarily
            results[i] = cached.metadata;
          } else {
            // Use stale data as-is
            results[i] = cached.metadata;
          }
        } else {
          // Cache miss - need to fetch
          poolsToFetch.push(poolId);
          fetchIndices.push(i);
          results[i] = null; // Placeholder
        }
      }

      // Fetch missing or stale pools
      if (poolsToFetch.length > 0) {
        try {
          const fetchedPools = await this.poolMetadataBatchDirect(poolsToFetch);
          // Update cache and results
          for (let i = 0; i < poolsToFetch.length; i++) {
            const poolId = poolsToFetch[i];
            const metadata = fetchedPools[i];
            const resultIndex = fetchIndices[i];

            if (metadata) {
              // Store in cache with custom TTL if provided
              this.poolCache.setPoolMetadata(
                poolId,
                metadata,
                effectiveOptions.cacheTTL
              );
              results[resultIndex] = metadata;
            }
          }
        } catch (error) {
          // If fetch fails, use any available stale data or throw
          const hasStaleData = results.some(
            (result, index) => result !== null && fetchIndices.includes(index)
          );

          if (hasStaleData) {
            // Log warning but continue with stale data
            console.warn(
              "Failed to refresh v2 pool data, using stale cache:",
              error
            );
          } else {
            // No fallback data available, re-throw error
            throw new MiraV2Error(
              PoolCurveStateError.PoolNotFound,
              "Failed to fetch pool metadata and no cache available",
              error instanceof Error ? error : new Error(String(error))
            );
          }
        }
      }

      return results;
    }, context);
  }

  /**
   * Direct pool metadata batch fetch without caching
   */
  private async poolMetadataBatchDirect(
    poolIds: PoolIdV2[]
  ): Promise<(PoolMetadataV2 | null)[]> {
    try {
      // Create batch calls using get_pool method for v2
      const poolIdTransactions = poolIds.map((poolId) =>
        this.ammContract.functions.get_pool(poolIdV2Input(poolId))
      );

      const {value} = await this.ammContract
        .multiCall(poolIdTransactions)
        .get();

      if (!value || value.length !== poolIds.length) {
        throw new MiraV2Error(
          PoolCurveStateError.InvalidParameters,
          "Mismatch between pools and metadata results while fetching pool metadata in batch."
        );
      }

      return poolIds.map((poolId, index) => {
        const poolResult = value[index];

        if (!poolResult) {
          return null;
        }

        // Convert the contract response to PoolMetadataV2 format
        return {
          poolId: poolId,
          pool: {
            assetX: poolResult.pool.asset_x,
            assetY: poolResult.pool.asset_y,
            binStep: poolResult.pool.bin_step,
            baseFactor: poolResult.pool.base_factor,
          },
          activeId: poolResult.active_id,
          reserves: {
            x: poolResult.reserves.x,
            y: poolResult.reserves.y,
          },
          protocolFees: {
            x: poolResult.protocol_fees.x,
            y: poolResult.protocol_fees.y,
          },
        };
      });
    } catch (error) {
      throw new MiraV2Error(
        PoolCurveStateError.PoolNotFound,
        `Failed to fetch pool metadata: ${error instanceof Error ? error.message : String(error)}`,
        {poolIds, error}
      );
    }
  }

  /**
   * Get the base fee rate for a specific v2 pool
   *
   * Unlike v1 which has global fees, v2 pools each have their own fee structure.
   * The base fee is applied to swaps and may be modified by hooks or other factors.
   * Results are cached to improve performance for repeated queries.
   *
   * @param poolId - The v2 pool identifier
   * @returns Base fee rate as a BN (typically in basis points)
   *
   * @example
   * ```typescript
   * const poolId = new BN("12345");
   * const fee = await readonlyAmm.fees(poolId);
   * console.log(`Pool fee: ${fee.toNumber()} basis points`);
   *
   * // Convert to percentage
   * const feePercent = fee.toNumber() / 10000;
   * console.log(`Pool fee: ${feePercent}%`);
   * ```
   */
  async fees(poolId: PoolIdV2): Promise<BN> {
    // Check cache first
    const cachedFee = this.poolCache.getPoolFee(poolId);
    if (cachedFee !== null) {
      return new BN(cachedFee);
    }

    try {
      // Fetch fresh fee from the contract using get_base_fee
      const result = await this.ammContract.functions
        .get_base_fee(poolIdV2Input(poolId))
        .get();

      if (!result.value) {
        throw new MiraV2Error(
          PoolCurveStateError.PoolNotFound,
          `Pool with ID ${poolId.toString()} not found or has no fee data`
        );
      }

      const fee = result.value;

      // Cache the fee (convert BN to number for caching)
      this.poolCache.setPoolFee(poolId, fee.toNumber());

      return fee;
    } catch (error) {
      throw new MiraV2Error(
        PoolCurveStateError.PoolNotFound,
        `Failed to fetch fee for pool ${poolId.toString()}: ${error instanceof Error ? error.message : String(error)}`,
        {poolId, error}
      );
    }
  }

  /**
   * Get AMM metadata for v2 contract
   */
  async ammMetadata(): Promise<AmmMetadataV2> {
    try {
      // Get basic contract information
      const [hookResult, totalAssetsResult, ownerResult, feeRecipientResult] =
        await Promise.all([
          this.ammContract.functions.get_hook().get(),
          this.ammContract.functions.total_assets().get(),
          this.ammContract.functions.owner().get(),
          this.ammContract.functions.get_fee_recipient().get(),
        ]);

      const hook = hookResult.value?.bits || null;
      const totalAssets = totalAssetsResult.value;

      // Handle owner (could be Address or ContractId)
      const ownershipState = ownerResult.value;
      const ownerIdentity = ownershipState?.Initialized;
      const owner =
        ownerIdentity?.Address?.bits ?? ownerIdentity?.ContractId?.bits ?? null;

      const feeRecipient =
        feeRecipientResult.value?.Address?.bits ||
        feeRecipientResult.value?.ContractId?.bits ||
        "";

      return {
        id: this.id(),
        hook,
        totalAssets,
        owner,
        feeRecipient,
        protocolFees: 0, // v2 doesn't have global protocol fees, they're per-pool
      };
    } catch (error) {
      throw new MiraV2Error(
        PoolCurveStateError.InvalidParameters,
        `Failed to fetch AMM metadata: ${error instanceof Error ? error.message : String(error)}`,
        {error}
      );
    }
  }

  /**
   * Get LP asset information for v2
   */
  async lpAssetInfo(assetId: AssetId): Promise<LpAssetInfo | null> {
    try {
      const [nameResult, symbolResult, decimalsResult, totalSupplyResult] =
        await Promise.all([
          this.ammContract.functions.name(assetInput(assetId)).get(),
          this.ammContract.functions.symbol(assetInput(assetId)).get(),
          this.ammContract.functions.decimals(assetInput(assetId)).get(),
          this.ammContract.functions.total_supply(assetInput(assetId)).get(),
        ]);

      if (
        nameResult.value &&
        symbolResult.value &&
        decimalsResult.value &&
        totalSupplyResult.value
      ) {
        return {
          assetId: assetId,
          name: nameResult.value,
          symbol: symbolResult.value,
          decimals: decimalsResult.value,
          totalSupply: totalSupplyResult.value,
        };
      } else {
        return null;
      }
    } catch (error) {
      // LP asset might not exist, return null instead of throwing
      return null;
    }
  }

  /**
   * Preview swap exact input for v2 pools with binned liquidity
   */
  async previewSwapExactInput(
    assetIdIn: AssetId,
    assetAmountIn: BigNumberish,
    pools: PoolIdV2[],
    options: CacheOptions = {}
  ): Promise<Asset> {
    // Preload route data if enabled
    await this.preloadRoute(pools, options);

    const amountsOut = await this.getAmountsOut(
      assetIdIn,
      assetAmountIn,
      pools,
      options
    );
    return amountsOut[amountsOut.length - 1];
  }

  /**
   * Preview swap exact output for v2 pools with binned liquidity
   */
  async previewSwapExactOutput(
    assetIdOut: AssetId,
    assetAmountOut: BigNumberish,
    pools: PoolIdV2[],
    options: CacheOptions = {}
  ): Promise<Asset> {
    // Preload route data if enabled
    await this.preloadRoute(pools, options);

    const amountsIn = await this.getAmountsIn(
      assetIdOut,
      assetAmountOut,
      pools,
      options
    );
    return amountsIn[amountsIn.length - 1];
  }

  /**
   * Get amounts out for multi-hop trades through v2 pools
   */
  async getAmountsOut(
    assetIdIn: AssetId,
    assetAmountIn: BigNumberish,
    pools: PoolIdV2[],
    options: CacheOptions = {}
  ): Promise<Asset[]> {
    const amount = new BN(assetAmountIn);
    if (amount.lt(0) || amount.eq(0)) {
      throw new MiraV2Error(
        PoolCurveStateError.InsufficientAmountIn,
        "Non positive input amount"
      );
    }

    if (pools.length === 0) {
      throw new MiraV2Error(
        PoolCurveStateError.InvalidParameters,
        "At least one pool must be provided for routing"
      );
    }

    try {
      // For v2, simulate swap calculation through binned liquidity in each pool
      // Unlike v1's simple constant product formula, v2 swaps traverse multiple bins
      // Each bin has its own reserves and price, providing more accurate price discovery
      const amounts: Asset[] = [[assetIdIn, amount]];

      // Get pool metadata to determine asset order and bin structure for each hop
      const poolMetadataList = await this.poolMetadataBatch(pools, options);

      let currentAsset = assetIdIn;
      let currentAmount = amount;

      for (let i = 0; i < pools.length; i++) {
        const poolMetadata = poolMetadataList[i];
        if (!poolMetadata) {
          throw new MiraV2Error(
            PoolCurveStateError.PoolNotFound,
            `Pool ${pools[i].toString()} not found`
          );
        }

        // Determine output asset for this hop based on input asset
        const outputAsset =
          poolMetadata.pool.assetX.bits === currentAsset.bits
            ? poolMetadata.pool.assetY
            : poolMetadata.pool.assetX;

        // Determine swap direction: swapForY = true means X->Y, false means Y->X
        // This affects which bins the swap will traverse (higher bins for X->Y, lower for Y->X)
        const swapForY = poolMetadata.pool.assetX.bits === currentAsset.bits;

        try {
          // Use get_swap_in to calculate output amount using bin-based liquidity
          // This method simulates traversing bins from the active bin outward,
          // consuming liquidity until the input amount is fully processed
          const swapResult = await this.ammContract.functions
            .get_swap_in(poolIdV2Input(pools[i]), currentAmount, swapForY)
            .get();

          if (swapResult.value) {
            // get_swap_in returns [amountIn, amountOut, fee] tuple
            // amountOut accounts for bin-to-bin price impact and fees
            const outputAmount = swapResult.value[1];
            amounts.push([outputAsset, outputAmount]);
            currentAsset = outputAsset;
            currentAmount = outputAmount;
          } else {
            throw new MiraV2Error(
              PoolCurveStateError.SwapNotPossible,
              `No liquidity available for swap in pool ${pools[i].toString()}`
            );
          }
        } catch (error) {
          throw new MiraV2Error(
            PoolCurveStateError.SwapNotPossible,
            `Swap calculation failed for pool ${pools[i].toString()}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      return amounts;
    } catch (error) {
      if (error instanceof MiraV2Error) {
        throw error;
      }
      throw new MiraV2Error(
        PoolCurveStateError.SwapNotPossible,
        `Failed to calculate amounts out: ${error instanceof Error ? error.message : String(error)}`,
        {assetIdIn, assetAmountIn, pools, error}
      );
    }
  }

  /**
   * Get amounts in for multi-hop trades through v2 pools
   */
  async getAmountsIn(
    assetIdOut: AssetId,
    assetAmountOut: BigNumberish,
    pools: PoolIdV2[],
    options: CacheOptions = {}
  ): Promise<Asset[]> {
    const amount = new BN(assetAmountOut);
    if (amount.lt(0) || amount.eq(0)) {
      throw new MiraV2Error(
        PoolCurveStateError.InsufficientAmountOut,
        "Non positive output amount"
      );
    }

    if (pools.length === 0) {
      throw new MiraV2Error(
        PoolCurveStateError.InvalidParameters,
        "At least one pool must be provided for routing"
      );
    }

    try {
      // For amounts in, we work backwards through the pools
      const amounts: Asset[] = [];

      // Get pool metadata to determine asset order for each hop
      const poolMetadataList = await this.poolMetadataBatch(pools, options);

      let currentAsset = assetIdOut;
      let currentAmount = amount;
      amounts.unshift([currentAsset, currentAmount]);

      // Process pools in reverse order for amounts in calculation
      for (let i = pools.length - 1; i >= 0; i--) {
        const poolMetadata = poolMetadataList[i];
        if (!poolMetadata) {
          throw new MiraV2Error(
            PoolCurveStateError.PoolNotFound,
            `Pool ${pools[i].toString()} not found`
          );
        }

        // Determine input asset for this hop
        const inputAsset =
          poolMetadata.pool.assetX.bits === currentAsset.bits
            ? poolMetadata.pool.assetY
            : poolMetadata.pool.assetX;

        // For amounts in, we need to calculate backwards
        // This is a simplified implementation - would need proper reverse calculation
        const swapForY = poolMetadata.pool.assetY.bits === currentAsset.bits;

        try {
          // Simplified calculation - in practice would need reverse swap calculation
          const reserves = poolMetadata.reserves;
          const inputReserve = swapForY ? reserves.x : reserves.y;
          const outputReserve = swapForY ? reserves.y : reserves.x;

          if (inputReserve.eq(0) || outputReserve.eq(0)) {
            throw new MiraV2Error(
              PoolCurveStateError.OutOfLiquidity,
              `Pool ${pools[i].toString()} has no liquidity`
            );
          }

          // Simple constant product calculation (simplified)
          const inputAmount = currentAmount
            .mul(inputReserve)
            .div(outputReserve)
            .add(new BN(1));

          amounts.unshift([inputAsset, inputAmount]);
          currentAsset = inputAsset;
          currentAmount = inputAmount;
        } catch (error) {
          throw new MiraV2Error(
            PoolCurveStateError.SwapNotPossible,
            `Reverse swap calculation failed for pool ${pools[i].toString()}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      return amounts;
    } catch (error) {
      if (error instanceof MiraV2Error) {
        throw error;
      }
      throw new MiraV2Error(
        PoolCurveStateError.SwapNotPossible,
        `Failed to calculate amounts in: ${error instanceof Error ? error.message : String(error)}`,
        {assetIdOut, assetAmountOut, pools, error}
      );
    }
  }

  /**
   * Preview swap exact input for multiple routes in batch
   */
  async previewSwapExactInputBatch(
    assetIdIn: AssetId,
    assetAmountIn: BigNumberish,
    routes: PoolIdV2[][],
    options: CacheOptions = {}
  ): Promise<(Asset | undefined)[]> {
    const effectiveOptions = {...DEFAULT_CACHE_OPTIONS, ...options};

    const results = await Promise.allSettled(
      routes.map((route) =>
        this.getAmountsOut(assetIdIn, assetAmountIn, route, effectiveOptions)
      )
    );

    return results.map((r) =>
      r.status === "fulfilled" ? r.value[r.value.length - 1] : undefined
    );
  }

  /**
   * Preview swap exact output for multiple routes in batch
   */
  async previewSwapExactOutputBatch(
    assetIdOut: AssetId,
    assetAmountOut: BigNumberish,
    routes: PoolIdV2[][],
    options: CacheOptions = {}
  ): Promise<(Asset | undefined)[]> {
    const effectiveOptions = {...DEFAULT_CACHE_OPTIONS, ...options};

    const results = await Promise.allSettled(
      routes.map((route) =>
        this.getAmountsIn(assetIdOut, assetAmountOut, route, effectiveOptions)
      )
    );

    return results.map((r) =>
      r.status === "fulfilled" ? r.value[r.value.length - 1] : undefined
    );
  }

  /**
   * Get liquidity reserves for a specific bin in a v2 pool
   *
   * Bins are discrete price points where liquidity can be concentrated.
   * Each bin contains reserves of both tokens, with the distribution
   * depending on the bin's position relative to the current price.
   *
   * @param poolId - The v2 pool identifier
   * @param binId - The specific bin identifier to query
   * @returns Token amounts in the bin, or null if bin is empty/doesn't exist
   *
   * @example
   * ```typescript
   * const poolId = new BN("12345");
   * const binId = 8388608; // Active bin
   *
   * const liquidity = await readonlyAmm.getBinLiquidity(poolId, binId);
   * if (liquidity) {
   *   console.log(`Bin ${binId} contains:`);
   *   console.log(`  Token X: ${liquidity.x}`);
   *   console.log(`  Token Y: ${liquidity.y}`);
   * } else {
   *   console.log(`Bin ${binId} is empty`);
   * }
   * ```
   */
  async getBinLiquidity(
    poolId: PoolIdV2,
    binId: BigNumberish
  ): Promise<Amounts | null> {
    const context = createErrorContext("getBinLiquidity", {poolId, binId});
    validatePoolId(poolId, context);
    validateBinId(binId, context);

    return withErrorHandling(async () => {
      const binIdNum = Number(binId);

      // Check cache first for bin-specific data
      // Each bin maintains its own liquidity reserves independently
      const cached = this.poolCache.getBinData(poolId, binIdNum);
      if (cached && !this.poolCache.isStale(poolId, binIdNum)) {
        return cached.liquidity.liquidity;
      }

      try {
        // Query specific bin liquidity from contract
        // Bins contain discrete liquidity positions at specific price points
        const result = await this.ammContract.functions
          .get_bin(poolIdV2Input(poolId), binId)
          .get();

        if (!result.value) {
          return null;
        }

        const amounts = {
          x: result.value.x,
          y: result.value.y,
        };

        // Cache the bin data
        const binLiquidityInfo: BinLiquidityInfo = {
          binId: binIdNum,
          liquidity: amounts,
          price: new BN(0), // Price will be calculated separately if needed
        };

        this.poolCache.setBinData(poolId, binIdNum, binLiquidityInfo);

        return amounts;
      } catch (error) {
        // Bin might not exist, return null instead of throwing
        return null;
      }
    }, context);
  }

  /**
   * Get the currently active bin ID for a v2 pool
   *
   * The active bin represents the current price of the pool. It's the bin
   * where the next swap will occur and typically contains the most balanced
   * liquidity between both tokens. Bin IDs increase with price.
   *
   * @param poolId - The v2 pool identifier
   * @returns Active bin ID, or null if pool is not initialized
   *
   * @example
   * ```typescript
   * const poolId = new BN("12345");
   * const activeBin = await readonlyAmm.getActiveBin(poolId);
   *
   * if (activeBin !== null) {
   *   console.log(`Current price is at bin ${activeBin}`);
   *
   *   // Get price for this bin
   *   const price = await readonlyAmm.getPriceFromId(poolId, activeBin);
   *   console.log(`Current price: ${price}`);
   * }
   * ```
   */
  async getActiveBin(poolId: PoolIdV2): Promise<number | null> {
    const context = createErrorContext("getActiveBin", {poolId});
    validatePoolId(poolId, context);

    return withErrorHandling(async () => {
      const result = await this.ammContract.functions
        .get_pool_active_bin_id(poolIdV2Input(poolId))
        .get();

      return result.value ?? null;
    }, context);
  }

  /**
   * Get liquidity information for a range of consecutive bins
   *
   * Efficiently queries multiple bins in a single batch operation.
   * Useful for analyzing liquidity distribution around the current price
   * or for building liquidity charts and depth visualizations.
   *
   * @param poolId - The v2 pool identifier
   * @param startBinId - First bin ID in the range (inclusive)
   * @param endBinId - Last bin ID in the range (inclusive)
   * @returns Array of bin liquidity information (empty bins are included with zero liquidity)
   *
   * @example
   * ```typescript
   * const poolId = new BN("12345");
   * const activeBin = await readonlyAmm.getActiveBin(poolId);
   *
   * // Get liquidity in ±10 bins around active price
   * const range = await readonlyAmm.getBinRange(
   *   poolId,
   *   activeBin - 10,
   *   activeBin + 10
   * );
   *
   * range.forEach(bin => {
   *   const totalLiquidity = bin.liquidity.x.add(bin.liquidity.y);
   *   if (totalLiquidity.gt(0)) {
   *     console.log(`Bin ${bin.binId}: ${totalLiquidity} total liquidity at price ${bin.price}`);
   *   }
   * });
   * ```
   */
  async getBinRange(
    poolId: PoolIdV2,
    startBinId: BigNumberish,
    endBinId: BigNumberish
  ): Promise<BinLiquidityInfo[]> {
    const startId = Number(startBinId);
    const endId = Number(endBinId);

    if (startId > endId) {
      throw new MiraV2Error(
        PoolCurveStateError.InvalidParameters,
        "Start bin ID must be less than or equal to end bin ID"
      );
    }

    const binInfos: BinLiquidityInfo[] = [];
    const binIds: number[] = [];

    // Generate array of bin IDs to query
    for (let binId = startId; binId <= endId; binId++) {
      binIds.push(binId);
    }

    try {
      // Batch query bin liquidity data
      const binTransactions = binIds.map((binId) =>
        this.ammContract.functions.get_bin(poolIdV2Input(poolId), binId)
      );

      const {value: binResults} = await this.ammContract
        .multiCall(binTransactions)
        .get();

      // Get pool metadata to determine bin step for price calculation
      const poolMetadata = await this.poolMetadata(poolId);
      if (!poolMetadata) {
        throw new MiraV2Error(
          PoolCurveStateError.PoolNotFound,
          `Pool ${poolId.toString()} not found`
        );
      }

      for (let i = 0; i < binIds.length; i++) {
        const binId = binIds[i];
        const binResult = binResults[i];

        if (binResult) {
          // Calculate price for this bin ID
          const price = this.calculateBinPrice(
            binId,
            poolMetadata.pool.binStep
          );

          binInfos.push({
            binId,
            liquidity: {
              x: binResult.x,
              y: binResult.y,
            },
            price,
          });
        }
      }

      return binInfos;
    } catch (error) {
      throw new MiraV2Error(
        PoolCurveStateError.InvalidParameters,
        `Failed to get bin range: ${error instanceof Error ? error.message : String(error)}`,
        {poolId, startBinId, endBinId, error}
      );
    }
  }

  /**
   * Get comprehensive liquidity distribution analysis for a v2 pool
   *
   * Provides a complete overview of how liquidity is distributed across
   * the pool's price range. Analyzes bins around the active price to
   * give insights into capital efficiency and price impact.
   *
   * @param poolId - The v2 pool identifier
   * @returns Complete liquidity distribution including totals and per-bin breakdown
   *
   * @example
   * ```typescript
   * const poolId = new BN("12345");
   * const distribution = await readonlyAmm.getLiquidityDistribution(poolId);
   *
   * console.log(`Pool Liquidity Analysis:`);
   * console.log(`  Total X: ${distribution.totalLiquidity.x}`);
   * console.log(`  Total Y: ${distribution.totalLiquidity.y}`);
   * console.log(`  Active bin: ${distribution.activeBinId}`);
   * console.log(`  Bins with liquidity: ${distribution.bins.filter(b => b.liquidity.x.gt(0) || b.liquidity.y.gt(0)).length}`);
   *
   * // Find bins with highest liquidity
   * const sortedBins = distribution.bins
   *   .filter(b => b.liquidity.x.gt(0) || b.liquidity.y.gt(0))
   *   .sort((a, b) => b.liquidity.x.add(b.liquidity.y).sub(a.liquidity.x.add(a.liquidity.y)).toNumber());
   *
   * console.log(`Top liquidity bins:`);
   * sortedBins.slice(0, 5).forEach(bin => {
   *   console.log(`  Bin ${bin.binId}: ${bin.liquidity.x} X, ${bin.liquidity.y} Y`);
   * });
   * ```
   */
  async getLiquidityDistribution(
    poolId: PoolIdV2
  ): Promise<LiquidityDistribution> {
    try {
      // Get pool metadata and active bin
      const [poolMetadata, activeBinId] = await Promise.all([
        this.poolMetadata(poolId),
        this.getActiveBin(poolId),
      ]);

      if (!poolMetadata) {
        throw new MiraV2Error(
          PoolCurveStateError.PoolNotFound,
          `Pool ${poolId.toString()} not found`
        );
      }

      if (activeBinId === null) {
        throw new MiraV2Error(
          PoolCurveStateError.NotInitialized,
          `Pool ${poolId.toString()} has no active bin`
        );
      }

      // Query a range around the active bin (e.g., ±50 bins)
      const rangeSize = 50;
      const startBinId = activeBinId - rangeSize;
      const endBinId = activeBinId + rangeSize;

      const bins = await this.getBinRange(poolId, startBinId, endBinId);

      // Calculate total liquidity
      const totalLiquidity = bins.reduce(
        (total, bin) => ({
          x: total.x.add(bin.liquidity.x),
          y: total.y.add(bin.liquidity.y),
        }),
        {x: new BN(0), y: new BN(0)}
      );

      return {
        totalLiquidity,
        activeBinId,
        bins,
      };
    } catch (error) {
      if (error instanceof MiraV2Error) {
        throw error;
      }
      throw new MiraV2Error(
        PoolCurveStateError.InvalidParameters,
        `Failed to get liquidity distribution: ${error instanceof Error ? error.message : String(error)}`,
        {poolId, error}
      );
    }
  }

  /**
   * Get reserves for a specific bin (alias for getBinLiquidity)
   */
  async getBinReserves(
    poolId: PoolIdV2,
    binId: BigNumberish
  ): Promise<Amounts | null> {
    return this.getBinLiquidity(poolId, binId);
  }

  /**
   * Get user's bin positions for a specific pool
   */
  async getUserBinPositions(
    poolId: PoolIdV2,
    userAddress: Address
  ): Promise<UserBinPosition[]> {
    try {
      // This would typically require querying user's LP token balances
      // For now, we'll implement a basic version that checks common bin ranges
      const activeBinId = await this.getActiveBin(poolId);
      if (activeBinId === null) {
        return [];
      }

      const positions: UserBinPosition[] = [];

      // Check a range around the active bin for user positions
      const rangeSize = 20;
      const startBinId = activeBinId - rangeSize;
      const endBinId = activeBinId + rangeSize;

      for (let binId = startBinId; binId <= endBinId; binId++) {
        try {
          // Generate LP asset ID for this bin
          const lpAssetId = this.generateLPAssetIdForBin(poolId, binId);

          // Query user's balance of this LP token
          const balance = await this.provider.getBalance(
            userAddress,
            lpAssetId.bits
          );

          if (balance.gt(0)) {
            // Get underlying amounts for this position
            const binLiquidity = await this.getBinLiquidity(poolId, binId);

            if (binLiquidity) {
              // Calculate user's share of the bin
              // This is a simplified calculation - in practice you'd need total supply
              const totalSupply = await this.ammContract.functions
                .total_supply(assetInput(lpAssetId))
                .get();

              if (totalSupply.value && totalSupply.value.gt(0)) {
                const userShare = balance
                  .mul(new BN(BASE_FACTOR_RANGES.DEFAULT))
                  .div(totalSupply.value);
                const underlyingAmounts = {
                  x: binLiquidity.x
                    .mul(userShare)
                    .div(new BN(BASE_FACTOR_RANGES.DEFAULT)),
                  y: binLiquidity.y
                    .mul(userShare)
                    .div(new BN(BASE_FACTOR_RANGES.DEFAULT)),
                };

                positions.push({
                  binId,
                  lpTokenAmount: balance,
                  underlyingAmounts,
                });
              }
            }
          }
        } catch (error) {
          // Skip bins where user has no position
          continue;
        }
      }

      return positions;
    } catch (error) {
      throw new MiraV2Error(
        PoolCurveStateError.InvalidParameters,
        `Failed to get user bin positions: ${error instanceof Error ? error.message : String(error)}`,
        {poolId, userAddress, error}
      );
    }
  }

  /**
   * Get total pool reserves (sum of all bins)
   */
  async getPoolReserves(poolId: PoolIdV2): Promise<Amounts> {
    const poolMetadata = await this.poolMetadata(poolId);
    if (!poolMetadata) {
      throw new MiraV2Error(
        PoolCurveStateError.PoolNotFound,
        `Pool ${poolId.toString()} not found`
      );
    }

    return poolMetadata.reserves;
  }

  /**
   * Get the next non-empty bin in a given direction
   */
  async getNextNonEmptyBin(
    poolId: PoolIdV2,
    swapForY: boolean,
    binId: BigNumberish
  ): Promise<number | null> {
    try {
      const result = await this.ammContract.functions
        .get_next_non_empty_bin(poolIdV2Input(poolId), swapForY, binId)
        .get();

      return result.value ?? null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get price for a specific bin ID
   */
  async getPriceFromId(poolId: PoolIdV2, binId: BigNumberish): Promise<BN> {
    try {
      const result = await this.ammContract.functions
        .get_price_from_id(poolIdV2Input(poolId), binId)
        .get();

      return result.value;
    } catch (error) {
      // Fallback to calculated price if contract method fails
      const poolMetadata = await this.poolMetadata(poolId);
      if (!poolMetadata) {
        throw new MiraV2Error(
          PoolCurveStateError.PoolNotFound,
          `Pool ${poolId.toString()} not found`
        );
      }

      return this.calculateBinPrice(Number(binId), poolMetadata.pool.binStep);
    }
  }

  /**
   * Get the required amount of the other token for proportional liquidity addition
   * Updated for v2 to work with bin-based liquidity while maintaining API compatibility
   */
  async getOtherTokenToAddLiquidity(
    poolId: PoolIdV2,
    amount: BigNumberish,
    isFirstToken: boolean,
    options: CacheOptions = {}
  ): Promise<Asset> {
    const context = createErrorContext("getOtherTokenToAddLiquidity", {
      poolId,
      amount,
      isFirstToken,
    });
    validatePoolId(poolId, context);

    return withErrorHandling(async () => {
      const poolMetadata = await this.poolMetadata(poolId, options);
      if (!poolMetadata) {
        throw new MiraV2Error(
          PoolCurveStateError.PoolNotFound,
          `Pool ${poolId.toString()} not found`
        );
      }

      const amountBN = new BN(amount);
      if (amountBN.lte(0)) {
        throw new MiraV2Error(
          PoolCurveStateError.InsufficientAmountIn,
          "Amount must be positive"
        );
      }

      // Get active bin to understand current price ratio
      const activeBinId = await this.getActiveBin(poolId);
      if (activeBinId === null) {
        throw new MiraV2Error(
          PoolCurveStateError.NotInitialized,
          "Pool has no active bin"
        );
      }

      // For v2, we calculate based on the active bin's liquidity ratio
      // This provides a more accurate representation of the current price
      const activeBinLiquidity = await this.getBinLiquidity(
        poolId,
        activeBinId
      );

      // If active bin has no liquidity, fall back to total reserves
      let xReserve: BN, yReserve: BN;

      if (
        activeBinLiquidity &&
        (!activeBinLiquidity.x.eq(0) || !activeBinLiquidity.y.eq(0))
      ) {
        // Use active bin liquidity for more accurate price
        xReserve = activeBinLiquidity.x;
        yReserve = activeBinLiquidity.y;
      } else {
        // Fall back to total pool reserves
        const reserves = poolMetadata.reserves;
        xReserve = reserves.x;
        yReserve = reserves.y;
      }

      // Handle edge cases where one reserve is zero
      if (xReserve.eq(0) && yReserve.eq(0)) {
        throw new MiraV2Error(
          PoolCurveStateError.OutOfLiquidity,
          "Pool has no liquidity. Any amount can be added for the other token"
        );
      }

      if (xReserve.eq(0)) {
        // Only Y liquidity exists, X can be any amount
        if (isFirstToken) {
          // Adding X, Y should be proportional to existing Y
          return [poolMetadata.pool.assetY, amountBN];
        } else {
          // Adding Y, X can be any amount
          return [poolMetadata.pool.assetX, amountBN];
        }
      }

      if (yReserve.eq(0)) {
        // Only X liquidity exists, Y can be any amount
        if (isFirstToken) {
          // Adding X, Y can be any amount
          return [poolMetadata.pool.assetY, amountBN];
        } else {
          // Adding Y, X should be proportional to existing X
          return [poolMetadata.pool.assetX, amountBN];
        }
      }

      // Calculate proportional amount based on current liquidity ratio
      if (isFirstToken) {
        // First token is X, calculate required Y
        const otherTokenAmount = amountBN.mul(yReserve).div(xReserve);

        // Add small buffer for rounding and slippage
        const bufferedAmount = otherTokenAmount
          .add(
            otherTokenAmount.div(new BN(BASE_FACTOR_RANGES.DEFAULT)) // 0.01% buffer
          )
          .add(new BN(1)); // Minimum 1 unit buffer

        return [poolMetadata.pool.assetY, bufferedAmount];
      } else {
        // First token is Y, calculate required X
        const otherTokenAmount = amountBN.mul(xReserve).div(yReserve);

        // Add small buffer for rounding and slippage
        const bufferedAmount = otherTokenAmount
          .add(
            otherTokenAmount.div(new BN(BASE_FACTOR_RANGES.DEFAULT)) // 0.01% buffer
          )
          .add(new BN(1)); // Minimum 1 unit buffer

        return [poolMetadata.pool.assetX, bufferedAmount];
      }
    }, context);
  }

  /**
   * Get comprehensive liquidity position information across multiple bins for v2
   * Returns detailed information about how a position is distributed across bins
   */
  async getLiquidityPositionDetailed(
    poolId: PoolIdV2,
    userAddress: Address,
    options: CacheOptions = {}
  ): Promise<{
    totalPosition: [Asset, Asset];
    binPositions: UserBinPosition[];
    activeBinId: number | null;
    positionValue: BN;
  }> {
    const context = createErrorContext("getLiquidityPositionDetailed", {
      poolId,
      userAddress,
    });
    validatePoolId(poolId, context);

    return withErrorHandling(async () => {
      const poolMetadata = await this.poolMetadata(poolId, options);
      if (!poolMetadata) {
        throw new MiraV2Error(
          PoolCurveStateError.PoolNotFound,
          `Pool ${poolId.toString()} not found`
        );
      }

      // Get user's bin positions
      const binPositions = await this.getUserBinPositions(poolId, userAddress);
      const activeBinId = await this.getActiveBin(poolId);

      // Calculate total position across all bins
      let totalX = new BN(0);
      let totalY = new BN(0);
      let totalValue = new BN(0);

      for (const position of binPositions) {
        totalX = totalX.add(position.underlyingAmounts.x);
        totalY = totalY.add(position.underlyingAmounts.y);

        // Calculate value using current bin price
        const binPrice = await this.getPriceFromId(poolId, position.binId);
        const binValue = position.underlyingAmounts.x.add(
          position.underlyingAmounts.y.mul(binPrice).div(new BN(10000))
        );
        totalValue = totalValue.add(binValue);
      }

      return {
        totalPosition: [
          [poolMetadata.pool.assetX, totalX],
          [poolMetadata.pool.assetY, totalY],
        ],
        binPositions,
        activeBinId,
        positionValue: totalValue,
      };
    }, context);
  }

  /**
   * Get liquidity position value across bins for v2
   * Updated to handle bin-distributed positions and return comprehensive position information
   */
  async getLiquidityPosition(
    poolId: PoolIdV2,
    lpTokensAmount: BigNumberish,
    options: CacheOptions = {}
  ): Promise<[Asset, Asset]> {
    const context = createErrorContext("getLiquidityPosition", {
      poolId,
      lpTokensAmount,
    });
    validatePoolId(poolId, context);

    return withErrorHandling(async () => {
      const lpTokensBN = new BN(lpTokensAmount);
      if (lpTokensBN.lte(0)) {
        throw new MiraV2Error(
          PoolCurveStateError.InvalidLPTokenBalance,
          "LP token amount must be positive"
        );
      }

      const poolMetadata = await this.poolMetadata(poolId, options);
      if (!poolMetadata) {
        throw new MiraV2Error(
          PoolCurveStateError.PoolNotFound,
          `Pool ${poolId.toString()} not found`
        );
      }

      // For v2, we need to handle the fact that LP tokens are distributed across bins
      // This implementation provides a more accurate calculation based on bin distribution

      try {
        // Get the liquidity distribution to understand how liquidity is spread across bins
        const liquidityDistribution =
          await this.getLiquidityDistribution(poolId);

        if (liquidityDistribution.bins.length === 0) {
          throw new MiraV2Error(
            PoolCurveStateError.OutOfLiquidity,
            "Pool has no liquidity in any bins"
          );
        }

        // Calculate total liquidity across all bins
        const totalBinLiquidity = liquidityDistribution.bins.reduce(
          (total, bin) => ({
            x: total.x.add(bin.liquidity.x),
            y: total.y.add(bin.liquidity.y),
          }),
          {x: new BN(0), y: new BN(0)}
        );

        if (totalBinLiquidity.x.eq(0) && totalBinLiquidity.y.eq(0)) {
          throw new MiraV2Error(
            PoolCurveStateError.OutOfLiquidity,
            "Pool has no liquidity"
          );
        }

        // For v2, we need to estimate the user's share across bins
        // This is a simplified approach that assumes the LP tokens represent
        // a proportional share of the total pool liquidity

        // Calculate the total value of liquidity in the pool
        // We'll use a weighted approach based on bin liquidity
        let totalWeightedLiquidity = new BN(0);
        let userWeightedX = new BN(0);
        let userWeightedY = new BN(0);

        for (const bin of liquidityDistribution.bins) {
          // Calculate the value of liquidity in this bin
          const binValue = bin.liquidity.x.add(bin.liquidity.y);

          if (binValue.gt(0)) {
            totalWeightedLiquidity = totalWeightedLiquidity.add(binValue);

            // Calculate user's proportional share of this bin
            const userShareOfBin = lpTokensBN
              .mul(binValue)
              .div(totalWeightedLiquidity.add(binValue));

            // Add to user's total position
            userWeightedX = userWeightedX.add(
              bin.liquidity.x.mul(userShareOfBin).div(binValue)
            );
            userWeightedY = userWeightedY.add(
              bin.liquidity.y.mul(userShareOfBin).div(binValue)
            );
          }
        }

        // If the weighted calculation doesn't work, fall back to simple proportional
        if (userWeightedX.eq(0) && userWeightedY.eq(0)) {
          // Simple proportional calculation based on total reserves
          const totalReserves = poolMetadata.reserves;
          const totalValue = totalReserves.x.add(totalReserves.y);

          if (totalValue.eq(0)) {
            throw new MiraV2Error(
              PoolCurveStateError.OutOfLiquidity,
              "Pool has no liquidity"
            );
          }

          // Assume LP tokens represent a proportional share
          // This is a simplified assumption for v2
          const sharePercentage = lpTokensBN.mul(new BN(10000)).div(totalValue);

          userWeightedX = totalReserves.x
            .mul(sharePercentage)
            .div(new BN(10000));
          userWeightedY = totalReserves.y
            .mul(sharePercentage)
            .div(new BN(10000));
        }

        return [
          [poolMetadata.pool.assetX, userWeightedX],
          [poolMetadata.pool.assetY, userWeightedY],
        ];
      } catch (error) {
        if (error instanceof MiraV2Error) {
          throw error;
        }
        throw new MiraV2Error(
          PoolCurveStateError.InvalidLPTokenBalance,
          `Failed to calculate liquidity position: ${error instanceof Error ? error.message : String(error)}`,
          {poolId, lpTokensAmount, error}
        );
      }
    }, context);
  }

  /**
   * Calculate optimal liquidity distribution across bins for v2
   * Helps users understand how to distribute liquidity for maximum efficiency
   */
  async calculateOptimalLiquidityDistribution(
    poolId: PoolIdV2,
    amountX: BigNumberish,
    amountY: BigNumberish,
    priceRange: {minPrice: BN; maxPrice: BN},
    options: CacheOptions = {}
  ): Promise<{
    distributions: Array<{
      binId: number;
      price: BN;
      amountX: BN;
      amountY: BN;
      percentage: number;
    }>;
    totalBins: number;
    activeBinId: number | null;
  }> {
    const context = createErrorContext(
      "calculateOptimalLiquidityDistribution",
      {
        poolId,
        amountX,
        amountY,
        priceRange,
      }
    );
    validatePoolId(poolId, context);

    return withErrorHandling(async () => {
      const poolMetadata = await this.poolMetadata(poolId, options);
      if (!poolMetadata) {
        throw new MiraV2Error(
          PoolCurveStateError.PoolNotFound,
          `Pool ${poolId.toString()} not found`
        );
      }

      const amountXBN = new BN(amountX);
      const amountYBN = new BN(amountY);
      const activeBinId = await this.getActiveBin(poolId);

      if (activeBinId === null) {
        throw new MiraV2Error(
          PoolCurveStateError.NotInitialized,
          "Pool has no active bin"
        );
      }

      // Calculate bin IDs for the price range
      const minBinId = await this.getBinIdFromPrice(
        poolId,
        priceRange.minPrice
      );
      const maxBinId = await this.getBinIdFromPrice(
        poolId,
        priceRange.maxPrice
      );

      const distributions: Array<{
        binId: number;
        price: BN;
        amountX: BN;
        amountY: BN;
        percentage: number;
      }> = [];

      const totalBins = maxBinId - minBinId + 1;

      // Distribute liquidity across bins with higher concentration around active bin
      for (let binId = minBinId; binId <= maxBinId; binId++) {
        const price = await this.getPriceFromId(poolId, binId);

        // Calculate distance from active bin (for concentration weighting)
        const distanceFromActive = Math.abs(binId - activeBinId);
        const weight = Math.exp(-distanceFromActive * 0.1); // Exponential decay

        // Calculate percentage allocation based on weight
        const percentage = (weight / totalBins) * 100;

        // Distribute amounts based on bin position relative to current price
        let binAmountX = new BN(0);
        let binAmountY = new BN(0);

        if (binId < activeBinId) {
          // Below current price - more Y token
          binAmountY = amountYBN
            .mul(new BN(Math.floor(percentage * 100)))
            .div(new BN(10000));
        } else if (binId > activeBinId) {
          // Above current price - more X token
          binAmountX = amountXBN
            .mul(new BN(Math.floor(percentage * 100)))
            .div(new BN(10000));
        } else {
          // At current price - balanced
          binAmountX = amountXBN
            .mul(new BN(Math.floor(percentage * 50)))
            .div(new BN(10000));
          binAmountY = amountYBN
            .mul(new BN(Math.floor(percentage * 50)))
            .div(new BN(10000));
        }

        distributions.push({
          binId,
          price,
          amountX: binAmountX,
          amountY: binAmountY,
          percentage: percentage,
        });
      }

      return {
        distributions,
        totalBins,
        activeBinId,
      };
    }, context);
  }

  /**
   * Helper method to get bin ID from price
   */
  private async getBinIdFromPrice(
    poolId: PoolIdV2,
    price: BN
  ): Promise<number> {
    try {
      const result = await this.ammContract.functions
        .get_id_from_price(poolIdV2Input(poolId), price)
        .get();

      return result.value;
    } catch (error) {
      // Fallback calculation if contract method fails
      const poolMetadata = await this.poolMetadata(poolId);
      if (!poolMetadata) {
        throw new MiraV2Error(
          PoolCurveStateError.PoolNotFound,
          `Pool ${poolId.toString()} not found`
        );
      }

      // Simplified calculation: binId = log(price / basePrice) / log(1 + binStep/10000)
      const binStep = poolMetadata.pool.binStep;
      const basePrice = new BN(10000);

      if (price.eq(basePrice)) {
        return 0;
      }

      // Simplified logarithmic calculation
      const ratio = price.gt(basePrice)
        ? price.div(basePrice).toNumber()
        : basePrice.div(price).toNumber();

      const stepRatio = 1 + binStep / 10000;
      const binId = Math.round(Math.log(ratio) / Math.log(stepRatio));

      return price.gt(basePrice) ? binId : -binId;
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.poolMetadataCache.clear();
    this.poolFeeCache.clear();
    this.binDataCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    poolMetadataEntries: number;
    poolFeeEntries: number;
    binDataEntries: number;
  } {
    return {
      poolMetadataEntries: this.poolMetadataCache.size,
      poolFeeEntries: this.poolFeeCache.size,
      binDataEntries: this.binDataCache.size,
    };
  }

  /**
   * Get access to the pool data cache for external management
   */
  getPoolCache(): PoolDataCacheV2 {
    return this.poolCache;
  }

  /**
   * Get access to the cache manager for advanced cache strategies
   */
  getCacheManager(): CacheManagerV2 {
    return this.cacheManager;
  }

  /**
   * Preload pool metadata and bin data for a route
   */
  async preloadRoute(
    pools: PoolIdV2[],
    options: CacheOptions = {}
  ): Promise<void> {
    const effectiveOptions = {...DEFAULT_CACHE_OPTIONS, ...options};

    if (!effectiveOptions.preloadPools) {
      return;
    }

    // Generate route signature for change detection
    const routeSignature = this.generateRouteSignature(pools);

    // Check if route has changed
    if (this.lastRouteSignature !== routeSignature) {
      this.lastRouteSignature = routeSignature;

      // Preload pool metadata
      await this.poolMetadataBatch(pools, {
        ...effectiveOptions,
        useCache: true,
        refreshStaleData: true,
      });

      // Preload active bins and surrounding bins if enabled
      if (this.poolCache.getConfig().preloadActiveBins) {
        await this.preloadActiveBinsForPools(pools);
      }
    }
  }

  /**
   * Preload active bins and surrounding bins for multiple pools
   */
  private async preloadActiveBinsForPools(pools: PoolIdV2[]): Promise<void> {
    const config = this.poolCache.getConfig();

    for (const poolId of pools) {
      try {
        // Get active bin ID
        const activeBinId = await this.getActiveBin(poolId);
        if (activeBinId === null) continue;

        // Preload bins around the active bin
        const startBin = activeBinId - config.preloadRange;
        const endBin = activeBinId + config.preloadRange;

        // Batch load bins in the range
        const binPromises: Promise<void>[] = [];
        for (let binId = startBin; binId <= endBin; binId++) {
          binPromises.push(
            this.getBinLiquidity(poolId, binId)
              .then(() => {
                // Just trigger the cache, don't need the result
              })
              .catch(() => {
                // Ignore errors for non-existent bins
              })
          );
        }

        await Promise.allSettled(binPromises);
      } catch (error) {
        // Continue with other pools if one fails
        console.warn(
          `Failed to preload bins for pool ${poolId.toString()}:`,
          error
        );
      }
    }
  }

  /**
   * Generate a signature for a route to detect changes
   */
  private generateRouteSignature(pools: PoolIdV2[]): string {
    return pools.map((pool) => pool.toString()).join("-");
  }

  /**
   * Invalidate cache for specific pools (useful for route changes)
   */
  invalidatePoolsCache(pools: PoolIdV2[]): void {
    for (const poolId of pools) {
      this.poolCache.removePool(poolId);
    }
  }

  /**
   * Warm up cache by preloading frequently used pools
   */
  async warmUpCache(
    frequentPools: PoolIdV2[],
    options: CacheOptions = {}
  ): Promise<void> {
    const effectiveOptions = {...DEFAULT_CACHE_OPTIONS, ...options};

    // Preload pool metadata
    await this.poolMetadataBatch(frequentPools, {
      ...effectiveOptions,
      useCache: true,
      refreshStaleData: false, // Don't refresh during warmup
    });

    // Preload fees for all pools
    const feePromises = frequentPools.map((poolId) =>
      this.fees(poolId).catch(() => {
        // Ignore errors during warmup
      })
    );

    await Promise.allSettled(feePromises);

    // Preload active bins if enabled
    if (this.poolCache.getConfig().preloadActiveBins) {
      await this.preloadActiveBinsForPools(frequentPools);
    }
  }

  /**
   * Get cache statistics and performance metrics
   */
  getCacheMetrics(): {
    stats: any;
    hitRate: number;
    size: number;
    poolCount: number;
    binCount: number;
  } {
    const stats = this.poolCache.getStats();
    const hitRate = this.poolCache.getHitRate();
    const size = this.poolCache.size();
    const poolIds = this.poolCache.getCachedPoolIds();
    const poolCount = poolIds.length;

    // Count total bins across all pools
    let binCount = 0;
    for (const poolIdStr of poolIds) {
      const poolId = new BN(poolIdStr);
      binCount += this.poolCache.getCachedBinIds(poolId).length;
    }

    return {
      stats,
      hitRate,
      size,
      poolCount,
      binCount,
    };
  }

  /**
   * Configure cache behavior for different use cases
   */
  configureCacheForUseCase(
    useCase: "trading" | "analytics" | "liquidity"
  ): void {
    const config = this.poolCache.getConfig();

    switch (useCase) {
      case "trading":
        // Optimize for fast swaps - shorter TTLs, more aggressive preloading
        this.poolCache.updateConfig({
          ...config,
          defaultTTL: V2_CACHE_CONFIG.POOL_METADATA_TTL / 4, // 15 seconds for trading
          binDataTTL: V2_CACHE_CONFIG.BIN_DATA_TTL / 3, // 10 seconds for trading
          feeTTL: V2_CACHE_CONFIG.FEE_DATA_TTL / 10, // 30 seconds for trading
          preloadActiveBins: true,
          preloadRange: 5,
        });
        break;

      case "analytics":
        // Optimize for data analysis - longer TTLs, less preloading
        this.poolCache.updateConfig({
          ...config,
          defaultTTL: 60000, // 60 seconds
          binDataTTL: 45000, // 45 seconds
          feeTTL: 120000, // 2 minutes
          preloadActiveBins: false,
          preloadRange: 0,
        });
        break;

      case "liquidity":
        // Optimize for liquidity operations - balanced TTLs, moderate preloading
        this.poolCache.updateConfig({
          ...config,
          defaultTTL: 30000, // 30 seconds
          binDataTTL: 20000, // 20 seconds
          feeTTL: 60000, // 60 seconds
          preloadActiveBins: true,
          preloadRange: 10,
        });
        break;
    }
  }

  /**
   * Calculate price for a bin ID based on bin step
   */
  private calculateBinPrice(binId: number, binStep: number): BN {
    // Price calculation: price = (1 + binStep / 10000) ^ binId
    // This is a simplified implementation
    const binStepBN = new BN(binStep);
    const base = new BN(10000).add(binStepBN);

    // For positive bin IDs, price increases
    // For negative bin IDs, price decreases
    if (binId === 0) {
      return new BN(10000); // Base price
    }

    // Simplified exponential calculation
    let result = new BN(10000);
    const absId = Math.abs(binId);

    for (let i = 0; i < absId; i++) {
      if (binId > 0) {
        result = result.mul(base).div(new BN(10000));
      } else {
        result = result.mul(new BN(10000)).div(base);
      }
    }

    return result;
  }

  /**
   * Generate LP asset ID for a specific bin
   */
  private generateLPAssetIdForBin(poolId: PoolIdV2, binId: number): AssetId {
    // This is a simplified implementation
    // In practice, you'd need to follow the exact same logic as the contract
    const binIdBytes = new BN(binId).toBytes();
    const poolIdBytes = poolId.toBytes();
    const combined = new Uint8Array(poolIdBytes.length + binIdBytes.length);
    combined.set(poolIdBytes);
    combined.set(binIdBytes, poolIdBytes.length);

    // Generate asset ID from contract ID and combined data
    const contractId = this.ammContract.id.toB256();
    const subId = Array.from(combined)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return {bits: `0x${subId.padStart(64, "0")}`};
  }
}

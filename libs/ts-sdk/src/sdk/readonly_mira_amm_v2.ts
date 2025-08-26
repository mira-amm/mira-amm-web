import {DEFAULT_AMM_V2_CONTRACT_ID} from "./constants";
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

import type {CacheOptions} from "./cache";
import {DEFAULT_CACHE_OPTIONS} from "./cache";

import {PoolCurveState} from "./typegen/contracts-v2";

export class ReadonlyMiraAmmV2 {
  provider: Provider;
  ammContract: PoolCurveState;
  private poolMetadataCache: Map<
    string,
    {metadata: PoolMetadataV2; timestamp: number; ttl: number}
  > = new Map();
  private poolFeeCache: Map<string, {fee: BN; timestamp: number; ttl: number}> =
    new Map();
  private binDataCache: Map<
    string,
    {data: BinLiquidityInfo; timestamp: number; ttl: number}
  > = new Map();
  private readonly DEFAULT_CACHE_TTL = 30000; // 30 seconds

  constructor(provider: Provider, contractIdOpt?: string) {
    const contractId = contractIdOpt ?? DEFAULT_AMM_V2_CONTRACT_ID;
    this.provider = provider;
    this.ammContract = new PoolCurveState(contractId, provider);
  }

  id(): string {
    return this.ammContract.id.toB256();
  }

  /**
   * Get pool metadata for a single v2 pool
   * Uses get_pool contract method instead of pool_metadata
   */
  async poolMetadata(
    poolId: PoolIdV2,
    options: CacheOptions = {}
  ): Promise<PoolMetadataV2 | null> {
    const results = await this.poolMetadataBatch([poolId], options);
    return results[0];
  }

  /**
   * Get pool metadata for multiple v2 pools in batch
   * Uses get_pool contract method and handles PoolIdV2 (BN) format
   */
  async poolMetadataBatch(
    poolIds: PoolIdV2[],
    options: CacheOptions = {}
  ): Promise<(PoolMetadataV2 | null)[]> {
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
      const cacheKey = this.generatePoolCacheKey(poolId);
      const cached = this.poolMetadataCache.get(cacheKey);

      if (cached && !this.isPoolMetadataStale(cached)) {
        // Use cached data
        results[i] = cached.metadata;
      } else if (cached && this.isPoolMetadataStale(cached)) {
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
            this.setPoolMetadataCache(
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
   * Get fees for a specific v2 pool (per-pool instead of global)
   * Uses get_base_fee contract method
   */
  async fees(poolId: PoolIdV2): Promise<BN> {
    const cacheKey = this.generatePoolFeeCacheKey(poolId);
    const cached = this.poolFeeCache.get(cacheKey);

    // Return cached fee if it's still fresh
    if (cached && !this.isPoolFeeStale(cached)) {
      return cached.fee;
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

      // Cache the fee
      this.setPoolFeeCache(poolId, fee);

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
      // For v2, we'll simulate the swap calculation through each pool
      const amounts: Asset[] = [[assetIdIn, amount]];

      // Get pool metadata to determine asset order for each hop
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

        // Determine output asset for this hop
        const outputAsset =
          poolMetadata.pool.assetX.bits === currentAsset.bits
            ? poolMetadata.pool.assetY
            : poolMetadata.pool.assetX;

        // Use get_swap_in to calculate the output amount
        const swapForY = poolMetadata.pool.assetX.bits === currentAsset.bits;

        try {
          const swapResult = await this.ammContract.functions
            .get_swap_in(poolIdV2Input(pools[i]), currentAmount, swapForY)
            .get();

          if (swapResult.value) {
            // get_swap_in returns [amountIn, amountOut, fee]
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
   * Get liquidity for a specific bin using get_bin contract function
   */
  async getBinLiquidity(
    poolId: PoolIdV2,
    binId: BigNumberish
  ): Promise<Amounts | null> {
    try {
      const result = await this.ammContract.functions
        .get_bin(poolIdV2Input(poolId), binId)
        .get();

      if (!result.value) {
        return null;
      }

      return {
        x: result.value.x,
        y: result.value.y,
      };
    } catch (error) {
      // Bin might not exist, return null instead of throwing
      return null;
    }
  }

  /**
   * Get the active bin ID for a pool using get_pool_active_bin_id
   */
  async getActiveBin(poolId: PoolIdV2): Promise<number | null> {
    try {
      const result = await this.ammContract.functions
        .get_pool_active_bin_id(poolIdV2Input(poolId))
        .get();

      return result.value ?? null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get liquidity distribution across a range of bins
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
   * Get comprehensive liquidity distribution for a pool
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
                  .mul(new BN(10000))
                  .div(totalSupply.value);
                const underlyingAmounts = {
                  x: binLiquidity.x.mul(userShare).div(new BN(10000)),
                  y: binLiquidity.y.mul(userShare).div(new BN(10000)),
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
   * Maintains v1 API compatibility where possible
   */
  async getOtherTokenToAddLiquidity(
    poolId: PoolIdV2,
    amount: BigNumberish,
    isFirstToken: boolean,
    options: CacheOptions = {}
  ): Promise<Asset> {
    const poolMetadata = await this.poolMetadata(poolId, options);
    if (!poolMetadata) {
      throw new MiraV2Error(
        PoolCurveStateError.PoolNotFound,
        `Pool ${poolId.toString()} not found`
      );
    }

    const amountBN = new BN(amount);
    if (amountBN.lt(0) || amountBN.eq(0)) {
      throw new MiraV2Error(
        PoolCurveStateError.InsufficientAmountIn,
        "Non positive input amount"
      );
    }

    const reserves = poolMetadata.reserves;
    if (reserves.x.eq(0) || reserves.y.eq(0)) {
      throw new MiraV2Error(
        PoolCurveStateError.OutOfLiquidity,
        "Reserve is zero. Any number of tokens can be added"
      );
    }

    if (isFirstToken) {
      // First token is X, calculate required Y
      const otherTokenAmount = amountBN
        .mul(reserves.y)
        .div(reserves.x)
        .add(new BN(1)); // Add 1 for rounding
      return [poolMetadata.pool.assetY, otherTokenAmount];
    } else {
      // First token is Y, calculate required X
      const otherTokenAmount = amountBN
        .mul(reserves.x)
        .div(reserves.y)
        .add(new BN(1)); // Add 1 for rounding
      return [poolMetadata.pool.assetX, otherTokenAmount];
    }
  }

  /**
   * Get liquidity position value across bins for v2
   * Returns the total value of LP tokens distributed across bins
   */
  async getLiquidityPosition(
    poolId: PoolIdV2,
    lpTokensAmount: BigNumberish,
    options: CacheOptions = {}
  ): Promise<[Asset, Asset]> {
    const lpTokensBN = new BN(lpTokensAmount);
    if (lpTokensBN.lt(0) || lpTokensBN.eq(0)) {
      throw new MiraV2Error(
        PoolCurveStateError.InvalidLPTokenBalance,
        "Non positive LP token amount"
      );
    }

    const poolMetadata = await this.poolMetadata(poolId, options);
    if (!poolMetadata) {
      throw new MiraV2Error(
        PoolCurveStateError.PoolNotFound,
        `Pool ${poolId.toString()} not found`
      );
    }

    // For v2, this is a simplified calculation
    // In practice, you'd need to know which specific bins the LP tokens represent
    // This assumes proportional distribution across the pool's total reserves

    try {
      // Get total supply of LP tokens for this pool (simplified)
      // In v2, there are multiple LP tokens (one per bin), so this is an approximation
      const totalReserves = poolMetadata.reserves;

      // Calculate proportional amounts based on total reserves
      // This is a simplified approach - real implementation would need bin-specific calculations
      const totalLiquidity = totalReserves.x.add(totalReserves.y);

      if (totalLiquidity.eq(0)) {
        throw new MiraV2Error(
          PoolCurveStateError.OutOfLiquidity,
          "Pool has no liquidity"
        );
      }

      // Simplified proportional calculation
      const sharePercentage = lpTokensBN.mul(new BN(10000)).div(totalLiquidity);

      const amount0 = totalReserves.x.mul(sharePercentage).div(new BN(10000));
      const amount1 = totalReserves.y.mul(sharePercentage).div(new BN(10000));

      return [
        [poolMetadata.pool.assetX, amount0],
        [poolMetadata.pool.assetY, amount1],
      ];
    } catch (error) {
      throw new MiraV2Error(
        PoolCurveStateError.InvalidLPTokenBalance,
        `Failed to calculate liquidity position: ${error instanceof Error ? error.message : String(error)}`,
        {poolId, lpTokensAmount, error}
      );
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
   * Generate cache key for pool metadata
   */
  private generatePoolCacheKey(poolId: PoolIdV2): string {
    return `pool_${poolId.toString()}`;
  }

  /**
   * Check if pool metadata cache entry is stale
   */
  private isPoolMetadataStale(cached: {
    metadata: PoolMetadataV2;
    timestamp: number;
    ttl: number;
  }): boolean {
    return Date.now() - cached.timestamp > cached.ttl;
  }

  /**
   * Set pool metadata in cache
   */
  private setPoolMetadataCache(
    poolId: PoolIdV2,
    metadata: PoolMetadataV2,
    ttl?: number
  ): void {
    const cacheKey = this.generatePoolCacheKey(poolId);
    this.poolMetadataCache.set(cacheKey, {
      metadata,
      timestamp: Date.now(),
      ttl: ttl ?? this.DEFAULT_CACHE_TTL,
    });
  }

  /**
   * Generate cache key for pool fees
   */
  private generatePoolFeeCacheKey(poolId: PoolIdV2): string {
    return `fee_${poolId.toString()}`;
  }

  /**
   * Check if pool fee cache entry is stale
   */
  private isPoolFeeStale(cached: {
    fee: BN;
    timestamp: number;
    ttl: number;
  }): boolean {
    return Date.now() - cached.timestamp > cached.ttl;
  }

  /**
   * Set pool fee in cache
   */
  private setPoolFeeCache(poolId: PoolIdV2, fee: BN, ttl?: number): void {
    const cacheKey = this.generatePoolFeeCacheKey(poolId);
    this.poolFeeCache.set(cacheKey, {
      fee,
      timestamp: Date.now(),
      ttl: ttl ?? this.DEFAULT_CACHE_TTL,
    });
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

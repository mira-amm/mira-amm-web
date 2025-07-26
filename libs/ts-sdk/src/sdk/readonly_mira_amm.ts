import {DEFAULT_AMM_CONTRACT_ID} from "./constants";
import {AssetId, BigNumberish, BN, Provider} from "fuels";
import {
  AmmFees,
  AmmMetadata,
  Asset,
  LpAssetInfo,
  PoolId,
  PoolMetadata,
} from "./model";

import {
  arrangePoolParams,
  assetInput,
  poolContainsAsset,
  poolIdInput,
  reorderPoolId,
} from "./utils";

import {
  addFee,
  BASIS_POINTS,
  getAmountIn,
  getAmountOut,
  powDecimals,
  subtractFee,
} from "./math";
import {
  PoolDataCache,
  globalPoolDataCache,
  CacheOptions,
  DEFAULT_CACHE_OPTIONS,
  CacheError,
} from "./cache";

import {MiraAmmContract} from "./typegen/contracts";

const DECIMALS_PRECISION = 1000000000000;

export class ReadonlyMiraAmm {
  provider: Provider;
  ammContract: MiraAmmContract;
  private poolCache: PoolDataCache;
  private lastRouteSignature: string | null = null;
  private cachedFees: AmmFees | null = null;
  private feesCacheTimestamp: number = 0;
  private readonly FEES_CACHE_TTL = 30000; // 30 seconds

  constructor(provider: Provider, contractIdOpt?: string) {
    let contractId = contractIdOpt ?? DEFAULT_AMM_CONTRACT_ID;
    this.provider = provider;
    this.ammContract = new MiraAmmContract(contractId, provider);
    this.poolCache = globalPoolDataCache;
  }

  id(): string {
    return this.ammContract.id.toString();
  }

  async ammMetadata(): Promise<AmmMetadata> {
    return {
      id: this.id(),
      fees: await this.fees(),
      hook: await this.hook(),
      totalAssets: await this.totalAssets(),
      owner: await this.owner(),
    };
  }

  async poolMetadataBatch(
    poolIds: PoolId[],
    options: CacheOptions = {}
  ): Promise<(PoolMetadata | null)[]> {
    const effectiveOptions = {...DEFAULT_CACHE_OPTIONS, ...options};

    // If caching is disabled, use direct fetch
    if (!effectiveOptions.useCache) {
      return this.poolMetadataBatchDirect(poolIds);
    }

    const results: (PoolMetadata | null)[] = [];
    const poolsToFetch: PoolId[] = [];
    const fetchIndices: number[] = [];

    // Check cache for each pool
    // TODO change from loop to do things with a map
    for (let i = 0; i < poolIds.length; i++) {
      const poolId = reorderPoolId(poolIds[i]);
      const cached = this.poolCache.getPoolMetadata(poolId);

      if (cached && !this.poolCache.isStale(poolId)) {
        // Use cached data
        results[i] = cached;
      } else if (cached && this.poolCache.isStale(poolId)) {
        // Handle stale data
        if (effectiveOptions.refreshStaleData) {
          // Mark for refresh
          poolsToFetch.push(poolId);
          fetchIndices.push(i);
          // Use stale data temporarily
          results[i] = cached;
        } else {
          // Use stale data as-is
          results[i] = cached;
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
            "Failed to refresh pool data, using stale cache:",
            error
          );
        } else {
          // No fallback data available, re-throw error
          throw new CacheError(
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
    poolIds: PoolId[]
  ): Promise<(PoolMetadata | null)[]> {
    const poolIdTransactions = poolIds.map((poolId) =>
      this.ammContract.functions.pool_metadata(poolIdInput(poolId))
    );

    const {value} = await this.ammContract.multiCall(poolIdTransactions).get();

    if (!value || value.length !== poolIds.length) {
      throw new Error(
        "Mismatch between pools and metadata results while fetching pool metadata in batch."
      );
    }

    return poolIds.map((poolId, index) => {
      const pool = value[index];
      return {
        poolId: poolId,
        reserve0: pool.reserve_0,
        reserve1: pool.reserve_1,
        liquidity: [pool.liquidity.id, pool.liquidity.amount],
        decimals0: pool.decimals_0,
        decimals1: pool.decimals_1,
      };
    });
  }

  async poolMetadata(
    poolId: PoolId,
    options: CacheOptions = {}
  ): Promise<PoolMetadata | null> {
    const results = await this.poolMetadataBatch([poolId], options);
    return results[0];
  }

  async fees(): Promise<AmmFees> {
    const now = Date.now();

    // Return cached fees if they're still fresh
    if (
      this.cachedFees &&
      now - this.feesCacheTimestamp < this.FEES_CACHE_TTL
    ) {
      return this.cachedFees;
    }

    // Fetch fresh fees from the contract
    const result = await this.ammContract.functions.fees().get();
    const [lpFeeVolatile, lpFeeStable, protocolFeeVolatile, protocolFeeStable] =
      result.value;

    this.cachedFees = {
      lpFeeVolatile: lpFeeVolatile,
      lpFeeStable: lpFeeStable,
      protocolFeeVolatile: protocolFeeVolatile,
      protocolFeeStable: protocolFeeStable,
    };
    this.feesCacheTimestamp = now;

    return this.cachedFees;
  }

  async hook(): Promise<string | null> {
    const result = await this.ammContract.functions.hook().get();
    return result.value?.bits || null;
  }

  async totalAssets(): Promise<BN> {
    const result = await this.ammContract.functions.total_assets().get();
    return result.value;
  }

  async lpAssetInfo(assetId: AssetId): Promise<LpAssetInfo | null> {
    const name = await this.ammContract.functions
      .name(assetInput(assetId))
      .get();
    const symbol = await this.ammContract.functions
      .symbol(assetInput(assetId))
      .get();
    const decimals = await this.ammContract.functions
      .decimals(assetInput(assetId))
      .get();
    const totalSupply = await this.ammContract.functions
      .total_supply(assetInput(assetId))
      .get();

    if (name.value && symbol.value && decimals.value && totalSupply.value) {
      return {
        assetId: assetId,
        name: name.value,
        symbol: symbol.value,
        decimals: decimals.value,
        totalSupply: totalSupply.value,
      };
    } else {
      return null;
    }
  }

  async totalSupply(assetId: AssetId): Promise<BN | undefined> {
    return (
      await this.ammContract.functions.total_supply(assetInput(assetId)).get()
    ).value;
  }

  async owner(): Promise<string | null> {
    const result = await this.ammContract.functions.owner().get();
    const ownershipState = result.value;
    const identity = ownershipState.Initialized;
    const bits = identity?.Address?.bits ?? identity?.ContractId?.bits;
    return bits || null;
  }

  async getOtherTokenToAddLiquidity(
    poolId: PoolId,
    amount: BigNumberish,
    isFirstToken: boolean,
    options: CacheOptions = {}
  ): Promise<Asset> {
    poolId = reorderPoolId(poolId);
    const pool = await this.poolMetadata(poolId, options);
    if (!pool) {
      throw new Error("Pool not found");
    }
    if (pool.reserve0.isZero() || pool.reserve1.isZero()) {
      throw new Error("Reserve is zero. Any number of tokens can be added");
    }
    if (isFirstToken) {
      const otherTokenAmount = new BN(amount)
        .mul(pool.reserve1)
        .div(pool.reserve0)
        .add(new BN(1));
      return [pool.poolId[1], otherTokenAmount];
    } else {
      const otherTokenAmount = new BN(amount)
        .mul(pool.reserve0)
        .div(pool.reserve1)
        .add(new BN(1));
      return [pool.poolId[0], otherTokenAmount];
    }
  }

  async getLiquidityPosition(
    poolId: PoolId,
    lpTokensAmount: BigNumberish,
    options: CacheOptions = {}
  ): Promise<[Asset, Asset]> {
    poolId = reorderPoolId(poolId);
    const lpTokensBN = new BN(lpTokensAmount);
    if (lpTokensBN.isNeg() || lpTokensBN.isZero()) {
      throw new Error("Non positive input amount");
    }
    const pool = await this.poolMetadata(poolId, options);
    if (!pool) {
      throw new Error("Pool not found");
    }
    if (lpTokensBN.gt(pool.liquidity[1])) {
      throw new Error("Not enough liquidity");
    }

    const amount0 = pool.reserve0.mul(lpTokensBN).div(pool.liquidity[1]);
    const amount1 = pool.reserve1.mul(lpTokensBN).div(pool.liquidity[1]);
    return [
      [pool.poolId[0], amount0],
      [pool.poolId[1], amount1],
    ];
  }

  private async computeSwapPath(
    direction: "IN" | "OUT",
    assetId: AssetId,
    amount: BN,
    pools: PoolId[],
    fees: AmmFees,
    options: CacheOptions = {}
  ): Promise<Asset[]> {
    const orderedPools = direction === "IN" ? pools : [...pools].reverse();
    const poolMetadataList = await this.poolMetadataBatch(
      orderedPools.map(reorderPoolId),
      options
    );

    let currentAsset = assetId;
    let currentAmount = amount;
    const result: Asset[] = [[currentAsset, currentAmount]];

    for (let i = 0; i < orderedPools.length; i++) {
      const pool = poolMetadataList[i]!;
      const poolId = orderedPools[i];

      let assetOut, reserveIn, reserveOut, decimalsIn, decimalsOut;

      if (direction === "IN") {
        [assetOut, reserveIn, reserveOut, decimalsIn, decimalsOut] =
          arrangePoolParams(pool, currentAsset);

        const amountAfterFee = subtractFee(poolId, currentAmount, fees);
        const swapAmount = getAmountOut(
          poolId[2],
          reserveIn,
          reserveOut,
          powDecimals(decimalsIn),
          powDecimals(decimalsOut),
          amountAfterFee
        );

        result.push([assetOut, swapAmount]);
        currentAsset = assetOut;
        currentAmount = swapAmount;
      } else {
        const [assetIn, reserveOut, reserveIn, decimalsOut, decimalsIn] =
          arrangePoolParams(pool, currentAsset);

        const swapAmount = getAmountIn(
          poolId[2],
          reserveIn,
          reserveOut,
          powDecimals(decimalsIn),
          powDecimals(decimalsOut),
          currentAmount
        );

        const amountWithFee = addFee(poolId, swapAmount, fees);

        result.push([assetIn, amountWithFee]);
        currentAsset = assetIn;
        currentAmount = amountWithFee;
      }
    }

    return result;
  }

  async getAmountsOut(
    assetIdIn: AssetId,
    assetAmountIn: BigNumberish,
    pools: PoolId[],
    options: CacheOptions = {}
  ) {
    const amount = new BN(assetAmountIn);
    if (amount.isNeg() || amount.isZero())
      throw new Error("Non positive input amount");
    const fees = await this.fees();
    const result = await this.computeSwapPath(
      "IN",
      assetIdIn,
      amount,
      pools,
      fees,
      options
    );
    return result;
  }

  async getAmountsIn(
    assetIdOut: AssetId,
    assetAmountOut: BigNumberish,
    pools: PoolId[],
    options: CacheOptions = {}
  ) {
    const amount = new BN(assetAmountOut);
    if (amount.isNeg() || amount.isZero())
      throw new Error("Non positive input amount");
    const fees = await this.fees();
    const result = await this.computeSwapPath(
      "OUT",
      assetIdOut,
      amount,
      pools,
      fees,
      options
    );
    return result;
  }

  async previewSwapExactInput(
    assetIdIn: AssetId,
    assetAmountIn: BigNumberish,
    pools: PoolId[],
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

  async previewSwapExactOutput(
    assetIdOut: AssetId,
    assetAmountOut: BigNumberish,
    pools: PoolId[],
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

  async previewSwapExactInputBatch(
    assetIdIn: AssetId,
    assetAmountIn: BigNumberish,
    routes: PoolId[][],
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

  async previewSwapExactOutputBatch(
    assetIdOut: AssetId,
    assetAmountOut: BigNumberish,
    routes: PoolId[][],
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
   * Get access to the pool data cache for external management
   */
  getPoolCache(): PoolDataCache {
    return this.poolCache;
  }

  /**
   * Generate a signature for routes to detect changes
   * @private
   */
  private generateRouteSignature(routes: PoolId[][]): string {
    return routes
      .map((route) =>
        route
          .map((poolId) => `${poolId[0].bits}-${poolId[1].bits}-${poolId[2]}`)
          .join("|")
      )
      .join("||");
  }

  /**
   * Check if routes have changed since last call
   * @private
   */
  private hasRoutesChanged(routes: PoolId[][]): boolean {
    const currentSignature = this.generateRouteSignature(routes);
    const hasChanged = this.lastRouteSignature !== currentSignature;
    this.lastRouteSignature = currentSignature;
    return hasChanged;
  }

  /**
   * Preload pools for routes with automatic route change detection
   * This method will automatically preload pools when routes change
   */
  async preloadPoolsForRoutesWithChangeDetection(
    routes: PoolId[][],
    options: CacheOptions = {}
  ): Promise<boolean> {
    const routesChanged = this.hasRoutesChanged(routes);

    if (routesChanged) {
      await this.preloadPoolsForRoutes(routes, options);
      return true; // Indicates preloading occurred
    }

    return false; // No preloading needed
  }

  /**
   * Preload pools for routes to warm up the cache
   * Extracts unique pools from route arrays and batch fetches their metadata
   * Also preloads fees to warm up the fee cache
   */
  async preloadPoolsForRoutes(
    routes: PoolId[][],
    options: CacheOptions = {}
  ): Promise<void> {
    if (!routes || routes.length === 0) {
      return;
    }

    // Extract unique pools from all routes
    const uniquePools = this.extractUniquePoolsFromRoutes(routes);

    if (uniquePools.length === 0) {
      return;
    }

    // Determine which pools need to be fetched
    const poolsToFetch = this.getPoolsToFetch(uniquePools, options);

    // Create an array of promises for concurrent execution
    const preloadPromises: Promise<any>[] = [];

    // Add pool metadata fetching if needed
    if (poolsToFetch.length > 0) {
      preloadPromises.push(
        this.poolMetadataBatch(poolsToFetch, {
          ...options,
          useCache: true, // Force cache usage for preloading
        }).catch((error) => {
          // Log warning but don't throw - preloading is an optimization
          console.warn(
            "Pool preloading failed, continuing without cache:",
            error
          );
        })
      );
    }

    // Add fee fetching to warm up the fee cache
    preloadPromises.push(
      this.fees().catch((error) => {
        // Log warning but don't throw - preloading is an optimization
        console.warn("Fee preloading failed, continuing without cache:", error);
      })
    );

    // Execute all preloading operations concurrently
    if (preloadPromises.length > 0) {
      await Promise.allSettled(preloadPromises);
    }
  }

  /**
   * Extract unique pools from route arrays
   * @private
   */
  private extractUniquePoolsFromRoutes(routes: PoolId[][]): PoolId[] {
    const uniquePools = new Set<string>();
    const poolsToPreload: PoolId[] = [];

    for (const route of routes) {
      if (!Array.isArray(route)) {
        continue;
      }

      for (const poolId of route) {
        if (!poolId || !Array.isArray(poolId) || poolId.length !== 3) {
          continue;
        }

        const reorderedPoolId = reorderPoolId(poolId);
        const key = `${reorderedPoolId[0].bits}-${reorderedPoolId[1].bits}-${reorderedPoolId[2]}`;

        if (!uniquePools.has(key)) {
          uniquePools.add(key);
          poolsToPreload.push(reorderedPoolId);
        }
      }
    }

    return poolsToPreload;
  }

  /**
   * Determine which pools need to be fetched based on cache state
   * @private
   */
  private getPoolsToFetch(pools: PoolId[], options: CacheOptions): PoolId[] {
    const effectiveOptions = {...DEFAULT_CACHE_OPTIONS, ...options};

    // If caching is disabled, fetch all pools
    if (!effectiveOptions.useCache) {
      return pools;
    }

    const poolsToFetch: PoolId[] = [];

    for (const poolId of pools) {
      const hasValidCache = this.poolCache.hasValidCache(poolId);
      const isStale = this.poolCache.isStale(poolId);

      // Fetch if not cached, or if stale and refresh is enabled
      if (!hasValidCache || (isStale && effectiveOptions.refreshStaleData)) {
        poolsToFetch.push(poolId);
      }
    }

    return poolsToFetch;
  }

  async getCurrentRate(
    assetId: AssetId,
    pools: PoolId[]
  ): Promise<[number, number?, number?]> {
    if (pools.length === 0) {
      throw new Error("No pools provided");
    }
    let lastPool = pools[pools.length - 1];
    if (!poolContainsAsset(lastPool, assetId)) {
      pools = pools.slice().reverse();
      lastPool = pools[pools.length - 1];
      if (!poolContainsAsset(lastPool, assetId)) {
        throw new Error("Asset not found in border pools");
      }
    }

    let assetIdIn = assetId;
    for (let poolId of pools.slice().reverse()) {
      if (poolId[0].bits === assetIdIn.bits) {
        assetIdIn = poolId[1];
      } else if (poolId[1].bits === assetIdIn.bits) {
        assetIdIn = poolId[0];
      } else {
        throw new Error("Incorrect pools");
      }
    }

    let currentRate = new BN(DECIMALS_PRECISION);
    let assetIn = assetIdIn;
    let assetDecimalsIn, assetDecimalsOut;
    const fees = await this.fees();
    const volatileFee =
      fees.lpFeeVolatile.toNumber() + fees.protocolFeeVolatile.toNumber();
    for (const poolId of pools) {
      const pool = await this.poolMetadata(poolId);
      if (!pool) {
        throw new Error(`Pool not found ${poolId}`);
      }
      const [reserveIn, reserveOut, assetOut, decimalsIn, decimalsOut] =
        poolId[0].bits === assetIn.bits
          ? [
              pool.reserve0,
              pool.reserve1,
              poolId[1],
              pool.decimals0,
              pool.decimals1,
            ]
          : [
              pool.reserve1,
              pool.reserve0,
              poolId[0],
              pool.decimals1,
              pool.decimals0,
            ];
      if (assetIdIn.bits === assetIn.bits) {
        assetDecimalsIn = decimalsIn;
      }
      if (poolId[2]) {
        // stable
        // TODO: temporary & fast solution based on the attempt to swap 100 tokens
        const assetAmountIn = 100;
        // already accounts for fees
        const amountsOut = await this.getAmountsOut(assetIn, assetAmountIn, [
          poolId,
        ]);
        const assetOut = amountsOut[amountsOut.length - 1][1];
        currentRate = currentRate.mul(assetAmountIn).div(assetOut);
      } else {
        // volatile
        currentRate = currentRate
          .mul(reserveIn)
          .div(reserveOut)
          .mul(BASIS_POINTS.sub(volatileFee))
          .div(BASIS_POINTS);
      }
      assetIn = assetOut;
      assetDecimalsOut = decimalsOut;
    }
    let rate = currentRate.toNumber() / DECIMALS_PRECISION;
    return [rate, assetDecimalsIn, assetDecimalsOut];
  }
}

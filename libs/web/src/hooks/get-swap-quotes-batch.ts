import {BN, type AssetId} from "fuels";
import type {
  ReadonlyMiraAmm,
  ReadonlyMiraAmmV2,
  CacheOptions,
  PoolId,
  PoolIdV2,
} from "mira-dex-ts";
import {Route} from ".";

export enum TradeType {
  EXACT_IN = "EXACT_IN",
  EXACT_OUT = "EXACT_OUT",
}

export type SwapQuote = {
  route: Route;
  amountIn: BN;
  amountOut: BN;
  assetIdIn: AssetId;
  assetIdOut: AssetId;
  tradeType: TradeType;
};

export const getSwapQuotesBatch = async (
  amount: BN,
  tradeType: TradeType,
  routes: Route[],
  amm: ReadonlyMiraAmm | ReadonlyMiraAmmV2,
  cacheOptions?: CacheOptions
): Promise<SwapQuote[]> => {
  if (!routes.length) {
    return [];
  }

  const isExactIn = tradeType === TradeType.EXACT_IN;
  const assetKey = isExactIn
    ? routes[0].assetIn.assetId
    : routes[0].assetOut.assetId;

  // Extract pool IDs from routes
  const poolPaths = routes.map((r) => r.pools.map((p) => p.poolId));

  // Determine if we're using V2 by checking the pool ID type (BN vs Array)
  const isV2 =
    poolPaths.length > 0 &&
    poolPaths[0].length > 0 &&
    typeof poolPaths[0][0] === "object" &&
    "toNumber" in poolPaths[0][0];

  let results;
  try {
    // Perform batch quote calculations with cache options
    // For V2, ensure pool paths are typed as PoolIdV2[][]
    // For V1, they should be PoolId[][]
    if (isV2) {
      // Type assertion for V2 - pool IDs are BN objects
      const v2PoolPaths = poolPaths as PoolIdV2[][];
      const ammV2 = amm as ReadonlyMiraAmmV2;
      results = isExactIn
        ? await ammV2.previewSwapExactInputBatch(
            {bits: assetKey},
            amount,
            v2PoolPaths,
            cacheOptions
          )
        : await ammV2.previewSwapExactOutputBatch(
            {bits: assetKey},
            amount,
            v2PoolPaths,
            cacheOptions
          );
    } else {
      // Type assertion for V1 - pool IDs are [AssetId, AssetId, boolean] arrays
      const v1PoolPaths = poolPaths as PoolId[][];
      const ammV1 = amm as ReadonlyMiraAmm;
      results = isExactIn
        ? await ammV1.previewSwapExactInputBatch(
            {bits: assetKey},
            amount,
            v1PoolPaths,
            cacheOptions
          )
        : await ammV1.previewSwapExactOutputBatch(
            {bits: assetKey},
            amount,
            v1PoolPaths,
            cacheOptions
          );
    }
  } catch (error) {
    console.error("[getSwapQuotesBatch] Error calling SDK:", error);
    // Enhanced error handling for cache failures during batch operations
    if (cacheOptions?.useCache) {
      console.warn(
        "Cached batch calculation failed, retrying without cache:",
        error
      );

      // Fallback: retry without cache options
      try {
        if (isV2) {
          const v2PoolPaths = poolPaths as PoolIdV2[][];
          const ammV2 = amm as ReadonlyMiraAmmV2;
          results = isExactIn
            ? await ammV2.previewSwapExactInputBatch(
                {bits: assetKey},
                amount,
                v2PoolPaths
              )
            : await ammV2.previewSwapExactOutputBatch(
                {bits: assetKey},
                amount,
                v2PoolPaths
              );
        } else {
          const v1PoolPaths = poolPaths as PoolId[][];
          const ammV1 = amm as ReadonlyMiraAmm;
          results = isExactIn
            ? await ammV1.previewSwapExactInputBatch(
                {bits: assetKey},
                amount,
                v1PoolPaths
              )
            : await ammV1.previewSwapExactOutputBatch(
                {bits: assetKey},
                amount,
                v1PoolPaths
              );
        }
      } catch (fallbackError) {
        console.error(
          "Batch calculation failed even without cache:",
          fallbackError
        );
        throw fallbackError;
      }
    } else {
      // Re-throw if not a cache-related issue
      throw error;
    }
  }

  const quotes = results
    .map((asset, i) => {
      const quote = asset
        ? {
            tradeType,
            route: routes[i],
            assetIdIn: {bits: routes[i].assetIn.assetId},
            assetIdOut: {bits: routes[i].assetOut.assetId},
            amountIn: isExactIn ? amount : asset[1],
            amountOut: isExactIn ? asset[1] : amount,
          }
        : null;

      return quote;
    })
    .filter((quote): quote is SwapQuote => quote !== null);

  return quotes;
};

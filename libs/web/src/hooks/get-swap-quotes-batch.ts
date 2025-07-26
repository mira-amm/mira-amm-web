import {type BN, type AssetId} from "fuels";
import type {ReadonlyMiraAmm, CacheOptions} from "mira-dex-ts";
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
  amm: ReadonlyMiraAmm,
  cacheOptions?: CacheOptions
): Promise<SwapQuote[]> => {
  if (!routes.length) return [];

  const isExactIn = tradeType === TradeType.EXACT_IN;
  const assetKey = isExactIn
    ? routes[0].assetIn.assetId
    : routes[0].assetOut.assetId;
  const poolPaths = routes.map((r) => r.pools.map((p) => p.poolId));
  let results;
  try {
    // Perform batch quote calculations with cache options
    results = isExactIn
      ? await amm.previewSwapExactInputBatch(
          {bits: assetKey},
          amount,
          poolPaths,
          cacheOptions
        )
      : await amm.previewSwapExactOutputBatch(
          {bits: assetKey},
          amount,
          poolPaths,
          cacheOptions
        );
  } catch (error) {
    // Enhanced error handling for cache failures during batch operations
    if (cacheOptions?.useCache) {
      console.warn(
        "Cached batch calculation failed, retrying without cache:",
        error
      );

      // Fallback: retry without cache options
      try {
        results = isExactIn
          ? await amm.previewSwapExactInputBatch(
              {bits: assetKey},
              amount,
              poolPaths
            )
          : await amm.previewSwapExactOutputBatch(
              {bits: assetKey},
              amount,
              poolPaths
            );
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

  return results
    .map((asset, i) =>
      asset
        ? {
            tradeType,
            route: routes[i],
            assetIdIn: {bits: routes[i].assetIn.assetId},
            assetIdOut: {bits: routes[i].assetOut.assetId},
            amountIn: isExactIn ? amount : asset[1],
            amountOut: isExactIn ? asset[1] : amount,
          }
        : null
    )
    .filter((quote): quote is SwapQuote => quote !== null);
};

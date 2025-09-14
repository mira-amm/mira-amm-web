import {useMemo, useEffect, useRef} from "react";
import {useQuery} from "@tanstack/react-query";
import {type BN, bn} from "fuels";
import {
  getSwapQuotesBatch,
  type SwapQuote,
  TradeType,
} from "./get-swap-quotes-batch";
import {useMiraSDK} from "@/src/core/providers/MiraSDKProvider";
import {type Route, useRoutablePools} from "@/src/hooks";
import {CoinData} from "../utils/coinsConfig";
import {type CacheOptions} from "mira-dex-ts";

export enum TradeState {
  LOADING,
  INVALID,
  NO_ROUTE_FOUND,
  VALID,
  REFETCHING,
}

/**
 * Cache options for the swap router hook
 */
export interface SwapRouterCacheOptions {
  enableCaching?: boolean; // Whether to enable caching (default: false for backward compatibility)
  poolDataTTL?: number; // Pool data TTL in milliseconds (default: 30000)
  refreshInterval?: number; // Background refresh interval in milliseconds (default: 60000)
  preloadOnRouteChange?: boolean; // Whether to preload pools when routes change (default: true)
}

export function useSwapRouter(
  tradeType: TradeType,
  amountSpecified: BN = bn(0),
  assetIn?: CoinData,
  assetOut?: CoinData,
  cacheOptions?: SwapRouterCacheOptions
): {
  tradeState: TradeState;
  trade?: {
    bestRoute: Route;
    amountIn: BN;
    amountOut: BN;
  };
  error: string | null;
} {
  const {readonlyMira: amm} = useMiraSDK();

  // Default cache options
  const effectiveCacheOptions = useMemo(
    () => ({
      enableCaching: false, // Default to false for backward compatibility
      poolDataTTL: 30000, // 30 seconds
      refreshInterval: 60000, // 1 minute
      preloadOnRouteChange: true,
      ...cacheOptions,
    }),
    [cacheOptions]
  );

  // Convert SwapRouterCacheOptions to CacheOptions
  const ammCacheOptions: CacheOptions = useMemo(
    () => ({
      useCache: effectiveCacheOptions.enableCaching,
      preloadPools: effectiveCacheOptions.preloadOnRouteChange,
      cacheTTL: effectiveCacheOptions.poolDataTTL,
      refreshStaleData: true,
    }),
    [effectiveCacheOptions]
  );

  const shouldFetch = useMemo(
    () => !!assetIn && !!assetOut && amountSpecified.gt(0),
    [assetIn, assetOut, amountSpecified]
  );

  const {
    routes,
    isLoading: routesLoading,
    isRefetching: routesRefetching,
  } = useRoutablePools(
    assetIn,
    assetOut,
    // fetches in the background
    shouldFetch ||
      (effectiveCacheOptions.enableCaching && !!assetIn && !!assetOut)
  );

  // Track route changes for preloading
  const previousRouteSignature = useRef<string | null>(null);
  const routeSignature = useMemo(() => {
    if (!routes.length) return null;
    return routes
      .map((route) =>
        route.pools.map((pool) => pool.poolId.join("-")).join("|")
      )
      .join("||");
  }, [routes]);

  // Pool preloading effect when routes change (even without amount)
  useEffect(() => {
    if (
      effectiveCacheOptions.enableCaching &&
      effectiveCacheOptions.preloadOnRouteChange &&
      amm &&
      routeSignature &&
      routeSignature !== previousRouteSignature.current &&
      routes.length > 0 // Only need routes, not amount
    ) {
      // Convert Route[] to PoolId[][] from the sdk format for preloading
      const poolPaths = routes.map((route) =>
        route.pools.map((pool) => pool.poolId)
      );

      // Preload pools for new routes
      amm.preloadPoolsForRoutes(poolPaths, ammCacheOptions).catch((error) => {
        console.error("Failed to preload pools:", error);
      });
      previousRouteSignature.current = routeSignature;
    }
  }, [
    amm,
    routes,
    routeSignature,
    effectiveCacheOptions.enableCaching,
    effectiveCacheOptions.preloadOnRouteChange,
    ammCacheOptions,
    assetIn?.symbol, // Add asset dependencies to trigger preload on asset change
    assetOut?.symbol,
  ]);

  const {
    data: quotes = [],
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: [
      "swapQuotes",
      tradeType,
      amountSpecified.toString(),
      assetIn?.assetId,
      assetOut?.assetId,
      routes,
      effectiveCacheOptions.enableCaching, // Include cache options in query key
    ],

    queryFn: () =>
      amm && routes.length
        ? getSwapQuotesBatch(
            amountSpecified,
            tradeType,
            routes,
            amm,
            ammCacheOptions
          )
        : Promise.resolve([]),

    staleTime: effectiveCacheOptions.enableCaching
      ? effectiveCacheOptions.poolDataTTL
      : 0,
    gcTime: effectiveCacheOptions.enableCaching
      ? effectiveCacheOptions.poolDataTTL
      : 0, // Updated from cacheTime
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    enabled: shouldFetch,
    initialData: shouldFetch ? undefined : [],
  });

  // NOTE: could've done return-foo, used 'if' statements to keep it debuggable in case it explodes later
  return useMemo(() => {
    if (isLoading || routesLoading) {
      return {tradeState: TradeState.LOADING, error: null};
    }

    if (!assetIn || !assetOut) {
      return {tradeState: TradeState.INVALID, error: null};
    }

    if (!quotes.length) {
      return {
        tradeState: TradeState.NO_ROUTE_FOUND,
        error: null, // Fixed: added missing error property
      };
    }

    const best = quotes.reduce<SwapQuote | null>((best, current) => {
      if (!best) return current;

      if (tradeType === TradeType.EXACT_IN) {
        return current.amountOut.gt(best.amountOut) ? current : best;
      }

      return current.amountIn.lt(best.amountIn) ? current : best;
    }, null);

    if (!best) {
      return {
        tradeState: TradeState.INVALID,
        error: "Insufficient reserves in pool",
      };
    }

    const tradeState =
      isRefetching || routesRefetching
        ? TradeState.REFETCHING
        : TradeState.VALID;

    return {
      tradeState,
      trade: {
        bestRoute: best.route,
        amountIn: best.amountIn,
        amountOut: best.amountOut,
      },
      error: null,
    };
  }, [
    isLoading,
    routesLoading,
    isRefetching,
    routesRefetching,
    quotes,
    tradeType,
    amountSpecified,
    assetIn,
    assetOut,
  ]);
}

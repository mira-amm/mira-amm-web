import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { type BN, type AssetId, bn } from "fuels";
import type { Asset, ReadonlyMiraAmm } from "mira-dex-ts";
import { CoinData } from "../utils/coinsConfig";
import { useReadonlyMira } from ".";
import useRoutablePools from "./useRoutablePools";
import { Route } from "./useGetPoolsWithReserve";

export enum TradeState {
  LOADING,
  INVALID,
  NO_ROUTE_FOUND,
  VALID,
  REFETCHING,
}

export enum TradeType {
  EXACT_IN = "EXACT_IN",
  EXACT_OUT = "EXACT_OUT",
}

type SwapQuote = {
  route: Route;
  amountIn: BN;
  amountOut: BN;
  assetIdIn: AssetId;
  assetIdOut: AssetId;
  tradeType: TradeType;
};

const getSwapQuotesBatch = async (
  amount: BN,
  tradeType: TradeType,
  routes: Route[],
  amm: ReadonlyMiraAmm
): Promise<SwapQuote[]> => {
  const isExactIn = tradeType === TradeType.EXACT_IN;
  const assetKey = isExactIn ? routes[0].assetIn.assetId : routes[0].assetOut.assetId;
  const poolPaths = routes.map((r) => r.pools.map((p) => p.poolId));

  const results = isExactIn
    ? await amm.previewSwapExactInputBatch({ bits: assetKey }, amount, poolPaths)
    : await amm.previewSwapExactOutputBatch({ bits: assetKey }, amount, poolPaths);

  return results.map((asset: Asset, i) => ({
    tradeType,
    route: routes[i],
    assetIdIn: routes[i].assetIn.assetId,
    assetIdOut: routes[i].assetOut.assetId,
    amountIn: isExactIn ? amount : asset[1],
    amountOut: isExactIn ? asset[1] : amount,
  }));
};

export function useSwapRouter(
  tradeType: TradeType,
  amountSpecified: BN = bn(0),
  assetIn?: CoinData,
  assetOut?: CoinData
): {
  tradeState: TradeState;
  trade?: {
    bestRoute: Route;
    amountIn: BN;
    amountOut: BN;
  };
  error: string | null;
} {
  const amm = useReadonlyMira();

  const shouldFetch = useMemo(
    () => !!assetIn && !!assetOut && amountSpecified.gt(0),
    [assetIn, assetOut, amountSpecified]
  );

  const {
    routes,
    isLoading: routesLoading,
    isRefetching: routesRefetching,
  } = useRoutablePools(assetIn, assetOut, shouldFetch);

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
    ],
    queryFn: () =>
      amm && routes.length
        ? getSwapQuotesBatch(amountSpecified, tradeType, routes, amm)
        : Promise.resolve([]),
    initialData: [],
  });

    // NOTE: could've done return-foo, used 'if' statements to keep it debuggable in case it explodes later
  return useMemo(() => {
    if (isLoading || routesLoading) {
      return { tradeState: TradeState.LOADING, error: null };
    }

    if (!assetIn || !assetOut) {
      return { tradeState: TradeState.INVALID, error: null };
    }

    if (!quotes.length) {
      return {
        tradeState: TradeState.NO_ROUTE_FOUND,
        error: amountSpecified.gt(0) ? "No route found for this trade" : null,
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

    const tradeState = isRefetching || routesRefetching
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

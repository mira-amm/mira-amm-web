import {useMemo} from "react";
import {type BN, bn} from "fuels";
import {
  getSwapQuotesBatch,
  type SwapQuote,
  TradeType,
} from "./get-swap-quotes-batch";
import {useReadonlyMira} from ".";
import {type Route, useRoutablePools} from "@/src/hooks";
import {CoinData} from "../utils/coinsConfig";
import {useQuery} from "@tanstack/react-query";

export enum TradeState {
  LOADING,
  INVALID,
  NO_ROUTE_FOUND,
  VALID,
  REFETCHING,
}

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

  // debugger;

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

    staleTime: 0,
    gcTime: 0,
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
        error: null,
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

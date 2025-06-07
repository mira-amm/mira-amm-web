import {useQueries} from "@tanstack/react-query";
import {type BN, bn} from "fuels";
import {CoinData} from "../utils/coinsConfig";
import {useReadonlyMira} from ".";
import useRoutablePools from "./useRoutablePools";
import {useMemo} from "react";
import {Route} from "./useGetPoolsWithReserve";
import type {ReadonlyMiraAmm} from "mira-dex-ts";

export enum TradeState {
  LOADING,
  INVALID,
  NO_ROUTE_FOUND,
  VALID,
  REEFETCHING,
}

export enum TradeType {
  EXACT_IN = "EXACT_IN",
  EXACT_OUT = "EXACT_OUT",
}

type OptimialTrade = {
  bestRoute: null | Route;
  amountIn: null | BN;
  amountOut: null | BN;
};

type SwapPreviewState = {
  tradeState: TradeState;
  trade: OptimialTrade | undefined;
  error: string | null;
};

const getSwapQuotes = (
  inputAmount: BN,
  tradeType: TradeType,
  route: Route,
  miraAmm: ReadonlyMiraAmm,
) => {
  if (tradeType === TradeType.EXACT_IN) {
    return miraAmm.previewSwapExactInput(
      {bits: route.assetIn.assetId},
      inputAmount,
      route.pools.map((p) => p.poolId),
    );
  }

  return miraAmm.previewSwapExactOutput(
    {bits: route.assetOut.assetId},
    inputAmount,
    route.pools.map((p) => p.poolId),
  );
};

const useSwapRouter = (
  tradeType: TradeType,
  amountSpecified: BN = bn(0),
  assetIn?: CoinData,
  assetOut?: CoinData,
): SwapPreviewState => {
  const miraAmm = useReadonlyMira();

  const shouldFetchPools = useMemo(() => {
    return !!assetIn && !!assetOut && amountSpecified.gt(0);
  }, [assetIn, assetOut, amountSpecified]);

  const {
    isLoading: isRoutesLoading,
    routes,
    isRefetching: isRoutesRefetching,
  } = useRoutablePools(assetIn, assetOut, shouldFetchPools);

  // Prioritize top 5 routes using a simple reserve heuristic (assumes larger reserves = better)
  const prioritizedRoutes = useMemo(() => {
    if (!routes || !routes.length) return [];

    return [...routes]
      .map((r) => ({
        route: r,
        totalReserves: r.pools.reduce(
          (sum, p) => sum + Number(p.reserve0 || 0) + Number(p.reserve1 || 0),
          0,
        ),
      }))
      .sort((a, b) => b.totalReserves - a.totalReserves)
      .slice(0, 5)
      .map((r) => r.route);
  }, [routes]);

  const {
    data: quoteResults,
    isLoading,
    isRefetching,
  } = useQueries({
    queries:
      prioritizedRoutes.length && miraAmm && shouldFetchPools
        ? prioritizedRoutes.map((route) => ({
            queryFn: () =>
              getSwapQuotes(amountSpecified, tradeType, route, miraAmm),
            queryKey: [
              "swap-route-quote",
              route,
              tradeType,
              amountSpecified.toString(),
              assetIn?.assetId,
              assetOut?.assetId,
            ],
          }))
        : [],
    combine: (results) => ({
      isRefetching: results.some((r) => r.isRefetching),
      data: results.map((r, i) =>
        r.data
          ? {
              amountOut: r.data[1],
              route: prioritizedRoutes[i],
            }
          : undefined,
      ),
      pending: results.some((r) => r.isPending),
      isLoading: results.some((r) => r.isLoading),
      isSuccess: results.every((r) => r.isSuccess),
    }),
  });

  return useMemo(() => {
    if (isLoading || isRoutesLoading)
      return {
        tradeState: TradeState.LOADING,
        trade: undefined,
        error: null,
      };

    if (!assetIn || !assetOut)
      return {
        tradeState: TradeState.INVALID,
        trade: undefined,
        error: null,
      };

    if (!quoteResults.length)
      return {
        tradeState: TradeState.NO_ROUTE_FOUND,
        trade: undefined,
        error: amountSpecified.gt(0)
          ? "No route found for this trade"
          : null,
      };

    const {bestRoute, amountIn, amountOut} = quoteResults.reduce<{
      bestRoute: null | Route;
      amountIn: null | BN;
      amountOut: null | BN;
    }>(
      (currentBest, quote) => {
        if (!quote) return currentBest;

        if (tradeType === TradeType.EXACT_IN) {
          if (
            currentBest.amountOut === null ||
            currentBest.amountOut.lt(quote.amountOut)
          ) {
            return {
              bestRoute: quote.route,
              amountIn: amountSpecified,
              amountOut: quote.amountOut,
            };
          }
        } else {
          if (
            currentBest.amountIn === null ||
            currentBest.amountIn.gt(quote.amountOut)
          ) {
            return {
              bestRoute: quote.route,
              amountIn: quote.amountOut,
              amountOut: amountSpecified,
            };
          }
        }

        return currentBest;
      },
      {
        bestRoute: null,
        amountIn: null,
        amountOut: null,
      },
    );

    if (!bestRoute || !amountIn || !amountOut)
      return {
        tradeState: TradeState.INVALID,
        trade: undefined,
        error: "Insufficient reserves in pool",
      };

    if (isRefetching || isRoutesRefetching)
      return {
        tradeState: TradeState.REEFETCHING,
        trade: {
          bestRoute,
          amountIn,
          amountOut,
        },
        error: null,
      };

    return {
      tradeState: TradeState.VALID,
      trade: {
        bestRoute,
        amountIn,
        amountOut,
      },
      error: null,
    };
  }, [
    isLoading,
    isRoutesLoading,
    isRefetching,
    isRoutesRefetching,
    quoteResults,
    tradeType,
    amountSpecified,
    assetIn,
    assetOut,
  ]);
};

export default useSwapRouter;

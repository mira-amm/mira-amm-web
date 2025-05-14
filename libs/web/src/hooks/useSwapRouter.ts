import {skipToken, useQuery} from "@tanstack/react-query";
import {AssetId, type BN, bn} from "fuels";
import type {ReadonlyMiraAmm, Route} from "mira-dex-ts";
import {useMemo} from "react";
import {CoinData} from "../utils/coinsConfig";
import useReadonlyMira from "./useReadonlyMira";
import useRoutablePools from "./useRoutablePools";

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

const getSwapQuote = async (
  amountIn: BN,
  assetIn: AssetId,
  assetOut: AssetId,
  routes: Route[],
  tradeType: TradeType,
  miraAmm: ReadonlyMiraAmm,
) => {
  if (tradeType === TradeType.EXACT_IN) {
    const poolDatas = await miraAmm.getMultiRouteAmountsOut(
      assetIn,
      amountIn,
      routes,
      assetOut,
    );

    return poolDatas;
  }

  console.log(tradeType, assetIn, assetOut, routes);

  const poolDatas = await miraAmm.getMultiRouteAmountsIn(
    assetOut,
    amountIn,
    routes,
    assetIn,
  );

  console.log(poolDatas, "poolDatas");
  return poolDatas;
};

const useSwapRouter = (
  tradeType: TradeType,
  amountSpecified: BN = bn(0),
  assetIn?: CoinData,
  assetOut?: CoinData,
): SwapPreviewState => {
  const miraAmm = useReadonlyMira();

  const shouldFetchPools = !!assetIn && !!assetOut && amountSpecified.gt(0);

  const {
    isLoading: isRoutesLoading,
    routes,
    isRefetching: isRoutesRefetching,
    // refetch: refetchRoute,
  } = useRoutablePools(assetIn, assetOut, shouldFetchPools);

  const {
    data: quoteResults,
    isLoading,
    isRefetching,
  } = useQuery({
    queryFn:
      routes.length && miraAmm && shouldFetchPools
        ? () =>
            getSwapQuote(
              amountSpecified,
              {bits: assetIn.assetId},
              {bits: assetOut.assetId},
              routes,
              tradeType,
              miraAmm,
            )
        : skipToken,
    queryKey: [
      "swap-route-quote",
      routes.length,
      tradeType,
      amountSpecified.toString(),
      assetIn?.assetId,
      assetOut?.assetId,
    ],
  });

  // find the best route out of all routes
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

    // This can also happen when query throws an error
    if (!quoteResults?.length)
      return {
        tradeState: TradeState.NO_ROUTE_FOUND,
        trade: undefined,
        error: amountSpecified.gt(0) ? "No route found for this trade" : null,
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
            (!quote.amounts[1].isZero() && currentBest.amountOut === null) ||
            (!quote.amounts[1].isZero() &&
              currentBest.amountOut !== null &&
              currentBest.amountOut.lt(quote.amounts[1]))
          )
            return {
              bestRoute: quote.route,
              amountIn: amountSpecified,
              amountOut: quote.amounts[1],
            };
        } else {
          if (
            (currentBest.amountIn === null && !quote.amounts[1].isZero()) ||
            (currentBest.amountIn !== null &&
              currentBest.amountIn.gt(quote.amounts[1]) &&
              !quote.amounts[1].isZero())
          ) {
            return {
              bestRoute: quote.route,
              amountIn: quote.amounts[1],
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

    // Situation of no liquidity
    if (!bestRoute || !amountIn || !amountOut)
      return {
        tradeState: TradeState.INVALID,
        trade: undefined,
        error: "Insufficient reserves in pool",
      };

    // When refetching, return the previous route
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
    assetIn,
    assetOut,
    quoteResults,
    isRefetching,
    isRoutesRefetching,
    tradeType,
    amountSpecified,
  ]);
};

export default useSwapRouter;

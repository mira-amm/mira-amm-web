import { useQueries, useQuery } from "@tanstack/react-query";
import { type BN, bn } from "fuels";
import { CoinData } from "../utils/coinsConfig";
import { useReadonlyMira } from ".";
import useRoutablePools from "./useRoutablePools";
import { useMemo } from "react";
import { Route } from "./useGetPoolsWithReserve";
import type { Asset, ReadonlyMiraAmm } from "mira-dex-ts";

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

type SwapPreviewState = {
  tradeState: TradeState;
  trade: {
    bestRoute: null | Route;
    amountIn: null | BN;
    amountOut: null | BN;
  } | undefined;
  error: string | null;
};

type Quote = {
  outputAmount?: BN,
  inputAmount?: BN,
  tradeType: TradeType,
  route: Route,
  asset: Asset,
}

const getSwapQuotesBatch = (
  inputAmount: BN,
  tradeType: TradeType,
  routes: Route[],
  miraAmm: ReadonlyMiraAmm,
) => {
  if (tradeType === TradeType.EXACT_IN) {
    return miraAmm.previewSwapExactInputBatch(
      // TODO: not production code
      { bits: routes[0].assetIn.assetId },
      inputAmount,
      routes.map((route) => route.pools.map((p) => p.poolId)),
    );
  }

  return miraAmm.previewSwapExactOutputBatch(
    { bits: routes[0].assetOut.assetId },
    inputAmount,
    routes.map((route) => route.pools.map((p) => p.poolId)),
  );
}

export function useSwapRouter(
  tradeType: TradeType,
  amountSpecified: BN = bn(0),
  assetIn?: CoinData,
  assetOut?: CoinData,
): SwapPreviewState {
  const miraAmm = useReadonlyMira();

  const shouldFetchPools = useMemo(() => {
    return !!assetIn && !!assetOut && amountSpecified.gt(0);
  }, [assetIn, assetOut, amountSpecified]);

  const {
    isLoading: isRoutesLoading,
    routes,
    isRefetching: isRoutesRefetching,
  } = useRoutablePools(assetIn, assetOut, shouldFetchPools);

  const {
    data: quoteResults,
    isLoading,
    isRefetching
  } = useQuery(
    {
      queryKey: [
        routes,
        tradeType,
        amountSpecified.toString(),
        assetIn?.assetId,
        assetOut?.assetId,
      ],
      queryFn: () => {
        if (!miraAmm) {
          return []
        }
        return getSwapQuotesBatch(
          amountSpecified,
          tradeType,
          routes,
          miraAmm
        ).then((result) => (
          result.map((asset, index) => ({
            route: routes[index],
            asset,
            tradeType,
            outputAmount: tradeType === TradeType.EXACT_IN ? amountSpecified : undefined,
            inputAmount: tradeType === TradeType.EXACT_OUT ? amountSpecified : undefined,
          })) as Quote[]
        ))
      },
      initialData: []
    }
  )

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

    const { bestRoute, amountIn, amountOut } = quoteResults.reduce<{
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
        tradeState: TradeState.REFETCHING,
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

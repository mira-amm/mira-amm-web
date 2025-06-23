import { useQuery } from "@tanstack/react-query";
import { type BN, type AssetId, bn } from "fuels";
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

type Quote = Promise<{
  route: Route,
  amountIn: BN,
  amountOut: BN,
  assetIdIn: AssetId,
  assetIdOut: AssetId,
  tradeType: TradeType,
}[]>

const getSwapQuotesBatch = async (
  providedAmount: BN,
  tradeType: TradeType,
  routes: Route[],
  miraAmm: ReadonlyMiraAmm,
): Quote => {
  if (tradeType === TradeType.EXACT_IN) {
    const returnOne = (await miraAmm.previewSwapExactInputBatch(
      { bits: routes[0].assetIn.assetId },
      providedAmount,
      routes.map((route) => route.pools.map((p) => p.poolId)),
    )).map((asset: Asset, index: number)=> ({
     tradeType,
      route: routes[index],
      assetIn: routes[index].assetIn.assetId,
      assetOut: routes[index].assetOut.assetId,
      amountIn: providedAmount,
      amountOut: asset[1]
    }));

    return returnOne;
  }

  const returnTwo = (await miraAmm.previewSwapExactOutputBatch(
    { bits: routes[0].assetOut.assetId },
    providedAmount,
    routes.map((route) => route.pools.map((p) => p.poolId)),
    )).map((asset: Asset, index: number)=> ({
     tradeType,
      route: routes[index],
      assetIn: routes[index].assetIn.assetId,
      assetOut: routes[index].assetOut.assetId,
      amountIn: asset[1],
      amountOut: providedAmount,
    }));

  return returnTwo;
}

export function useSwapRouter(
  tradeType: TradeType,
  amountSpecified: BN = bn(0),
  assetIn?: CoinData,
  assetOut?: CoinData,
): {
  tradeState: TradeState;
  trade: {
    bestRoute: null | Route;
    amountIn: null | BN;
    amountOut: null | BN;
  } | undefined;
  error: string | null;
} {
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
        "routes",
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
        )
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

        if (
          tradeType === TradeType.EXACT_IN &&
          quote.amountOut !== undefined &&
          (currentBest.amountOut === null || currentBest.amountOut.lt(quote.amountOut))
        ) {
          return {
            bestRoute: quote.route,
            amountIn: quote.amountIn,
            amountOut: quote.amountOut,
          };
        } else if (
          tradeType === TradeType.EXACT_OUT &&
          quote.amountIn !== undefined &&
          (currentBest.amountIn === null || currentBest.amountIn.gt(quote.amountIn))
        ) {
          return {
            bestRoute: quote.route,
            amountIn: quote.amountIn,
            amountOut: quote.amountOut,
          };
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

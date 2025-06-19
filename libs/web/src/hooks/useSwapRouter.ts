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

const getSwapQuotes = (
  inputAmount: BN,
  tradeType: TradeType,
  route: Route,
  miraAmm: ReadonlyMiraAmm,
) => {
  console.log('gettingSwapQuotesFor', route);
  if (tradeType === TradeType.EXACT_IN) {
    return miraAmm.previewSwapExactInput(
      { bits: route.assetIn.assetId },
      inputAmount,
      route.pools.map((p) => p.poolId),
    );
  }

  return miraAmm.previewSwapExactOutput(
    { bits: route.assetOut.assetId },
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
    console.log('prioritizing routes')
    if (!routes || !routes.length) return [];

    const rts = [...routes]
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

    console.log('prioritized routes')
    return rts;
  }, [routes]);

  // TODO: Consider bringing routing off chain, try to avoid calls to the fuel node.
  // State needs to be re-created and indexed. State can become stale.
  // Need to consider indexing performance, as indexer is also now making routing decisions.
  // Right now we're doing single simulation per-request.
  // There's a middle ground. Fuel has script transactions.
  // Script transactions allow creating multicalls without modifying contracts in a single RPC request.
  // We can create small script that does this simulation of the swap in order to get the quote across each pool.
  // Instead of making a contract call per RPC request, we can lump them all into single script request (also called multicall), then we can return array of quotes and find correct route through array of quotes. This is the quick and dierty method. We're not changing any business logic, we're just reducing the number of round trips.
  //
  //
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


  // const {
  //   data: quoteResults,
  //   isLoading,
  //   isRefetching,
  // } = useQueries({
  //   queries:
  //     prioritizedRoutes.length && miraAmm && shouldFetchPools
  //       ? prioritizedRoutes.map((route) => ({
  //         queryFn: () =>
  //           getSwapQuotes(amountSpecified, tradeType, route, miraAmm),
  //         queryKey: [
  //           "swap-route-quote",
  //           route.pools.map((pool) => pool.poolId).join('->'),
  //           tradeType,
  //           amountSpecified.toString(),
  //           assetIn?.assetId,
  //           assetOut?.assetId,
  //         ],
  //       }))
  //       : [],
  //   combine: (results) => ({
  //     isRefetching: results.some((r) => r.isRefetching),
  //     data: results.map((r, i) =>
  //       r.data
  //         ? {
  //           amountOut: r.data[1],
  //           route: prioritizedRoutes[i],
  //         }
  //         : undefined,
  //     ),
  //     pending: results.some((r) => r.isPending),
  //     isLoading: results.some((r) => r.isLoading),
  //     isSuccess: results.every((r) => r.isSuccess),
  //   }),
  // });

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

import {useQueries} from "@tanstack/react-query";
import {type BN, bn} from "fuels";
import {CoinData} from "../utils/coinsConfig";
import useReadonlyMira from "./useReadonlyMira";
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

type OptimialRoute = {
  bestRoute: null | Route;
  amountIn: null | BN;
  amountOut: null | BN;
};

type SwapPreviewState = {
  tradeState: TradeState;
  trade: OptimialRoute | undefined;
};

const getSwapQuotes = (
  inputAmount: BN,
  tradeType: TradeType,
  route: Route,
  miraAmm: ReadonlyMiraAmm,
) => {
  return miraAmm.previewSwapExactInput(
    {
      bits: route.assetIn.assetId,
    },
    inputAmount,
    route.pools.map((pool) => pool.poolId),
  );
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
    refetch: refetchRoute,
  } = useRoutablePools(assetIn, assetOut, shouldFetchPools);

  // TESTING EFFECT , has to be removed
  //   useEffect(() => {
  //     const getSwapQuote = async () => {
  //       if (!miraAmm || !assetIn || !rawAmountIn || !routes.length) return;
  //       console.log(routes, "routes");
  //       const [route] = routes;
  //       try {
  //         const data = await miraAmm.previewSwapExactInput(
  //           {bits: route.assetIn.assetId},
  //           rawAmountIn,
  //           route.pools.map((pool) => pool.poolId),
  //         );

  //         console.log(data.toString(), "data");
  //       } catch (err) {
  //         console.log(err);
  //       }
  //     };

  //     getSwapQuote();
  //   }, [routes]);

  const {
    data: quoteResults,
    isLoading,
    isRefetching,
  } = useQueries({
    queries:
      routes.length && miraAmm && shouldFetchPools
        ? routes.map((route) => ({
            queryFn: () =>
              getSwapQuotes(amountSpecified, tradeType, route, miraAmm),
            queryKey: ["swap-route-quote", route, tradeType],
          }))
        : [],
    combine: (results) => ({
      isRefetching: results.some((result) => result.isRefetching),
      data: results.map((result, idx) =>
        result.data
          ? {
              amountOut: result.data[1],
              route: routes[idx],
            }
          : undefined,
      ),
      pending: results.some((result) => result.isPending),
      isLoading: results.some((result) => result.isLoading),
      isSuccess: results.every((result) => result.isSuccess),
    }),
  });

  // find the best route out of all routes
  return useMemo(() => {
    if (isLoading || isRoutesLoading)
      return {
        tradeState: TradeState.LOADING,
        trade: undefined,
      };

    if (!assetIn || !assetOut || !quoteResults.length)
      return {
        tradeState: TradeState.INVALID,
        trade: undefined,
      };

    const {bestRoute, amountIn, amountOut} = quoteResults.reduce<{
      bestRoute: null | Route;
      amountIn: null | BN;
      amountOut: null | BN;
    }>(
      (currentBest, quote) => {
        if (!quote) return currentBest;
        // TODO: currently only handled the exactInput case
        if (
          currentBest.amountOut === null ||
          currentBest.amountOut.lt(quote.amountOut)
        )
          return {
            bestRoute: quote.route,
            amountIn: amountSpecified,
            amountOut: quote.amountOut,
          };
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
        tradeState: TradeState.NO_ROUTE_FOUND,
        trade: undefined,
      };

    if (isRefetching || isRoutesRefetching)
      return {
        tradeState: TradeState.REEFETCHING,
        trade: {
          bestRoute,
          amountIn,
          amountOut,
        },
      };

    return {
      tradeState: TradeState.VALID,
      trade: {
        bestRoute,
        amountIn,
        amountOut,
      },
    };
  }, [
    assetIn,
    assetOut,
    isLoading,
    isRefetching,
    isRoutesLoading,
    isRoutesRefetching,
    quoteResults,
    amountSpecified,
  ]);
};

export default useSwapRouter;

import {useQueries} from "@tanstack/react-query";
import {bn} from "fuels";
import {CoinData} from "../utils/coinsConfig";
import useReadonlyMira from "./useReadonlyMira";
import useRoutablePools from "./useRoutablePools";

// TODO: The input params are set for testing only, has to be updated with proper swap state
const useSwapRouter = (
  assetIn?: CoinData,
  assetOut?: CoinData,
  amountIn?: string,
) => {
  const miraAmm = useReadonlyMira();

  const rawAmountIn = amountIn
    ? bn.parseUnits(amountIn, assetIn?.decimals)
    : bn(0);

  const shouldFetchPools = !!assetIn && !!assetOut && rawAmountIn.gt(0);

  const {isLoading, routes} = useRoutablePools(
    assetIn,
    assetOut,
    shouldFetchPools,
  );

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

  const {data} = useQueries({
    queries:
      routes.length && miraAmm && shouldFetchPools
        ? routes.map((route) => ({
            queryFn: () =>
              miraAmm.previewSwapExactInput(
                {
                  bits: route.assetIn.assetId,
                },
                rawAmountIn,
                route.pools.map((pool) => pool.poolId),
              ),
            queryKey: ["swap-route-quote", route.pools.join("-")],
          }))
        : [],
    combine: (results) => ({
      data: results,
      pending: results.some((result) => result.isPending),
      isLoading: results.some((result) => result.isLoading),
      isSuccess: results.every((result) => result.isSuccess),
    }),
  });

  // uncombined result
  console.log(data, "swap quotes");
};

export default useSwapRouter;

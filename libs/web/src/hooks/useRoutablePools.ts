import {useMemo} from "react";
import type {PoolId} from "mira-dex-ts";
import {useAllAssetsCombination, useGetPoolsWithReserve} from "@/src/hooks";
import type {CoinData} from "../utils/coinsConfig";
import {computeAllRoutes, getPoolIdCombinations} from "./get-routable-pools";

export function useRoutablePools(
  assetIn?: CoinData,
  assetOut?: CoinData,
  shouldFetchPools = false
) {
  const pairs = useAllAssetsCombination(assetIn, assetOut);

  const poolKeys = useMemo(() => getPoolIdCombinations(pairs), [pairs]);

  const {pools, isLoading, isRefetching, refetch} = useGetPoolsWithReserve(
    poolKeys,
    assetIn,
    assetOut,
    shouldFetchPools
  );

  const routes = useMemo(() => {
    if (!pools || !assetIn || !assetOut) return [];
    return computeAllRoutes(assetIn, assetOut, pools, 2);
  }, [pools, assetIn, assetOut]);

  return {
    routes,
    isLoading,
    isRefetching,
    refetch,
  };
}

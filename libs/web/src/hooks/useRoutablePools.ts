"use client";

import {useMemo} from "react";
import type {PoolId} from "mira-dex-ts";
import {bn, BN} from "fuels";
import {
  useAllAssetsCombination,
  useGetPoolsWithReserve,
  useV2PoolsForPair,
} from "@/src/hooks";
import type {CoinData} from "../utils/coinsConfig";
import {computeAllRoutes, getPoolIdCombinations} from "./get-routable-pools";
import type {Pool} from "./useGetPoolsWithReserve";

export function useRoutablePools(
  assetIn?: CoinData,
  assetOut?: CoinData,
  shouldFetchPools = false,
  poolType: "v1" | "v2" = "v1"
) {
  const pairs = useAllAssetsCombination(assetIn, assetOut);

  const poolKeys = useMemo(() => getPoolIdCombinations(pairs), [pairs]);

  // V1 pools from contract
  const {
    pools: v1Pools,
    isLoading: v1Loading,
    isRefetching: v1Refetching,
    refetch: v1Refetch,
  } = useGetPoolsWithReserve(
    poolKeys,
    assetIn,
    assetOut,
    shouldFetchPools && poolType === "v1"
  );

  // V2 pools from indexer
  const {pools: v2PoolsData, isLoading: v2Loading} = useV2PoolsForPair(
    assetIn,
    assetOut,
    shouldFetchPools && poolType === "v2"
  );

  // Convert V2 pools to Pool format
  const v2Pools = useMemo<Pool[]>(() => {
    if (!v2PoolsData || !assetIn || !assetOut) {
      return [];
    }

    const converted = v2PoolsData.map((pool) => {
      // Get full asset data, preserving decimals and other metadata
      const asset0 =
        pool.asset0.id === assetIn.assetId
          ? assetIn
          : pool.asset0.id === assetOut.assetId
            ? assetOut
            : {...assetIn, assetId: pool.asset0.id, symbol: pool.asset0.symbol};

      const asset1 =
        pool.asset1.id === assetOut.assetId
          ? assetOut
          : pool.asset1.id === assetIn.assetId
            ? assetIn
            : {
                ...assetOut,
                assetId: pool.asset1.id,
                symbol: pool.asset1.symbol,
              };

      // Convert the large pool ID string to BN
      // The pool ID from indexer is in the 'id' field, not 'poolId'
      const poolIdBN = new BN(pool.id);

      return {
        poolId: poolIdBN,
        assetA: asset0,
        assetB: asset1,
        isStable: false,
      };
    });

    return converted;
  }, [v2PoolsData, assetIn, assetOut]);

  // Use the appropriate pools based on poolType
  const pools = poolType === "v2" ? v2Pools : v1Pools;
  const isLoading = poolType === "v2" ? v2Loading : v1Loading;
  const isRefetching = poolType === "v2" ? false : v1Refetching;

  const routes = useMemo(() => {
    if (!pools || !assetIn || !assetOut) {
      return [];
    }
    return computeAllRoutes(assetIn, assetOut, pools, 2);
  }, [pools, assetIn, assetOut, poolType]);

  return {
    routes,
    isLoading,
    isRefetching,
    refetch: v1Refetch,
  };
}

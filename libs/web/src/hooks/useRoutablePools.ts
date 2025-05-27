import {useMemo} from "react";
import {CoinData} from "../utils/coinsConfig";
import {useAllAssetsCombination} from "./useAllAssetsCombination";
import {buildPoolId, PoolId, Route} from "mira-dex-ts";
import useGetPoolsWithReserve from "./useGetPoolsWithReserve";
import {AssetId} from "fuels";

const involvesAssetInPool = (pool: PoolId, asset: AssetId): boolean => {
  return pool[0].bits === asset.bits || pool[1].bits === asset.bits;
};

const poolEquals = (poolA: PoolId, poolB: PoolId): boolean => {
  return poolA === poolB || poolA.every((id, index) => id === poolB[index]);
};

function computeAllRoutes(
  assetIn: AssetId,
  assetOut: AssetId,
  pools: PoolId[],
  currentPath: PoolId[] = [],
  allPaths: Route[] = [],
  startAssetIn: AssetId = assetIn,
  maxHops = 2, // maximum number of intermediate assets (or pools) allowed for the swap
): Route[] {
  if (!assetIn || !assetOut) throw new Error("Missing tokenIn/tokenOut");

  for (const pool of pools) {
    if (
      !involvesAssetInPool(pool, assetIn) ||
      currentPath.find((pathPool) => poolEquals(pool, pathPool))
    )
      continue;

    const outputToken = pool[0].bits === assetIn.bits ? pool[1] : pool[0];
    if (outputToken.bits === assetOut.bits) {
      allPaths.push({
        pools: [...currentPath, pool],
      }); // pools and tokenIn and tokenOut for each route
    } else if (maxHops > 1) {
      computeAllRoutes(
        outputToken,
        assetOut,
        pools,
        [...currentPath, pool],
        allPaths,
        startAssetIn,
        maxHops - 1,
      );
    }
  }

  return allPaths;
}

const useRoutablePools = (
  assetIn?: CoinData,
  assetOut?: CoinData,
  shouldFetchPools = false,
) => {
  const allAssetsCombination = useAllAssetsCombination(assetIn, assetOut);

  const allAssetsPairsWithPoolId: [CoinData, CoinData, PoolId, boolean][] =
    useMemo(
      () =>
        allAssetsCombination.flatMap(([assetA, assetB]) => [
          [
            assetA,
            assetB,
            buildPoolId(assetA.assetId, assetB.assetId, true),
            true, // stable pool
          ],
          [
            assetA,
            assetB,
            buildPoolId(assetA.assetId, assetB.assetId, false),
            false, // volatile pool
          ],
        ]),
      [allAssetsCombination],
    );

  const {pools, isLoading, isRefetching, refetch} = useGetPoolsWithReserve(
    allAssetsPairsWithPoolId,
    assetIn,
    assetOut,
    shouldFetchPools,
  );

  const routes = useMemo(() => {
    if (!pools || !assetIn || !assetOut) return [];

    const routes = computeAllRoutes(
      {bits: assetIn.assetId},
      {bits: assetOut.assetId},
      pools,
      [],
      [],
      {bits: assetIn.assetId},
      2,
    );

    return routes;
  }, [assetIn, assetOut, pools]);

  return {
    isRefetching,
    refetch,
    routes,
    isLoading,
  };
};

export default useRoutablePools;

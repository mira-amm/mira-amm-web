import {useMemo} from "react";
import {CoinData} from "../utils/coinsConfig";
import {useAllAssetsCombination} from "./useAllAssetsCombination";
import {buildPoolId, PoolId} from "mira-dex-ts";
import {useGetPoolsWithReserve, Pool, Route} from "./useGetPoolsWithReserve";

const involvesAssetInPool = (pool: Pool, asset: CoinData): boolean =>
  pool.assetA.assetId === asset.assetId ||
  pool.assetB.assetId === asset.assetId;

const poolEquals = (poolA: Pool, poolB: Pool): boolean => {
  return (
    poolA === poolB ||
    poolA.poolId.every((id, index) => id === poolB.poolId[index])
  );
};

function computeAllRoutes(
  assetIn: CoinData,
  assetOut: CoinData,
  pools: Pool[],
  currentPath: Pool[] = [],
  allPaths: Route[] = [],
  startAssetIn: CoinData = assetIn,
  maxHops = 2,
): Route[] {
  if (!assetIn || !assetOut) throw new Error("Missing tokenIn/tokenOut");

  for (const pool of pools) {
    if (
      !involvesAssetInPool(pool, assetIn) ||
      currentPath.find((pathPool) => poolEquals(pool, pathPool))
    )
      continue;

    const outputToken =
      pool.assetA.assetId === assetIn.assetId ? pool.assetB : pool.assetA;

    if (outputToken.assetId === assetOut.assetId) {
      allPaths.push({
        pools: [...currentPath, pool],
        assetIn: startAssetIn,
        assetOut,
      });
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
    useMemo(() => {
      const seen = new Set<string>();

      return allAssetsCombination.flatMap(([assetA, assetB]) => {
        const result: [CoinData, CoinData, PoolId, boolean][] = [];

        const poolIdStable = buildPoolId(assetA.assetId, assetB.assetId, true);
        const poolIdVolatile = buildPoolId(
          assetA.assetId,
          assetB.assetId,
          false,
        );

        const stableKey = `${assetA.assetId}-${assetB.assetId}-true`;
        const volatileKey = `${assetA.assetId}-${assetB.assetId}-false`;

        if (!seen.has(stableKey)) {
          seen.add(stableKey);
          result.push([assetA, assetB, poolIdStable, true]);
        }

        if (!seen.has(volatileKey)) {
          seen.add(volatileKey);
          result.push([assetA, assetB, poolIdVolatile, false]);
        }

        return result;
      });
    }, [allAssetsCombination]);

  const {pools, isLoading, isRefetching, refetch} = useGetPoolsWithReserve(
    allAssetsPairsWithPoolId,
    assetIn,
    assetOut,
    shouldFetchPools,
  );

  const routes = useMemo(() => {
    if (!pools || !assetIn || !assetOut) return [];

    return computeAllRoutes(assetIn, assetOut, pools, [], [], assetIn, 2);
  }, [pools, assetIn, assetOut]);

  return {
    isRefetching,
    refetch,
    routes,
    isLoading,
  };
};

export default useRoutablePools;

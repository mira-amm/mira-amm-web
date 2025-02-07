import {useMemo} from "react";
import {CoinData} from "../utils/coinsConfig";
import {useAllAssetsCombination} from "./useAllAssetsCombination";
import {buildPoolId, PoolId} from "mira-dex-ts";
import useGetPools from "./useMultiPools";

const useRoutablePools = (assetIn?: CoinData, assetOut?: CoinData) => {
  const allAssetsCombination = useAllAssetsCombination(assetIn, assetOut);

  const allAssetsPairsWithPoolId: [CoinData, CoinData, PoolId, boolean][] =
    useMemo(
      () =>
        allAssetsCombination.flatMap(([assetA, assetB]) => [
          [
            assetA,
            assetB,
            buildPoolId(assetA.assetId, assetB.assetId, true),
            true, // specifies stable pool or not
          ],
          [
            assetA,
            assetB,
            buildPoolId(assetA.assetId, assetB.assetId, false),
            false, // specifies stable pool or not
          ],
        ]),
      [allAssetsCombination],
    );

  useGetPools(allAssetsPairsWithPoolId);
};

export default useRoutablePools;

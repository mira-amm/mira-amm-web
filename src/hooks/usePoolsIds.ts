import {useMemo} from "react";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {buildPoolId, PoolId} from "mira-dex-ts";

const usePoolsIds = () => {
  return useMemo(() => {
    const coinsArray = Array.from(coinsConfig.values());
    const assetIds = coinsArray.map(coin => coin.assetId);
    const poolsIds: PoolId[] = [];

    for (let i = 0; i < assetIds.length; i++) {
      for (let j = i + 1; j < assetIds.length; j++) {
        const poolId = buildPoolId(assetIds[i], assetIds[j], false);
        poolsIds.push(poolId);
      }
    }

    return poolsIds;
  }, []);
};

export default usePoolsIds;

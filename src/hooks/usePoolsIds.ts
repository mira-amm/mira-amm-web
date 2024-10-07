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
        const volatilePoolId = buildPoolId(assetIds[i], assetIds[j], false);
        poolsIds.push(volatilePoolId);
        const stablePoolId = buildPoolId(assetIds[i], assetIds[j], true);
        poolsIds.push(stablePoolId);
      }
    }

    return poolsIds;
  }, []);
};

export default usePoolsIds;

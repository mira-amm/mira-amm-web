import {useMemo} from "react";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {buildPoolId, getLPAssetId, PoolId} from "mira-dex-ts";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";
import {AssetId} from "fuels";

const usePoolsIdsWithLpAssetIds = () => {
  return useMemo(() => {
    const coinsArray = Array.from(coinsConfig.values());
    const assetIds = coinsArray.map(coin => coin.assetId);
    const poolsIds: [PoolId, AssetId][] = [];

    for (let i = 0; i < assetIds.length; i++) {
      for (let j = i + 1; j < assetIds.length; j++) {
        const volatilePoolId = buildPoolId(assetIds[i], assetIds[j], false);
        const volatilePoolLpTokenAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, volatilePoolId);
        poolsIds.push([volatilePoolId, volatilePoolLpTokenAssetId]);
        const stablePoolId = buildPoolId(assetIds[i], assetIds[j], true);
        const stablePoolLpTokenAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, stablePoolId);
        poolsIds.push([stablePoolId, stablePoolLpTokenAssetId]);
      }
    }

    return poolsIds;
  }, []);
};

export default usePoolsIdsWithLpAssetIds;

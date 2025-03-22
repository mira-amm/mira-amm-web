import {useMemo} from "react";
import {PoolData} from "@/src/hooks/usePoolsData";
import {DefaultLocale} from "@/src/utils/constants";
import {createPoolIdFromIdString, createPoolKey} from "@/src/utils/common";

export function usePoolDetails(poolData: PoolData) {
  const poolId = createPoolIdFromIdString(poolData.id);
  const poolKey = createPoolKey(poolId);
  const isStablePool = poolId[2];
  const feeText = isStablePool ? "0.05%" : "0.3%";
  const poolDescription = `${isStablePool ? "Stable" : "Volatile"}: ${feeText}`;

  const {aprValue, volumeValue, tvlValue} = useMemo(() => {
    let aprValue = "n/a";
    let volumeValue = "n/a";
    let tvlValue = "n/a";

    if (poolData.details) {
      const {apr, volume, tvl} = poolData.details;

      if (apr && apr > 0) {
        aprValue = `${apr.toLocaleString(DefaultLocale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}%`;
      }
      if (volume && parseFloat(volume) > 0) {
        volumeValue = `$${parseFloat(volume).toLocaleString(DefaultLocale, {
          maximumFractionDigits: 0,
        })}`;
      }
      if (tvl && tvl > 0) {
        tvlValue = `$${tvl.toLocaleString(DefaultLocale, {
          maximumFractionDigits: 0,
        })}`;
      }
    }

    return {aprValue, volumeValue, tvlValue};
  }, [poolData]);

  return {
    poolId,
    poolKey,
    aprValue,
    volumeValue,
    tvlValue,
    poolDescription,
    isStablePool,
  };
}

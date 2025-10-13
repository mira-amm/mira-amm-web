import {useMemo} from "react";
import {bn} from "fuels";
import {PoolData} from "@/src/hooks/usePoolsData";
import {DefaultLocale} from "@/src/utils/constants";
import {createPoolIdFromIdString, createPoolKey} from "@/src/utils/common";

// Check if pool ID is V2 format (numeric) vs V1 format (dash-separated)
function isV2Pool(poolId: string): boolean {
  return !poolId.includes("-");
}

export function usePoolDetails(poolData: PoolData) {
  // Detect pool version and handle accordingly
  const isV2 = isV2Pool(poolData.id);

  // For V1 pools: use the existing logic
  // For V2 pools: use the numeric ID directly
  const poolId = isV2 ? bn(poolData.id) : createPoolIdFromIdString(poolData.id);
  const poolKey = isV2 ? poolData.id : createPoolKey(poolId);

  // Extract asset IDs for display (needed for CoinPair component)
  const asset0Id = isV2 ? poolData.details.asset0Id : (poolId as any)[0].bits;
  const asset1Id = isV2 ? poolData.details.asset1Id : (poolId as any)[1].bits;

  // V2 pools don't have stable/volatile distinction
  const isStablePool = isV2 ? false : (poolId as any)[2];
  const feeText = isV2 ? "Variable" : isStablePool ? "0.05%" : "0.3%";
  const poolDescription = isV2
    ? "Concentrated Liquidity"
    : `${isStablePool ? "Stable" : "Volatile"}: ${feeText}`;

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
    asset0Id,
    asset1Id,
    aprValue,
    volumeValue,
    tvlValue,
    poolDescription,
    isStablePool,
  };
}

import {useMemo} from "react";
import {useSearchParams} from "next/navigation";
import {
  detectPoolType,
  parsePoolKey,
  type UnifiedPoolId,
} from "@/src/utils/poolTypeDetection";

export type ConcentrationType = "regular" | "concentrated";

export type UsePoolConcentrationTypeResult = {
  poolType: ConcentrationType;
  poolId?: UnifiedPoolId;
};

export function usePoolConcentrationType(): UsePoolConcentrationTypeResult {
  const searchParams = useSearchParams();
  const poolKey = searchParams.get("pool");

  return {
    poolType: "concentrated"
  }

  return useMemo<UsePoolConcentrationTypeResult>(() => {
    try {
      if (!poolKey) return {poolType: "regular"};
      const unifiedPoolId = parsePoolKey(poolKey);
      const version = detectPoolType(unifiedPoolId);
      return {
        poolType: version === "v2" ? "concentrated" : "regular",
        poolId: unifiedPoolId,
      };
    } catch {
      return {poolType: "regular"};
    }
  }, [poolKey]);
}

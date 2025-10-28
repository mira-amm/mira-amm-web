import {usePoolAPR, useUnifiedPoolsMetadata} from "@/src/hooks";
import {DefaultLocale} from "@/src/utils/constants";
import {UnifiedPoolId} from "@/src/utils/poolTypeDetection";

export const usePoolInfo = (poolId: UnifiedPoolId) => {
  const {apr} = usePoolAPR(poolId);
  // Use unified metadata to support both V1 and V2 pools
  const {unifiedPoolsMetadata, unifiedPoolsMetadataPending} =
    useUnifiedPoolsMetadata([poolId]);
  const poolMetadata = unifiedPoolsMetadata?.[0];

  const aprValue =
    apr !== undefined
      ? apr.apr.toLocaleString(DefaultLocale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;

  const tvlValue = apr?.tvlUSD;

  // Check if pool is empty using unified metadata (works for both V1 and V2)
  const emptyPool = Boolean(
    poolMetadata?.reserves?.x.eq(0) && poolMetadata?.reserves?.y.eq(0)
  );

  return {
    apr,
    aprValue,
    tvlValue,
    emptyPool,
    poolMetadata,
    isLoadingMetadata: unifiedPoolsMetadataPending,
  };
};

import {PoolId} from "mira-dex-ts";
import {usePoolAPR, usePoolsMetadata} from "@/src/hooks";
import {DefaultLocale} from "@/src/utils/constants";

export const usePoolInfo = (poolId: PoolId) => {
  const {apr} = usePoolAPR(poolId);
  const {poolsMetadata} = usePoolsMetadata([poolId]);

  const aprValue =
    apr !== undefined
      ? apr.apr.toLocaleString(DefaultLocale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;

  const tvlValue = apr?.tvlUSD;

  const emptyPool = Boolean(
    poolsMetadata?.[0]?.reserve0.eq(0) && poolsMetadata?.[0].reserve1.eq(0)
  );

  return {
    apr,
    aprValue,
    tvlValue,
    emptyPool,
    poolsMetadata,
  };
};

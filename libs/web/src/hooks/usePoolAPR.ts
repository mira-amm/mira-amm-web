import {PoolId} from "mira-dex-ts";
import {createPoolIdString} from "@/src/utils/common";
import {usePoolAPR as useIndexerPoolAPR, usePoolReserves} from "@/indexer";

export function usePoolAPR(pool: PoolId) {
  const poolIdString = createPoolIdString(pool);

  const {data: aprData, isPending} = useIndexerPoolAPR(poolIdString);
  const {data: reservesData} = usePoolReserves(poolIdString);

  const result =
    aprData && reservesData
      ? {
          apr: aprData,
          tvlUSD: "0", // Would need to get from pool stats
          reserve0: parseFloat(reservesData.reserve0Decimal) || 0,
          reserve1: parseFloat(reservesData.reserve1Decimal) || 0,
        }
      : undefined;

  return {apr: result, isPending};
}

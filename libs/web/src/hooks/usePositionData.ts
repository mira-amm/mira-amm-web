import {bn} from "fuels";
import {getLPAssetId, PoolId} from "mira-dex-ts";
import {useQuery} from "@tanstack/react-query";
import { useReadonlyMira, useBalances } from "@/src/hooks";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";

export function usePositionData({pool}: {
  pool: PoolId;
}){
  const mira = useReadonlyMira();
  const lpTokenAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, pool);
  const {balances} = useBalances();

  const lpTokenBalance =
    balances?.find((balance) => balance.assetId === lpTokenAssetId.bits)
      ?.amount || bn(0);

  const shouldFetch = Boolean(mira) && Boolean(lpTokenBalance);

  const {data} = useQuery({
    queryKey: ["position", pool, lpTokenBalance],
    queryFn: () => mira?.getLiquidityPosition(pool, lpTokenBalance!),
    enabled: shouldFetch,
  });

  return {assets: data, lpTokenBalance};
};


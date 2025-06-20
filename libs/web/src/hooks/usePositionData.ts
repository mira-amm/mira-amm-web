import { useReadonlyMira } from "@/src/hooks";
import {useQuery} from "@tanstack/react-query";
import {getLPAssetId, PoolId} from "mira-dex-ts";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";
import { useBalances } from "@/src/hooks";
import {bn} from "fuels";

type Props = {
  pool: PoolId;
};

const usePositionData = ({pool}: Props) => {
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

export default usePositionData;

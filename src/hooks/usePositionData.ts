import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import {useQuery} from "@tanstack/react-query";
import {getLPAssetId, PoolId} from "mira-dex-ts";
import useBalances from "@/src/hooks/useBalances/useBalances";
import {bn} from "fuels";
import useContractId from "./useContractId";

type Props = {
  pool: PoolId;
};

const usePositionData = ({pool}: Props) => {
  const mira = useReadonlyMira();
  const {balances} = useBalances();
  const contractId = useContractId();

  const lpTokenAssetId = getLPAssetId(contractId, pool);

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

import usePoolsIds from "@/src/hooks/usePoolsIds";
import {getLPAssetId} from "mira-dex-ts";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";
import {useQuery} from "@tanstack/react-query";
import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import useBalances from "@/src/hooks/useBalances/useBalances";
import {BN} from "fuels";
import {useMemo} from "react";

const usePositions = () => {
  const mira = useReadonlyMira();
  const pools = usePoolsIds();
  const { balances } = useBalances();

  const poolsWithLp = useMemo(() => pools.filter(pool => {
    if (!balances) {
      return [];
    }

    const lpAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, pool);
    const lpBalance = balances.find(balance => balance.assetId === lpAssetId.bits)?.amount;
    return lpBalance !== undefined && lpBalance.toNumber() > 0;
  }), [pools, balances]);

  const miraExists = Boolean(mira);

  const shouldFetch = miraExists && poolsWithLp.length > 0;

  const { data, isLoading } = useQuery({
    queryKey: ['positions', poolsWithLp, balances],
    queryFn: async () => {
      const positionInfoPromises = poolsWithLp.map(async (pool) => {
        const lpAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, pool);
        const lpBalance = balances?.find(balance => balance.assetId === lpAssetId.bits)?.amount ?? new BN(0);
        const position = await mira?.getLiquidityPosition(pool, lpBalance);
        return { ...position, lpBalance };
      });

      return Promise.all(positionInfoPromises);
    },
    enabled: shouldFetch,
  });

  return { data, isLoading };
};

export default usePositions;

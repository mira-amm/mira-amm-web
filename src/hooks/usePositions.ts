import usePoolsIdsWithLpAssetIds from "@/src/hooks/usePoolsIdsWithLpAssetIds";
import {PoolId} from "mira-dex-ts";
import {useQuery} from "@tanstack/react-query";
import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import useBalances from "@/src/hooks/useBalances/useBalances";
import {AssetId} from "fuels";
import {useMemo} from "react";

type PoolDataWithLpBalance = [PoolId, AssetId, number];

const usePositions = () => {
  const mira = useReadonlyMira();
  const poolsData = usePoolsIdsWithLpAssetIds();
  const { balances } = useBalances();

  const nonZeroLpBalancePoolsData = useMemo(() => {
    if (!balances) {
      return [];
    }

    return poolsData.reduce((accumulatedPoolsData, poolData) => {
      const [, lpAssetId] = poolData;
      const lpBalance = balances.find(balance => balance.assetId === lpAssetId.bits)?.amount;
      if (!lpBalance) {
        return accumulatedPoolsData;
      }

      const poolDataWithLpBalance: PoolDataWithLpBalance = [poolData[0], poolData[1], lpBalance.toNumber()];
      return [...accumulatedPoolsData, poolDataWithLpBalance];
    }, [] as PoolDataWithLpBalance[]);
  }, [poolsData, balances]);

  const miraExists = Boolean(mira);

  const shouldFetch = miraExists && nonZeroLpBalancePoolsData.length > 0;

  const { data, isLoading } = useQuery({
    queryKey: ['positions', nonZeroLpBalancePoolsData, balances],
    queryFn: async () => {
      const positionInfoPromises = nonZeroLpBalancePoolsData.map(async (poolDataWithBalance) => {
        const [pool, , lpBalance] = poolDataWithBalance;
        const position = await mira?.getLiquidityPosition(pool, lpBalance);
        return { ...position, lpBalance, isStablePool: pool[2] };
      });

      return Promise.all(positionInfoPromises);
    },
    enabled: shouldFetch,
  });

  return { data, isLoading };
};

export default usePositions;

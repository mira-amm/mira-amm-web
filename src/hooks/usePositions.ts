import usePoolsIds from "@/src/hooks/usePoolsIds";
import {getLPAssetId} from "mira-dex-ts";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";
import {useQuery} from "@tanstack/react-query";
import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import useBalances from "@/src/hooks/useBalances/useBalances";

const usePositions = () => {
  const mira = useReadonlyMira();
  const pools = usePoolsIds();
  const { balances } = useBalances();

  const miraExists = Boolean(mira);

  const { data } = useQuery({
    queryKey: ['positions', pools, balances],
    queryFn: async () => {
      const positionInfoPromises = pools.map(async (pool) => {
        const lpAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, pool);
        const lpBalance = balances?.find(balance => balance.assetId === lpAssetId.bits)?.amount ?? 0;
        const position = await mira?.getLiquidityPosition(pool, lpBalance);
        return { ...position, lpBalance };
      });

      return Promise.all(positionInfoPromises);
    },
    enabled: miraExists,
  });

  return { data };
};

export default usePositions;

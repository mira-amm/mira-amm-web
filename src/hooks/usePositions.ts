import usePoolsIds from "@/src/hooks/usePoolsIds";
import {getLPAssetId} from "mira-dex-ts";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";
import {useQuery} from "@tanstack/react-query";
import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import useBalances from "@/src/hooks/useBalances/useBalances";
import {BN} from "fuels";

const usePositions = () => {
  const mira = useReadonlyMira();
  const pools = usePoolsIds();
  const { balances } = useBalances();

  const poolsWithLp = pools.filter(pool => {
    const lpAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, pool);
    const lpBalance = balances?.find(balance => balance.assetId === lpAssetId.bits)?.amount;
    return lpBalance !== undefined && lpBalance.toNumber() > 0;
  })

  const miraExists = Boolean(mira);

  const { data, isPending } = useQuery({
    queryKey: ['positions', poolsWithLp, balances],
    queryFn: async () => {
      const positionInfoPromises = poolsWithLp.map(async (pool) => {
        console.log('pool', pool);
        const lpAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, pool);
        const lpBalance = balances?.find(balance => balance.assetId === lpAssetId.bits)?.amount ?? new BN(0);
        console.log('lpBalance', lpBalance);
        const position = await mira?.getLiquidityPosition(pool, lpBalance);
        console.log('position', position);
        return { ...position, lpBalance };
      });

      return Promise.all(positionInfoPromises);
    },
    enabled: miraExists,
  });

  return { data, isPending };
};

export default usePositions;

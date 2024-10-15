import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import {PoolId} from "mira-dex-ts";
import {useQuery} from "@tanstack/react-query";

type Props = {
  pools: PoolId[] | undefined;
  assetName: CoinName;
}

const useReservesPrice = ({pools, assetName}: Props) => {
  const miraAmm = useReadonlyMira();

  const assetId = coinsConfig.get(assetName)?.assetId;

  const shouldFetch = Boolean(pools) && Boolean(miraAmm) && Boolean(assetId);

  const { data } = useQuery({
    queryKey: ['reservesPrice', assetId, pools],
    queryFn: async () => {
      const [rate, decimalsIn, decimalsOut] = await miraAmm!.getCurrentRate({ bits: assetId! }, pools!);
      return rate * (10 ** (decimalsOut ?? 0)) / (10 ** (decimalsIn ?? 0));
    },
    enabled: shouldFetch,
  });

  return { reservesPrice: data };
};

export default useReservesPrice;

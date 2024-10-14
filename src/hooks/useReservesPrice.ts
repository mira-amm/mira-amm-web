import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import {PoolId} from "mira-dex-ts";
import {useQuery} from "@tanstack/react-query";

type Props = {
  pools: PoolId[] | undefined;
  sellAssetName: CoinName;
}

const useReservesPrice = ({ pools, sellAssetName }: Props) => {
  const miraAmm = useReadonlyMira();

  const sellAssetId = coinsConfig.get(sellAssetName)?.assetId;

  const shouldFetch = Boolean(pools) && Boolean(miraAmm) && Boolean(sellAssetId);

  const { data } = useQuery({
    queryKey: ['reservesPrice', sellAssetId, pools],
    queryFn: async () => {
      const [rate, decimalsIs, decimalsOut] = await miraAmm!.getCurrentRate({ bits: sellAssetId! }, pools!);
      return rate * (10 ** (decimalsIs ?? 0)) / (10 ** (decimalsOut ?? 0));
    },
    enabled: shouldFetch,
  });

  return { reservesPrice: data };
};

export default useReservesPrice;

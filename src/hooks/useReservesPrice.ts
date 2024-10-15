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
  const assetDecimals = coinsConfig.get(assetName)?.decimals;

  const shouldFetch = Boolean(pools) && Boolean(miraAmm) && Boolean(assetId);

  const { data } = useQuery({
    queryKey: ['reservesPrice', assetId, pools],
    queryFn: async () => {
      const assetInputAmount = 1000;
      const [outputAsset, previewPrice] = await miraAmm!.previewSwapExactInput({bits: assetId!}, assetInputAmount, pools!);
      const outputAssetDecimals = coinsConfig.values().find(v => v.assetId === outputAsset.bits)?.decimals;
      return previewPrice.toNumber() / assetInputAmount * (10 ** (assetDecimals ?? 0)) / (10 ** (outputAssetDecimals ?? 0));
    },
    enabled: shouldFetch,
  });

  return { reservesPrice: data };
};

export default useReservesPrice;

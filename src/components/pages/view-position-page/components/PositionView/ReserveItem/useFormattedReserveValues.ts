import {useAssetPriceFromIndexer} from "@/src/hooks/useAssetPriceFromIndexer";
import {formatDisplayAmount} from "@/src/utils/common";

export const useFormattedReserveValues = (
  assetId: string,
  amount: string,
  reserve: number | undefined,
) => {
  const {price} = useAssetPriceFromIndexer(assetId);
  const usdPrice = parseFloat(price.toFixed(2));

  const valueOfAsset = usdPrice && reserve ? usdPrice * reserve : 0;

  const usdValue = valueOfAsset.toFixed(2);

  return {
    usdValue,
    coinAmount: formatDisplayAmount(amount),
  };
};

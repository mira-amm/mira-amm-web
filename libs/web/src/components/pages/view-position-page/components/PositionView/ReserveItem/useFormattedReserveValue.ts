import {useAssetPriceFromIndexer} from "@/src/hooks/useAssetPriceFromIndexer";
import {formatDisplayAmount} from "@/src/utils/common";
import {formatMoney} from "@/src/utils/formatMoney";

export const useFormattedReserveValue = (
  assetId: string,
  amount: string,
  reserve: number | undefined,
) => {
  const {price: usdPrice} = useAssetPriceFromIndexer(assetId);

  const valueOfAsset = reserve ? usdPrice * reserve : 0;

  const usdValue = formatMoney(valueOfAsset);

  return {
    usdValue,
    coinAmount: formatDisplayAmount(amount),
  };
};

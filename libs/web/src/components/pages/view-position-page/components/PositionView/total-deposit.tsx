import {useAssetPriceFromIndexer} from "@/src/hooks";
import {formatMoney} from "@/src/utils/formatMoney";

export const TotalDeposit = ({
  title = "Deposit balance:",
  assetAId,
  assetAmount,
  assetBId,
  assetBmount,
}: {
  title?: string;
  assetAId: string;
  assetAmount: string;
  assetBId: string;
  assetBmount: string;
}) => {
  const {price: usdPrice} = useAssetPriceFromIndexer(assetAId);
  const valueOfAssetA = usdPrice ? usdPrice * parseFloat(assetAmount) : 0;
  const {price: usdPriceB} = useAssetPriceFromIndexer(assetBId);
  const valueOfAssetB = usdPrice ? usdPriceB * parseFloat(assetBmount) : 0;

  const usdValue = formatMoney(valueOfAssetA + valueOfAssetB);

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-center justify-between text-content-tertiary">
        <p>{title}</p>
        <p className="font-alt">{usdValue}</p>
      </div>
    </div>
  );
};

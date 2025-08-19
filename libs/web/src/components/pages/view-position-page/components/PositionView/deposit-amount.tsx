import {useAssetPriceFromIndexer} from "@/src/hooks/useAssetPriceFromIndexer";
import {formatDisplayAmount} from "@/src/utils/common";
import {CoinWithAmount, Loader} from "@/src/components/common";
import {formatMoney} from "@/src/utils/formatMoney";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";

export function DepositAmount({
  assetId,
  amount,
}: {
  assetId: string;
  amount: string;
}) {
  const {price: usdPrice} = useAssetPriceFromIndexer(assetId);
  const valueOfAsset = usdPrice ? usdPrice * parseFloat(amount) : 0;
  const usdValue = formatMoney(valueOfAsset);

  return (
    <div className="flex items-center justify-between">
      <CoinWithAmount
        assetId={assetId}
        amount={formatDisplayAmount(amount)}
        withName
      />
      {usdValue ? (
        <div className="flex flex-col items-end gap-y-2">
          <p className=" text-[18px] leading-[21px] font-alt">{amount}</p>
          <p className="opacity-64 font-normal text-[15px] leading-[18px] font-alt">
            {usdValue === "NaN" ? "~0" : usdValue}
          </p>
        </div>
      ) : (
        <Loader color="gray" rebrand={getIsRebrandEnabled()} />
      )}
    </div>
  );
}

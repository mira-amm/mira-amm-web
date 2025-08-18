import {useAssetPriceFromIndexer} from "@/src/hooks/useAssetPriceFromIndexer";
import {formatDisplayAmount} from "@/src/utils/common";
import {CoinWithAmount, Loader} from "@/src/components/common";
import {formatMoney, formatNumber} from "@/src/utils/formatMoney";

const useFormattedReserveValue = (
  assetId: string,
  amount: string,
  reserve: number | undefined
) => {
  const {price: usdPrice} = useAssetPriceFromIndexer(assetId);
  const valueOfAsset = reserve && usdPrice ? usdPrice * reserve : 0;
  const usdValue = formatMoney(valueOfAsset);
  return {
    usdValue,
    coinAmount: formatDisplayAmount(amount),
  };
};

export function ReserveItem({
  assetId,
  amount,
  reserve,
}: {
  assetId: string;
  amount: string;
  reserve: number | undefined;
}) {
  const {usdValue, coinAmount} = useFormattedReserveValue(
    assetId,
    amount,
    reserve
  );

  return (
    <div className="flex items-center justify-between">
      <CoinWithAmount assetId={assetId} amount={coinAmount} withName />
      {usdValue && reserve !== undefined ? (
        <div className="flex flex-col items-end gap-y-2">
          <p className=" text-[18px] leading-[21px] font-alt">
            {formatNumber(reserve)}
          </p>
          <p className="opacity-64 font-normal text-[15px] leading-[18px] font-alt">
            {usdValue === "NaN" ? "~0" : usdValue}
          </p>
        </div>
      ) : (
        <Loader />
      )}
    </div>
  );
}

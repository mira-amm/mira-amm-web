import React from "react";
import {CoinWithAmount} from "@/src/components/common";
import {useFormattedReserveValue} from "./useFormattedReserveValue";
import {Loader} from "@/src/components/common";

interface ReserveItemsProps {
  assetId: string;
  amount: string;
  reserve: number | undefined;
}

const ReserveItem = ({assetId, amount, reserve}: ReserveItemsProps) => {
  const {usdValue, coinAmount} = useFormattedReserveValue(
    assetId,
    amount,
    reserve,
  );

  return (
    <div className="flex items-center justify-between">
      <CoinWithAmount assetId={assetId} amount={coinAmount} withName />
      {usdValue && reserve ? (
        <div className="flex flex-col items-end">
          <p className="font-medium text-[18px] leading-[21px]">
            {Number(reserve?.toFixed(2)).toLocaleString()}
          </p>
          <p className="opacity-64 font-normal text-[15px] leading-[18px]">
            ${usdValue === "NaN" ? "~0" : usdValue}
          </p>
        </div>
      ) : (
        <Loader color="gray" />
      )}
    </div>
  );
};

export default ReserveItem;

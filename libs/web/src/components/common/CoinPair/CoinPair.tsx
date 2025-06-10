import {clsx} from "clsx";
import {memo} from "react";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import {B256Address} from "fuels";
import {useAssetMetadata} from "@/src/hooks";

type Props = {
  firstCoin: B256Address;
  secondCoin: B256Address;
  isStablePool: boolean;
  withFee?: boolean;
  withFeeBelow?: boolean;
  withPoolDescription?: boolean;
};

const CoinPair = ({
  firstCoin,
  secondCoin,
  isStablePool,
  withFee,
  withFeeBelow,
  withPoolDescription,
}: Props) => {
  const firstCoinIcon = useAssetImage(firstCoin);
  const secondCoinIcon = useAssetImage(secondCoin);
  const {symbol: firstSymbol} = useAssetMetadata(firstCoin);
  const {symbol: secondSymbol} = useAssetMetadata(secondCoin);

  const feeText = isStablePool ? "0.05%" : "0.3%";
  const poolDescription = `${isStablePool ? "Stable" : "Volatile"}: ${feeText}`;

  return (
    <div
      className={clsx("flex gap-2 items-center", withFeeBelow && "items-start")}
    >
      <div className="flex items-center w-16 h-9">
        {firstCoinIcon && (
          <img
            src={firstCoinIcon}
            className="w-full h-full rounded-full"
          />
        )}
        {secondCoinIcon && (
          <img
            src={secondCoinIcon}
            className="-ml-2 w-full h-full rounded-full"
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        {firstSymbol && secondSymbol ? (
          <p
            className="font-medium text-[14px] leading-[16px] lg:text-[16px] lg:leading-[19px]"
            data-identifier="coin-pair"
          >
            {firstSymbol}/{secondSymbol}
          </p>
        ) : (
          <p className="text-[14px] text-muted">loading...</p>
        )}

        {withFeeBelow && (
          <p className="text-xs leading-[14px] text-content-tertiary lg:text-sm lg:leading-[16px]">
            {feeText}
          </p>
        )}

        {withPoolDescription && (
          <p className="text-xs leading-[14px] text-[#d4b226]">
            {poolDescription}
          </p>
        )}
      </div>

      {withFee && (
        <p className="text-xs leading-[14px] text-content-tertiary lg:text-sm lg:leading-[16px]">
          {feeText}
        </p>
      )}
    </div>
  );
};

export default memo(CoinPair);

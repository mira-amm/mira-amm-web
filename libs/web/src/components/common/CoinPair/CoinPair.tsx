import {clsx} from "clsx";
import {memo} from "react";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import {B256Address} from "fuels";
import {useAssetMetadata} from "@/src/hooks";
import Image from "next/image";

type PoolType = "v1-volatile" | "v1-stable" | "v2-concentrated";

type Props = {
  firstCoin: B256Address;
  secondCoin: B256Address;
  isStablePool: boolean;
  withFee?: boolean;
  withFeeBelow?: boolean;
  withPoolDescription?: boolean;
  poolType?: PoolType;
  binStep?: number;
  baseFactor?: number;
};

const CoinPair = ({
  firstCoin,
  secondCoin,
  isStablePool,
  withFee,
  withFeeBelow,
  withPoolDescription,
  poolType,
  binStep,
  baseFactor,
}: Props) => {
  const firstCoinIcon = useAssetImage(firstCoin);
  const secondCoinIcon = useAssetImage(secondCoin);
  const {symbol: firstSymbol} = useAssetMetadata(firstCoin);
  const {symbol: secondSymbol} = useAssetMetadata(secondCoin);

  // Calculate pool description based on pool type
  const getPoolDescription = () => {
    if (poolType === "v2-concentrated") {
      // For V2 pools, show base fee and bin steps
      const baseFee =
        binStep && baseFactor
          ? ((binStep * baseFactor) / 10000).toFixed(2) + "%"
          : "Variable";
      const binStepDisplay = binStep ? `${binStep} steps` : "Custom";
      return `Concentrated: ${baseFee}, ${binStepDisplay}`;
    } else {
      // For V1 pools, show traditional volatile/stable
      const feeText = isStablePool ? "0.05%" : "0.3%";
      return `${isStablePool ? "Stable" : "Volatile"}: ${feeText}`;
    }
  };

  const feeText = isStablePool ? "0.05%" : "0.3%";
  const poolDescription = getPoolDescription();

  return (
    <div
      className={clsx("flex gap-2 items-center", withFeeBelow && "items-start")}
    >
      <div className="flex items-center w-16 h-9">
        {firstCoinIcon && (
          <div className="relative w-full h-full">
            <Image
              src={firstCoinIcon}
              fill
              className="rounded-full object-cover"
              alt={`${firstSymbol} icon`}
            />
          </div>
        )}
        {secondCoinIcon && (
          <div className="relative w-full h-full -ml-2">
            <Image
              src={secondCoinIcon}
              fill
              className="rounded-full object-cover"
              alt={`${secondSymbol} icon`}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {firstSymbol && secondSymbol ? (
          <p className="text-base leading-[16px]" data-identifier="coin-pair">
            {firstSymbol}/{secondSymbol}
          </p>
        ) : (
          <p className="text-sm text-muted">loading...</p>
        )}

        {withFeeBelow && (
          <p className="text-sm leading-[14px] text-content-tertiary lg:text-sm">
            {feeText}
          </p>
        )}

        {withPoolDescription && (
          <p className="text-sm leading-[14px] text-accent-alert">
            {poolDescription}
          </p>
        )}
      </div>

      {withFee && (
        <p className="text-sm leading-[14px] text-content-tertiary">
          {feeText}
        </p>
      )}
    </div>
  );
};

export default memo(CoinPair);

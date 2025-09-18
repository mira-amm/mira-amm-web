import {clsx} from "clsx";
import {memo} from "react";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import {B256Address} from "fuels";
import {useAssetMetadata} from "@/src/hooks";
import Image from "next/image";
import {PoolType} from "../PoolTypeIndicator";

type Props = {
  firstCoin: B256Address;
  secondCoin: B256Address;
  isStablePool: boolean;
  withFee?: boolean;
  withFeeBelow?: boolean;
  withPoolDescription?: boolean;
  withPoolDetails?: boolean;
  poolType?: PoolType;
};

const poolTypeConfig = {
  "v1-volatile": {
    label: "Volatile",
    shortLabel: "V1",
    fee: "0.30%",
    description: "Traditional AMM pool for volatile asset pairs",
  },
  "v1-stable": {
    label: "Stable",
    shortLabel: "V1S",
    fee: "0.05%",
    description: "Optimized for stable asset pairs with lower fees",
  },
  "v2-concentrated": {
    label: "Concentrated",
    shortLabel: "V2",
    fee: "Variable",
    description: "Concentrated liquidity with customizable price ranges",
  },
};

const CoinPair = ({
  firstCoin,
  secondCoin,
  isStablePool,
  withFee,
  withFeeBelow,
  withPoolDescription,
  withPoolDetails,
  poolType,
}: Props) => {
  const firstCoinIcon = useAssetImage(firstCoin);
  const secondCoinIcon = useAssetImage(secondCoin);
  const {symbol: firstSymbol} = useAssetMetadata(firstCoin);
  const {symbol: secondSymbol} = useAssetMetadata(secondCoin);

  const feeText = isStablePool ? "0.05%" : "0.3%";
  const poolDescription = `${isStablePool ? "Stable" : "Volatile"}: ${feeText}`;

  const config = poolTypeConfig[poolType ?? "v1-volatile"];

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

        {withPoolDetails && (
          <div className="flex gap-1">
            <span className="rounded-lg bg-background-secondary px-2 py-0.5 text-content-tertiary text-xs font-medium">
              {config.shortLabel}
            </span>
            <span className="rounded-lg bg-background-secondary px-2 py-0.5 text-content-tertiary text-xs font-medium">
              {config.label}
            </span>
            <span className="rounded-lg bg-background-secondary px-2 py-0.5 text-content-tertiary text-xs font-medium font-alt">
              {feeText}
            </span>
          </div>
        )}
      </div>

      {withFee && (
        <p className="text-sm leading-[14px] text-content-tertiary font-alt">
          {feeText}
        </p>
      )}
    </div>
  );
};

export default memo(CoinPair);

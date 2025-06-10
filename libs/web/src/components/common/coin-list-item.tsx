"use client";

import {clsx} from "clsx";
import {BN, CoinQuantity} from "fuels";

import {CoinDataWithPrice} from "@/src/utils/coinsConfig";
import {Tooltip} from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import {CircleCheck} from "lucide-react";

export function CoinListItem({
  assetData,
}: {
  assetData: Omit<CoinDataWithPrice, "price"> & {
    userBalance?: CoinQuantity;
  };
}) {
  const {isVerified, userBalance} = assetData;
  const balanceValue = userBalance?.amount ?? new BN(0);
  const fallbackIcon = useAssetImage(
    !assetData?.icon ? assetData.assetId : null,
  );

  return (
    <span
      className={clsx(
        "flex gap-2 text-content-primary",
        !assetData?.name && "items-center",
      )}
    >
      <Tooltip id="verified-tooltip" />

      <img
        src={assetData.icon || fallbackIcon}
        fetchPriority="high"
        className="w-7 h-7 lg:w-8 lg:h-8 rounded-full"
      />

      <div className="flex flex-col flex-1 gap-1">
        <div className="flex items-start">
          <p className="text-base font-normal leading-[22px]">
            {assetData.symbol}
          </p>
          {isVerified && (
            <span
              className="ml-[3px] mt-[2px] inline-flex items-center justify-center w-6 h-6 rounded-full"
              data-tooltip-id="verified-tooltip"
              data-tooltip-content="Verified asset from Fuel's official asset list."
            >
              <CircleCheck className="size-4 text-lime-400" />
            </span>
          )}
        </div>
        <p className="text-sm leading-4 text-content-dimmed-light">
          {assetData.name}
        </p>
      </div>

      {balanceValue.gt(0) && (
        <p className="text-sm leading-4 text-content-dimmed-dark">
          {balanceValue.formatUnits(assetData.decimals || 0)}
        </p>
      )}
    </span>
  );
}

"use client";

import {useState, useEffect} from "react";
import {clsx} from "clsx";
import {useBoostedApr, RewardsToken} from "@/src/hooks/useBoostedApr";
import {isMobile} from "react-device-detect";
import {Loader} from "@/src/components/common";
import {EPOCH_NUMBER} from "@/src/utils/constants";
import {PointsIcon} from "@/meshwave-ui/icons";
import {cn} from "@/src/utils/cn";
import {BrandText} from "@/src/components/common";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/meshwave-ui/tooltip";

export function AprBadge({
  aprValue,
  small,
  leftAlignValue,
  poolKey,
  tvlValue,
  background,
}: {
  aprValue: string | null;
  small?: boolean;
  leftAlignValue?: string;
  poolKey: string;
  tvlValue: number;
  background: "overlay-1" | "overlay-5" | "overlay-9" | "black";
}) {
  const {boostedApr, boostReward, rewardsToken} = useBoostedApr(
    poolKey,
    tvlValue,
    EPOCH_NUMBER
  );

  const aprValueInNumber = aprValue
    ? parseFloat(aprValue.match(/[0-9.]+/)?.[0] || "0")
    : 0;

  const showApr = aprValue
    ? (boostedApr + aprValueInNumber).toFixed(2)
    : boostedApr.toFixed(2);

  let aprElement = <>{showApr}%</>;

  if (rewardsToken === "$FUEL") {
    aprElement = boostedApr ? <>{showApr}%</> : <Loader />;
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          className={cn(
            "relative flex items-center gap-[5px] rounded-lg cursor-pointer",
            "justify-center",
            small
              ? "min-w-[76px] py-[5px] px-[8px]"
              : "min-w-[96px] py-[7px] px-[10px] ml-[10px]",
            background === "overlay-1" &&
              "bg-[url('/images/overlay-1.jpg')] bg-cover",
            background === "overlay-5" &&
              "bg-[url('/images/overlay-5.jpg')] bg-cover",
            background === "overlay-9" &&
              "bg-[url('/images/overlay-9.jpg')] bg-cover",
            background === "black" && "bg-black bg-cover"
          )}
        >
          <span className="flex items-center justify-center text-white text-[19px] w-[15px] h-[15px]">
            <PointsIcon />
          </span>
          <span
            className={clsx(
              "text-white whitespace-normal break-words font-alt",
              small
                ? "text-[13px] leading-[16px]"
                : "text-base leading-[19.36px]"
            )}
          >
            {aprElement}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="font-alt p-[25px] max-w-[292px]">
        <AprLabel
          rewardsToken={rewardsToken}
          boostedApr={boostedApr}
          boostReward={boostReward}
          baseApr={aprValue || "0"}
          aprElement={aprElement}
        />
      </TooltipContent>
    </Tooltip>
  );
}

const LabelMap: Record<
  Exclude<RewardsToken, undefined>,
  {
    label: React.ReactNode;
    description: string;
  }
> = {
  $FUEL: {
    label: "Boost Rewards ($FUEL)",
    description: "Boost rewards ($FUEL) per day distributed among LPs in pool",
  },
  Points: {
    label: <BrandText microchain="Microchain Points" />,
    description: "distributed amount LPs in pool per day",
  },
};

export function AprLabel({
  rewardsToken,
  boostedApr,
  boostReward,
  baseApr,
  aprElement,
}: {
  rewardsToken: RewardsToken;
  boostedApr: number;
  boostReward: number;
  baseApr: string;
  aprElement: React.ReactNode;
}) {
  if (!rewardsToken) return null;

  const {label, description} = LabelMap[rewardsToken];

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex justify-between gap-[10px]">
        <span className="text-base leading-[19.36px] text-white text-left">
          Swap fees
        </span>
        <span className="text-base leading-[19.36px] text-white text-left font-alt">
          {baseApr}
        </span>
      </div>
      <div>
        <div className="flex justify-between gap-[10px]">
          <span className="text-base leading-[19.36px] text-white text-left">
            {label}
          </span>
          {boostedApr === 0 ? (
            <span className="text-base leading-[19.36px] text-white text-left font-alt">
              {boostReward.toLocaleString()}
            </span>
          ) : (
            <span className="text-base leading-[19.36px] text-white text-left font-alt">
              {boostedApr}%
            </span>
          )}
        </div>
        <p className="text-[10px] opacity-80 w-[70%] text-left leading-[12.1px] text-white text-wrap">
          {boostReward && boostReward.toLocaleString()} {description}
        </p>
      </div>
      {boostedApr !== 0 && (
        <>
          <div className="w-full h-[2px] bg-gradient-to-r from-[#5872fc] via-[#6142ba] to-[#c41cff] shadow-[0_1px_2px_rgba(0,0,0,0.1)]" />
          <div className="flex justify-between gap-[10px]">
            <span className="text-base leading-[19.36px] text-white text-left">
              Total rewards
            </span>
            <span className="text-base leading-[19.36px] text-white text-left">
              {aprElement}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

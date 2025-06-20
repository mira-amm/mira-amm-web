"use client";

import React, {useState, useEffect} from "react";
import {clsx} from "clsx";
import useBoostedApr, {RewardsToken} from "@/src/hooks/useBoostedApr";
import {isMobile} from "react-device-detect";
import {Loader} from "@/src/components/common";
import {EPOCH_NUMBER} from "@/src/utils/constants";
import {PointsIconSimple} from "@/meshwave-ui/icons";

const AprBadge: React.FC<{
  aprValue: string | null;
  small?: boolean;
  leftAlignValue?: string;
  poolKey: string;
  tvlValue: number;
}> = ({aprValue, small, leftAlignValue, poolKey, tvlValue}) => {
  const [isHovered, setIsHovered] = useState(false);

  const {boostedApr, boostReward, rewardsToken} = useBoostedApr(
    poolKey,
    tvlValue,
    EPOCH_NUMBER,
  );

  useEffect(() => {
    if (small && isHovered && isMobile) {
      const handleClickOutside = () => setIsHovered(false);

      document.addEventListener("click", handleClickOutside);

      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [small, isHovered]);

  const aprValueInNumber = aprValue
    ? parseFloat(aprValue.match(/[0-9.]+/)?.[0] || "0")
    : 0;

  const handleMouseEnter = () => !isMobile && setIsHovered(true);
  const handleMouseLeave = () => !isMobile && setIsHovered(false);
  const handleClick = () => isMobile && setIsHovered((prev) => !prev);

  const iconWidth = small ? 15 : 20;
  const iconHeight = small ? 15 : 18;

  const showApr = aprValue
    ? (boostedApr + aprValueInNumber).toFixed(2)
    : boostedApr.toFixed(2);

  let aprElement = <>{showApr}%</>;

  if (rewardsToken === "$FUEL") {
    aprElement = boostedApr ? <>{showApr}%</> : <Loader color="gray" />;
  }

  return (
    <div className="flex items-center gap-[5px]">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={clsx(
          "relative flex items-center gap-[5px] rounded-[10px] cursor-pointer",
          "justify-center bg-black dark:bg-[linear-gradient(170deg,#262f5f_35%,#c41cff_100%)]",
          small
            ? "min-w-[76px] py-[5px] px-[8px]"
            : "min-w-[96px] py-[7px] px-[10px] ml-[10px]",
        )}
      >
        <span className="flex items-center justify-center text-white text-[19px]">
          <PointsIconSimple width={iconWidth} height={iconHeight} />
        </span>
        <span
          className={clsx(
            "text-white whitespace-normal break-words",
            small
              ? "text-[13px] leading-[16px]"
              : "text-[16px] leading-[19.36px]",
          )}
        >
          {aprElement}
        </span>

        {isHovered && (
          <div
            onClick={() => setIsHovered(false)}
            className="absolute top-[140%] left-0 z-[9999] w-[292px] rounded-[10px] p-[25px] text-white text-left shadow-[0_4px_10px_rgba(0,0,0,0.1)] bg-black dark:bg-[linear-gradient(170deg,#262f5f_35%,#c41cff_100%)] flex flex-col gap-[10px]"
            style={{left: leftAlignValue ?? "0"}}
          >
            <AprLabel
              rewardsToken={rewardsToken}
              boostedApr={boostedApr}
              boostReward={boostReward}
              baseApr={aprValue || "0"}
              aprElement={aprElement}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AprBadge;

const LabelMap: Record<
  Exclude<RewardsToken, undefined>,
  {
    label: string;
    description: string;
  }
> = {
  $FUEL: {
    label: "Boost Rewards ($FUEL)",
    description: "Boost rewards ($FUEL) per day distributed among LPs in pool",
  },
  Points: {
    label: "Mira Points",
    description: "distributed amount LPs in pool per day",
  },
};

const AprLabel: React.FC<{
  rewardsToken: RewardsToken;
  boostedApr: number;
  boostReward: number;
  baseApr: string;
  aprElement: React.ReactNode;
}> = ({rewardsToken, boostedApr, boostReward, baseApr, aprElement}) => {
  if (!rewardsToken) {
    return null;
  }

  const {label, description} = LabelMap[rewardsToken];

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex justify-between gap-[10px]">
        <span className="text-[16px] leading-[19.36px] text-white text-left">
          Swap fees
        </span>
        <span className="text-[16px] leading-[19.36px] text-white text-left">
          {baseApr}
        </span>
      </div>
      <div>
        <div className="flex justify-between gap-[10px]">
          <span className="text-[16px] leading-[19.36px] text-white text-left">
            {label}
          </span>
          {boostedApr === 0 ? (
            <span className="text-[16px] leading-[19.36px] text-white text-left">
              {boostReward.toLocaleString()}
            </span>
          ) : (
            <span className="text-[16px] leading-[19.36px] text-white text-left">
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
            <span className="text-[16px] leading-[19.36px] text-white text-left">
              Total rewards
            </span>
            <span className="text-[16px] leading-[19.36px] text-white text-left">
              {aprElement}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

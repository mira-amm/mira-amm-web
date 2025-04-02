import React, {useState, useEffect} from "react";
import styles from "./AprBadge.module.css";
import {clsx} from "clsx";
import useBoostedApr, {RewardsToken} from "@/src/hooks/useBoostedApr";
import {isMobile} from "react-device-detect";
import {EPOCH_NUMBER} from "@/src/utils/constants";
import Image from "next/image";
import SparkleIcon from "@/assets/sparcle.svg";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";

interface AprBadgeProps {
  aprValue: string | null;
  small?: boolean;
  leftAlignValue?: string;
  poolKey: string;
  tvlValue: number;
}

const AprBadge: React.FC<AprBadgeProps> = ({
  aprValue,
  small,
  leftAlignValue,
  poolKey,
  tvlValue,
}) => {
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

  const showApr = aprValue
    ? (boostedApr + aprValueInNumber).toFixed(2)
    : boostedApr.toFixed(2);

  let aprElement = <>{showApr}%</>;

  if (rewardsToken === "$FUEL") {
    aprElement = boostedApr ? (
      <>{showApr}%</>
    ) : (
      <LoadingIndicator fontSize="mc-mono-s" />
    );
  }

  return (
    <div className={clsx(styles.badgeWrapper)}>
      <div
        onMouseEnter={handleMouseEnter} // Desktop hover
        onMouseLeave={handleMouseLeave} // Desktop hover
        onClick={handleClick} // Mobile click
        className={clsx(
          styles.customBadge,
          small ? styles.small : styles.large,
        )}
      >
        <span className={styles.badgeIcon}>
          <Image
            src={SparkleIcon}
            alt="sparkle"
            width={12}
            height={12}
            priority
          />
        </span>
        <span
          className={clsx(styles.badgeText, small ? "mc-mono-s" : "mc-mono-m")}
        >
          {aprElement}
        </span>
        {/*  UI on hover */}
        {isHovered && (
          <div
            onClick={() => setIsHovered(false)}
            className={clsx(styles.hoverUI)}
            style={{left: leftAlignValue ? leftAlignValue : 0}}
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

type RewardsEnhancementLabel = {
  label: string;
  description: string;
};

const LabelMap: Record<
  Exclude<RewardsToken, undefined>,
  RewardsEnhancementLabel
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
    <div className={styles.columns}>
      <div className={styles.row}>
        <span className={styles.label}>Swap fees</span>
        <span className={clsx(styles.value, "mc-mono-m")}>{baseApr}</span>
      </div>
      <div>
        <div className={styles.row}>
          <span className={styles.label}>{label}</span>
          {boostedApr === 0 ? (
            <span className={clsx(styles.value, "mc-mono-m")}>
              {boostReward.toLocaleString()}
            </span>
          ) : (
            <span className={clsx(styles.value, "mc-mono-m")}>
              {boostedApr}%
            </span>
          )}
        </div>
        <p className={clsx(styles.subtext, "mc-type-xs")}>
          {boostReward && boostReward.toLocaleString()} {description}
        </p>
      </div>
      {boostedApr !== 0 && (
        <>
          <div className={styles.divider}></div>
          <div className={styles.row}>
            <span className={styles.label}>Total rewards</span>
            <span className={clsx(styles.value, "mc-mono-m")}>
              {aprElement}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

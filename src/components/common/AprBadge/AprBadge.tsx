import React, {useState, useEffect} from "react";
import styles from "./AprBadge.module.css";
import WhiteStarIcon from "@/src/components/icons/Stars/WhiteStar";
import {clsx} from "clsx";
import useBoostedApr from "@/src/hooks/useBoostedApr";
import {isMobile} from "react-device-detect";
import Loader from "../Loader/Loader";

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

  const {boostedApr, boostReward} = useBoostedApr(poolKey, tvlValue);

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

  const apr = boostedApr ? <>{showApr}%</> : <Loader color="gray" />;

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
          <WhiteStarIcon width={iconWidth} height={iconHeight} />
        </span>
        <span
          className={clsx(
            styles.badgeText,
            small ? styles.smallFont : styles.largeFont,
          )}
        >
          {apr}
        </span>
        {/*  UI on hover */}
        {isHovered && (
          <div
            onClick={() => setIsHovered(false)}
            className={clsx(styles.hoverUI)}
            style={{left: leftAlignValue ? leftAlignValue : 0}}
          >
            <div className={styles.columns}>
              <div className={styles.row}>
                <span className={styles.label}>Swap fees</span>
                <span className={styles.value}>{aprValue}</span>
              </div>
              <div>
                <div className={styles.row}>
                  <span className={styles.label}>Boost rewards ($FUEL)</span>
                  <span className={styles.value}>{boostedApr}%</span>
                </div>
                <p className={styles.subtext}>
                  {boostReward && boostReward.toLocaleString()} $FUEL per day
                  distributed among LPs in pool
                </p>
              </div>
              <div className={styles.divider}></div>
              <div className={styles.row}>
                <span className={styles.label}>Total rewards</span>
                <span className={styles.value}>{apr}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AprBadge;

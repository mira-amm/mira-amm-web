import React, {useState, useEffect} from "react";
import styles from "./AprBadge.module.css";
import WhiteStarIcon from "@/src/components/icons/Stars/WhiteStar";
import {clsx} from "clsx";
import useBoostedApr from "@/src/hooks/useBoostedApr";

interface AprBadgeProps {
  aprValue: string | null;
  small: boolean;
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
  const [isMobile, setIsMobile] = useState(false);

  const {boostedApr, boostReward} = useBoostedApr(poolKey, tvlValue);

  useEffect(() => {
    // Determine if the screen size is mobile
    const mediaQuery = window.matchMedia("(max-width: 800px)");
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile(); // Initial check
    mediaQuery.addEventListener("change", updateIsMobile);

    return () => {
      mediaQuery.removeEventListener("change", updateIsMobile);
    };
  }, []);

  useEffect(() => {
    if (small && isHovered && isMobile) {
      const handleClickOutside = () => setIsHovered(false);

      document.addEventListener("click", handleClickOutside);

      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [small, isHovered, isMobile]);

  const aprValueInNumber = aprValue
    ? parseFloat(aprValue.match(/[0-9.]+/)?.[0] || "0")
    : 0;

  const iconWidth = small ? 15 : 20;
  const iconHeight = small ? 15 : 18;
  return (
    <div
      onMouseEnter={() => {
        if (!isMobile) setIsHovered(true); // Desktop hover
      }}
      onMouseLeave={() => {
        if (!isMobile) setIsHovered(false); // Desktop hover
      }}
      onClick={() => {
        if (isMobile) setIsHovered((prev) => !prev); // Mobile click
      }}
      className={clsx(styles.badgeWrapper)}
    >
      <div
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
          {aprValue
            ? (boostedApr + aprValueInNumber).toFixed(2)
            : boostedApr.toFixed(2)}
          %
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
                <span className={styles.value}>
                  {aprValue
                    ? (boostedApr + aprValueInNumber).toFixed(2)
                    : boostedApr.toFixed(2)}
                  %
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AprBadge;

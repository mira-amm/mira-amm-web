import React, {useState, useEffect} from "react";
import styles from "./AprBadge.module.css";
import WhiteStarIcon from "@/src/components/icons/Stars/WhiteStar";
import {clsx} from "clsx";

interface AprBadgeProps {
  aprValue: string | null;
  small: boolean;
  shouldHover?: boolean;
}

const AprBadge: React.FC<AprBadgeProps> = ({aprValue, small, shouldHover}) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (small && isHovered) {
      const handleClickOutside = () => setIsHovered(false);

      document.addEventListener("click", handleClickOutside);

      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [small, isHovered]);

  const iconWidth = small ? 15 : 20;
  const iconHeight = small ? 15 : 18;
  return (
    <div
      onMouseEnter={() => {
        if (!small) setIsHovered(true); // Desktop
      }}
      onMouseLeave={() => {
        if (!small) setIsHovered(false); // Desktop
      }}
      onClick={() => {
        if (small) setIsHovered((prev) => !prev); // Mobile
      }}
      className={clsx(styles.badgeWrapper)}
    >
      <div
        className={clsx(
          styles.customBadge,
          small ? styles.small : styles.large
        )}
      >
        <span className={styles.badgeIcon}>
          <WhiteStarIcon width={iconWidth} height={iconHeight} />
        </span>
        <span
          className={clsx(
            styles.badgeText,
            small ? styles.smallFont : styles.largeFont
          )}
        >
          {aprValue}
        </span>
        {/*  UI on hover */}
        {isHovered && shouldHover && (
          <div onClick={() => setIsHovered(false)} className={styles.hoverUI}>
            <div className={styles.columns}>
              <div className={styles.row}>
                <span className={styles.label}>Swap fees</span>
                <span className={styles.value}>{aprValue}</span>
              </div>
              <div>
                <div className={styles.row}>
                  <span className={styles.label}>Boost rewards ($FUEL)</span>
                  <span className={styles.value}>10%</span>
                </div>
                <p className={styles.subtext}>
                  1,000 $FUEL per day distributed among LPs in pool
                </p>
              </div>
              <div className={styles.divider}></div>
              <div className={styles.row}>
                <span className={styles.label}>Total rewards</span>
                <span className={styles.value}>
                  {aprValue && !isNaN(parseFloat(aprValue.replace("%", "")))
                    ? (parseFloat(aprValue.replace("%", "")) + 10).toFixed(2)
                    : "10"}
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

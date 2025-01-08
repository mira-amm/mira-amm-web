import styles from "./BoostsRewards.module.css";
import Link from "next/link";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import Info from "@/src/components/common/Info/Info";
import {RewardsIcon} from "@/src/components/icons/Rewards/RewardsIcon";
import BoostsRewardsIcon from "@/src/components/icons/Boosts/BoostsRewardsIcon";
import {BoostsLearnMoreUrl} from "@/src/utils/constants";
import {useEffect, useState} from "react";
import {calculateEpochDuration, calculateUsdValue} from "@/src/utils/common";

const rewardsTooltip =
  "These are the total Fuel tokens earned that will be distributed at the end of the epoch. The exact dollar amount will change based on Fuel’s current price. ";

const epochTooltip =
  "Current epoch lasts for 45 days total. All rewards wll be distributed at the end of the epoch. ";

const fuelAmount = 23000;
const fuelToUsdRate = 0.056057;

const BoostsRewards = () => {
  const [duration, setDuration] = useState("");

  const endDate = "2025-01-15T23:59:59";

  useEffect(() => {
    const updateDuration = () => {
      setDuration(calculateEpochDuration(endDate));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000);

    return () => clearInterval(interval);
  }, [endDate]);

  const usdValue = calculateUsdValue(fuelAmount, fuelToUsdRate);

  return (
    <div className={styles.boosts}>
      <div className={styles.boostsHeader}>
        <div className={styles.boostsTitle}>
          <BoostsRewardsIcon />
          <p>Boost rewards</p>
        </div>
        <Link href={BoostsLearnMoreUrl} target="_blank">
          <ActionButton
            className={styles.learnMoreButton}
            variant="secondary"
            fullWidth
          >
            Learn more
          </ActionButton>
        </Link>
      </div>

      {/* Boosts rewards details */}
      <div className={styles.boostsFallback}>
        <div className={styles.rewardsItem}>
          <div className={styles.rewardsLabel}>
            <p>Rewards earned</p>
            <Info
              tooltipText={rewardsTooltip}
              tooltipKey="rewards"
              color="#D1D4F9"
            />
          </div>

          <div className={styles.rewardsValue}>
            <RewardsIcon />
            <p>{fuelAmount.toLocaleString()} FUEL</p>
            <span>{usdValue}</span>
          </div>
        </div>
        <div className={styles.epochSection}>
          <div className={styles.divider}></div>
          <div className={styles.epochItem}>
            <div className={styles.rewardsLabel}>
              <p>Epoch duration</p>
              <Info
                tooltipText={epochTooltip}
                tooltipKey="epoch"
                color="#D1D4F9"
              />
            </div>
            <p className={styles.epochDuration}>{duration}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoostsRewards;

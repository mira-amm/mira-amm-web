import styles from "./BoostsRewards.module.css";
import Link from "next/link";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import Info from "@/src/components/common/Info/Info";
import {RewardsIcon} from "@/src/components/icons/Rewards/RewardsIcon";
import BoostsRewardsIcon from "@/src/components/icons/Boosts/BoostsRewardsIcon";
import {
  boostsEpochTooltip,
  BoostsLearnMoreUrl,
  BoostsRewardsTooltip,
  endDate,
  RewardsPoolsId,
} from "@/src/utils/constants";
import {useEffect, useState} from "react";
import {
  calculateEpochDuration,
  calculateFuelAmount,
  calculateUsdValue,
} from "@/src/utils/common";
import {useFuelPrice} from "@/src/hooks/useFuelPrice";
import Loader from "@/src/components/common/Loader/Loader";
import {useRewards} from "@/src/hooks/useRewards";
import {useAccount} from "@fuels/react";

// const userId =
//   "0x69e6223f2adf576dfefb21873b78e31ba228b094d05f74f59ea60cbd1bf87d0d";
// const poolIds =
//   "286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b-f8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07-false";
const epochNumbers = 1;

const BoostsRewards = () => {
  const [duration, setDuration] = useState("");

  const {price, isLoading} = useFuelPrice();
  const fuelToUsdRate = price ? parseFloat(price) : 0;

  const {account} = useAccount();

  const {rewardsAmount, isLoading: isRewardsAmountLoading} = useRewards({
    userId: account,
    epochNumbers,
    poolIds: RewardsPoolsId,
  });

  useEffect(() => {
    const updateDuration = () => {
      setDuration(calculateEpochDuration(endDate));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000);

    return () => clearInterval(interval);
  }, []);

  const fuelCount = calculateFuelAmount(rewardsAmount, fuelToUsdRate);
  const usdValue = calculateUsdValue(fuelCount, fuelToUsdRate);

  const loading = isLoading || isRewardsAmountLoading;

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
              tooltipText={BoostsRewardsTooltip}
              tooltipKey="rewards"
              color="#D1D4F9"
            />
          </div>

          {loading ? (
            <Loader />
          ) : (
            <div className={styles.rewardsValue}>
              <RewardsIcon />
              <p>{fuelCount} FUEL</p>
              <span>{usdValue}</span>
            </div>
          )}
        </div>
        <div className={styles.epochSection}>
          <div className={styles.divider}></div>
          <div className={styles.epochItem}>
            <div className={styles.rewardsLabel}>
              <p>Seasons duration</p>
              <Info
                tooltipText={boostsEpochTooltip}
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

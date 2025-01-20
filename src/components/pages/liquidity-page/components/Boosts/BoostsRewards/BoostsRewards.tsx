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
} from "@/src/utils/constants";
import {useEffect, useState} from "react";
import {
  calculateEpochDuration,
  calculateUsdValue,
  getRewardsPoolsId,
} from "@/src/utils/common";
import {useFuelPrice} from "@/src/hooks/useFuelPrice";
import Loader from "@/src/components/common/Loader/Loader";
import {useRewards} from "@/src/hooks/useRewards";
import {useAccount} from "@fuels/react";
import boostRewards from "@/src/models/campaigns.json";

// const userId =
//   "0x69e6223f2adf576dfefb21873b78e31ba228b094d05f74f59ea60cbd1bf87d0d";

const epochNumbers = 1;

const BoostsRewards = (): JSX.Element => {
  const {account} = useAccount();

  const [duration, setDuration] = useState("");

  const {price: fuelToUsdRate, isLoading} = useFuelPrice();

  const startDate = boostRewards[0].startDate;
  const endDate = boostRewards[0].endDate;
  const rewardsData = boostRewards[0].campaigns;
  const rewardsPoolsId = getRewardsPoolsId(rewardsData);

  const {rewardsAmount, isLoading: isRewardsAmountLoading} = useRewards({
    userId: account,
    epochNumbers,
    poolIds: rewardsPoolsId,
  });

  useEffect(() => {
    const updateDuration = () => {
      setDuration(calculateEpochDuration(startDate, endDate));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000);

    return () => clearInterval(interval);
  }, [startDate, endDate]);

  const fuelCount = parseFloat(rewardsAmount.toFixed(2));
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

          <div className={styles.rewardsValue}>
            {loading ? (
              <Loader />
            ) : (
              <>
                <RewardsIcon />
                <p>{fuelCount} FUEL</p>
                <span>{usdValue}</span>
              </>
            )}
          </div>
          <p className={styles.disclaimer}>
            Rewards are estimates and final rewards can be slightly different.
            <Link href={BoostsLearnMoreUrl} target="_blank">
              <u>Learn more.</u>
            </Link>
          </p>
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

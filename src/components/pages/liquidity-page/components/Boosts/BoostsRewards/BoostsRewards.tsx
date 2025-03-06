import styles from "./BoostsRewards.module.css";
import Link from "next/link";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import Info from "@/src/components/common/Info/Info";
import {
  POINTS_TOOLTIP,
  POINTS_RANK_TOOLTIP,
  POINTS_LEARN_MORE_URL,
} from "@/src/utils/constants";
import Loader from "@/src/components/common/Loader/Loader";
import {usePoints, usePointsRank} from "@/src/hooks/usePoints/usePoints";
import BoostsIcon from "@/src/components/icons/Boosts/BoostsIcon";

const BoostsRewards = (): JSX.Element => {
  const {rewardsAmount, isLoading, error} = usePoints();

  const {rank} = usePointsRank();

  return (
    <div className={styles.boosts}>
      <div className={styles.boostsHeader}>
        <div className={styles.boostsTitle}>
          <p>Points Program</p>
        </div>
        <Link href={POINTS_LEARN_MORE_URL} target="_blank">
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
            <p>Your Points</p>
            <Info
              tooltipText={POINTS_TOOLTIP}
              tooltipKey="points"
              color="#D1D4F9"
            />
          </div>
          <div className={styles.rewardsValue}>
            {isLoading ? (
              <Loader />
            ) : (
              <>
                <BoostsIcon />
                <p>{rewardsAmount}</p>
              </>
            )}
          </div>
        </div>
        <div className={styles.rankSection}>
          <div className={styles.divider}></div>
          <div className={styles.rankItem}>
            <div className={styles.rewardsLabel}>
              <p>Your rank</p>
              <Info
                tooltipText={POINTS_RANK_TOOLTIP}
                tooltipKey="rank"
                color="#D1D4F9"
              />
            </div>
            <p className={styles.rank}>{rank}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoostsRewards;

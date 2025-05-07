import styles from "./BoostsBanner.module.css";
import pointsStyles from "@/src/components/pages/points-page/PointsStyles.module.css";
import Link from "next/link";
import {
  POINTS_BANNER_SUBHEADER,
  POINTS_BANNER_TITLE,
  POINTS_LEARN_MORE_URL,
} from "libs/swap/src/utils/constants";
import PointsIcon from "@/src/components/icons/Points/PointsIcon";

const BoostsBanner = () => {
  return (
    <div className={styles.banner}>
      <PointsIcon />
      <h2 className={pointsStyles.pointsTitle}>{POINTS_BANNER_TITLE}</h2>
      <div className={styles.bottomArea}>
        <p className={pointsStyles.pointsSubtitle}>{POINTS_BANNER_SUBHEADER}</p>
        <Link href={POINTS_LEARN_MORE_URL} target="_blank">
          <button className={styles.learnMore}>
            Learn more <span className={styles.arrow}>&rarr;</span>
          </button>
        </Link>
      </div>
    </div>
  );
};

export default BoostsBanner;

import styles from "./BoostsBanner.module.css";
import pointsStyles from "@/src/components/pages/points-page/PointsStyles.module.css";
import Link from "next/link";
import {
  POINTS_BANNER_SUBHEADER,
  POINTS_BANNER_TITLE,
  POINTS_LEARN_MORE_URL,
} from "@/src/utils/constants";
import PointsIcon from "@/assets/sparcle.svg";
import Image from "next/image";
import {LearnMoreButton} from "@/src/components/common/LearnMoreButton/LearnMoreButton";
import clsx from "clsx";
import PointsIconSimple from "@/src/components/icons/Points/PointsIconSimple";

const BoostsBanner = () => {
  return (
    <div className={styles.banner}>
      <div className={styles.iconContainer}>
        <PointsIconSimple color={"var(--mc-white)"} />
      </div>
      <h2 className={clsx(styles.bannerTitle, "mc-type-xxxl")}>
        {POINTS_BANNER_TITLE}
      </h2>
      <div className={styles.bottomArea}>
        <p className={clsx(pointsStyles.pointsSubtitle, "mc-type-m")}>
          {POINTS_BANNER_SUBHEADER}
        </p>
        <Link href={POINTS_LEARN_MORE_URL} target="_blank">
          <button className={clsx(styles.learnMore, "mc-type-m")}>
            Learn more <span className={styles.arrow}>&rarr;</span>
          </button>
        </Link>
      </div>
    </div>
  );
};

export default BoostsBanner;

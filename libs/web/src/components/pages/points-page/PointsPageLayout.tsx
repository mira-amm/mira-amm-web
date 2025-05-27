"use client";

import styles from "./PointsPageLayout.module.css";
import PointsRankTable from "./PointsRankTable/PointsRankTable";
import Boosts from "../liquidity-page/components/Boosts/Boosts";

const PointsPageLayout = () => {
  return (
    <main className={styles.pointsPageLayout}>
      <Boosts />
      <div className={styles.titleSection}>
        <p className={styles.title}>Leaderboard</p>
        <div className={styles.subsection}>
          <p className={styles.subtitle}>
            See the top participants of the points program.{" "}
          </p>
          <p className={styles.pointsWarning}>
            The leaderboard is updated every hour.
          </p>
        </div>
      </div>
      <PointsRankTable />
    </main>
  );
};

export default PointsPageLayout;

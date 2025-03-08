"use client";

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import styles from "./PointsPageLayout.module.css";
import PointsRankTable from "./PointsRankTable/PointsRankTable";
import Boosts from "../liquidity-page/components/Boosts/Boosts";
import pointsStyles from "./PointsStyles.module.css";
import {POINTS_BANNER_TITLE} from "@/src/utils/constants";
const PointsPageLayout = (): JSX.Element => {
  return (
    <>
      <Header />
      <main className={styles.pointsPageLayout}>
        <div className={styles.container}>
          <Boosts />
        </div>
        <div className={styles.container}>
          <h2 className={pointsStyles.pointsTitle}>Leaderboard</h2>
          <div className={pointsStyles.pointsSubsection}>
            <p className={pointsStyles.pointsSubtitle}>
              See the top participants of the points program. Points are updated
              every hour.
            </p>
            <p className={pointsStyles.pointsWarning}>
              The leaderboard is updated every hour.
            </p>
          </div>
          <PointsRankTable />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PointsPageLayout;

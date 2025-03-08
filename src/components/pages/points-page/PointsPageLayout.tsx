"use client";

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import styles from "./PointsPageLayout.module.css";
import PointsRankTable from "./PointsRankTable/PointsRankTable";
import Boosts from "../liquidity-page/components/Boosts/Boosts";
import pointsStyles from "./PointsStyles.module.css";

const PointsPageLayout = (): JSX.Element => {
  return (
    <>
      <Header />
      <main className={styles.pointsPageLayout}>
        <Boosts />
        <div>
          <p className={pointsStyles.pointsTitle}>Leaderboard</p>
          <div className={pointsStyles.pointsSubsection}>
            <p className={pointsStyles.pointsSubtitle}>
              See the top participants of the points program.{" "}
            </p>
            <p className={pointsStyles.pointsWarning}>
              The leaderboard is updated every hour.
            </p>
          </div>
        </div>
        <PointsRankTable />
      </main>
      <Footer />
    </>
  );
};

export default PointsPageLayout;

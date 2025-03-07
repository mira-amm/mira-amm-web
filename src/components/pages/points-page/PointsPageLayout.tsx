"use client";

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import styles from "./PointsPageLayout.module.css";
import BoostsRewards from "../liquidity-page/components/Boosts/BoostsRewards/BoostsRewards";
import PointsRankTable from "./PointsRankTable/PointsRankTable";

const PointsPageLayout = (): JSX.Element => {
  return (
    <>
      <Header />
      <main className={styles.pointsPageLayout}>
        <div className={styles.boostsSection}>
          <BoostsRewards />
        </div>
        <div className={styles.tableSection}>
          <h2 className={styles.tableTitle}>Points Leaderboard</h2>
          <PointsRankTable />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PointsPageLayout;

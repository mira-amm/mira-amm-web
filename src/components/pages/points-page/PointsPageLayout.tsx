"use client";

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import styles from "./PointsPageLayout.module.css";
import PointsRankTable from "./PointsRankTable/PointsRankTable";
import Boosts from "../liquidity-page/components/Boosts/Boosts";
import clsx from "clsx";

const PointsPageLayout = (): JSX.Element => {
  return (
    <>
      <Header />
      <main className="page-container">
        <Boosts />
        <div className={styles.titleSection}>
          <p className={clsx(styles.title, "mc-type-xxxl")}>Leaderboard</p>
          <div className={styles.subsection}>
            <p className={clsx(styles.subtitle, "mc-type-m")}>
              See the top participants of the points program.{" "}
            </p>
            <p className={clsx(styles.pointsWarning, "mc-type-m")}>
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

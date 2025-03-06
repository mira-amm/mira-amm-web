"use client";

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import styles from "./PointsPageLayout.module.css";

const PointsPageLayout = (): JSX.Element => {
  return (
    <>
      <Header />
      <main className={styles.pointsPageLayout}>
        {/* Points page content will go here */}
        <div className={styles.container}>
          <h1 className={styles.title}>Points Program</h1>
          {/* Placeholder for points content */}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PointsPageLayout;

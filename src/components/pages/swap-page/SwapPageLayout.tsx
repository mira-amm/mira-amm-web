"use client";

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import Swap from "@/src/components/common/Swap/Swap";
import BackLink from "@/src/components/common/BackLink/BackLink";

import styles from "./SwapPageLayout.module.css";

const SwapPageLayout = () => {
  return (
    <div className={styles.swapPage}>
      <Header />
      <main className={styles.swapLayout}>
        <BackLink chevron />
        <Swap />
      </main>
      <Footer />
    </div>
  );
};

export default SwapPageLayout;

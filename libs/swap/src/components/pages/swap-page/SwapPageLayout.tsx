"use client";

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import styles from "./SwapPageLayout.module.css";
import Swap from "@swap/src/components/common/Swap/Swap";

const SwapPageLayout = () => {
  return (
    <div className={styles.swapPage}>
      <Header />
      <main className={styles.swapLayout}>
        <Swap />
      </main>
      <Footer />
    </div>
  );
};

export default SwapPageLayout;

"use client";

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import Swap from "@/src/components/common/Swap/Swap";
import styles from "./SwapPageLayout.module.css";
import BgGradient from "../../icons/BgGradient/BgGradient";
import {useIsConnected} from "@fuels/react";

const SwapPageLayout = () => {
  const {isConnected} = useIsConnected();

  return (
    <>
      <Header />
      <main className={styles.swapLayoutWrapper}>
        <div className={styles.swapContainer}>
          <div className={styles.swapLayout}>
            <Swap />
          </div>
          <div
            className={`${styles.gradientLayout} ${
              isConnected ? styles.visible : styles.hidden
            }`}
          >
            <BgGradient />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SwapPageLayout;

"use client";

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import Swap from "@/src/components/common/Swap/Swap";
import styles from "./SwapPageLayout.module.css";
import swapConnectedBg from "@/assets/swap-connected-bg.svg";
import {useIsConnected} from "@fuels/react";

const SwapPageLayout = () => {
  const {isConnected} = useIsConnected();

  return (
    <div className={styles.swapPage}>
      <Header />
      <main className={styles.swapLayoutWrapper}>
        <div className={styles.swapLayout}>
          <Swap />
        </div>
        <img
          src={swapConnectedBg.src}
          alt="connected-bg-gradient"
          className={`${styles.gradientBackground} ${
            isConnected ? styles.visible : styles.hidden
          }`}
        />
      </main>
      <Footer />
    </div>
  );
};

export default SwapPageLayout;

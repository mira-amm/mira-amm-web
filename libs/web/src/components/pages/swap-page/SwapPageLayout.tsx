"use client";

import Swap from "@/src/components/common/Swap/Swap";
import styles from "./SwapPageLayout.module.css";

const SwapPageLayout = () => {
  return (
    <div className={styles.swapPage}>
      <main className={styles.swapLayout}>
        <Swap />
      </main>
    </div>
  );
};

export default SwapPageLayout;

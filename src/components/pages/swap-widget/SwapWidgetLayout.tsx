"use client";

import Swap from "@/src/components/common/Swap/Swap";

import styles from "./SwapWidgetLayout.module.css";

const SwapWidgetLayout = () => {
  return (
    <div>
      <main className={styles.swapLayout}>
        <Swap isWidget />
      </main>
    </div>
  );
};

export default SwapWidgetLayout;

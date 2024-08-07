'use client';

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import Swap from "@/src/components/common/Swap/Swap";
import BackLink from "@/src/components/common/BackLink/BackLink";

import styles from './SwapPageLayout.module.css';

const SwapPageLayout = () => {
  return (
    <>
      <Header/>
      <main className={styles.swapLayout}>
        <BackLink />
        <Swap />
      </main>
      <Footer/>
    </>
  )
};

export default SwapPageLayout;

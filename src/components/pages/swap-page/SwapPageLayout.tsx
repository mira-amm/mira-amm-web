'use client';

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import Swap from "@/src/components/common/Swap/Swap";

import styles from './SwapPageLayout.module.css';
import Link from "next/link";
import ChevronLeft from "@/src/components/icons/ChevronLeft/ChevronLeft";
import {clsx} from "clsx";

const SwapPageLayout = () => {
  return (
    <>
      <Header/>
      <main className={styles.swapLayout}>
        <Link href="/" className={clsx('mobileOnly', styles.backLink)}>
          <ChevronLeft />
          Back
        </Link>
        <Swap />
      </main>
      <Footer/>
    </>
  )
};

export default SwapPageLayout;

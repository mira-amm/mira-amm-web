'use client';

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import Swap from "@/src/components/common/Swap/Swap";
import BackLink from "@/src/components/common/BackLink/BackLink";

import styles from './SwapPageLayout.module.css';
import {Suspense} from "react";
import {useIsClient} from "usehooks-ts";

const SwapPageLayout = () => {
  const isClient = useIsClient();

  return (
    <>
      <Header/>
      <main className={styles.swapLayout}>
        <BackLink />
        {isClient && (
          <Suspense>
            <Swap />
          </Suspense>
        )}
      </main>
      <Footer/>
    </>
  )
};

export default SwapPageLayout;

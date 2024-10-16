'use client';

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";

import styles from './AddLiquidityPageLayout.module.css';
import AddLiquidity from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidity";
import {useRouter, useSearchParams} from "next/navigation";
import {useEffect, useRef} from "react";
import {createPoolIdFromPoolKey, isPoolIdValid} from "@/src/utils/common";
import {isMobile} from "react-device-detect";

const AddLiquidityPageLayout = () => {
  const router = useRouter();
  const query = useSearchParams();
  const poolKey = query.get('pool');
  const poolId = poolKey ? createPoolIdFromPoolKey(poolKey) : null;

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isMobile && mainRef.current) {
      mainRef.current.scrollIntoView();
    }
  }, []);

  if (!poolId || !isPoolIdValid(poolId)) {
    router.push('/liquidity');
    return null;
  }

  return (
    <>
      <Header/>
      <main className={styles.addLiquidityLayout} ref={mainRef}>
        <AddLiquidity poolId={poolId} />
      </main>
      <Footer/>
    </>
  );
};

export default AddLiquidityPageLayout;

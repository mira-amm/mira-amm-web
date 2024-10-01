'use client';

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import BackLink from "@/src/components/common/BackLink/BackLink";

import styles from '../add-liquidity-page/AddLiquidityPageLayout.module.css';
import CreatePool from "./components/CreatePool/CreatePool";
import {useRouter, useSearchParams} from "next/navigation";
import {useEffect, useRef} from "react";
import {isPoolKeyValid} from "@/src/utils/common";

const CreatePoolPageLayout = () => {
  const router = useRouter();
  const query = useSearchParams();
  const poolKey = query.get('pool');

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollIntoView();
    }
  }, []);

  if (!poolKey || !isPoolKeyValid(poolKey)) {
    router.push('/liquidity');
    return null;
  }

  return (
    <>
      <Header/>
      <main className={styles.addLiquidityLayout} ref={mainRef}>
        <CreatePool poolKey={poolKey} />
      </main>
      <Footer/>
    </>
  );
};

export default CreatePoolPageLayout;
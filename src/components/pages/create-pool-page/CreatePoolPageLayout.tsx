'use client';

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import styles from '../add-liquidity-page/AddLiquidityPageLayout.module.css';
import CreatePool from "./components/CreatePool/CreatePool";
import {useEffect, useRef} from "react";

const CreatePoolPageLayout = () => {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollIntoView();
    }
  }, []);

  return (
    <>
      <Header/>
      <main className={styles.addLiquidityLayout} ref={mainRef}>
        <CreatePool />
      </main>
      <Footer/>
    </>
  );
};

export default CreatePoolPageLayout;

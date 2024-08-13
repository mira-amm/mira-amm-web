'use client';

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import BackLink from "@/src/components/common/BackLink/BackLink";

import styles from './AddLiquidityPageLayout.module.css';
import AddLiquidity from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidity";

const AddLiquidityPageLayout = () => {
  return (
    <>
      <Header/>
      <main className={styles.addLiquidityLayout}>
        <BackLink showOnDesktop href="/liquidity" />
        <AddLiquidity />
      </main>
      <Footer/>
    </>
  );
};

export default AddLiquidityPageLayout;

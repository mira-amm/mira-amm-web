'use client';

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";
import BackLink from "@/src/components/common/BackLink/BackLink";

import styles from './AddLiquidityPageLayout.module.css';
import AddLiquidity from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidity";
import {useRouter, useSearchParams} from "next/navigation";

const AddLiquidityPageLayout = () => {
  const router = useRouter();
  const query = useSearchParams();
  const poolKey = query.get('pool');

  if (!poolKey) {
    router.push('/liquidity');
    return null;
  }

  return (
    <>
      <Header/>
      <main className={styles.addLiquidityLayout}>
        <BackLink showOnDesktop href="/liquidity" />
        <AddLiquidity poolKey={poolKey} />
      </main>
      <Footer/>
    </>
  );
};

export default AddLiquidityPageLayout;

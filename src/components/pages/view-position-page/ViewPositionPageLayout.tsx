"use client";

import Header from "@/src/components/common/Header/Header";
import Footer from "@/src/components/common/Footer/Footer";

import styles from "./ViewPositionPageLayout.module.css";
import {createPoolIdFromPoolKey, isPoolIdValid} from "@/src/utils/common";
import {useRouter, useSearchParams} from "next/navigation";
import PositionView from "@/src/components/pages/view-position-page/components/PositionView/PositionView";

const ViewPositionPageLayout = () => {
  const router = useRouter();
  const query = useSearchParams();
  const poolKey = query.get("pool");
  const poolId = poolKey ? createPoolIdFromPoolKey(poolKey) : null;

  if (!poolId || !isPoolIdValid(poolId)) {
    router.push("/liquidity");
    return null;
  }

  return (
    <>
      <Header />
      <main className={styles.viewPositionLayout}>
        <PositionView pool={poolId} />
      </main>
      <Footer />
    </>
  );
};

export default ViewPositionPageLayout;

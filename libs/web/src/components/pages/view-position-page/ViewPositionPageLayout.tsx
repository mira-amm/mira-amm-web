"use client";

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
    <main className={styles.viewPositionLayout}>
      <PositionView pool={poolId} />
    </main>
  );
};

export default ViewPositionPageLayout;

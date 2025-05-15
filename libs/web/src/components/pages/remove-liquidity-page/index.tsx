"use client";

import Header from "@/src/components/common/Header/Header";

// import styles from "./index.module.css";
import RemoveLiquidity from "./components/RemoveLiquidity/RemoveLiquidity";
import {useRouter, useSearchParams} from "next/navigation";
import {useEffect, useRef} from "react";
import {createPoolIdFromIdString} from "@/src/utils/common";
import {isMobile} from "react-device-detect";

const RemoveLiquidityPageLayout = () => {
  const router = useRouter();
  const query = useSearchParams();
  const poolKey = query.get("pool");
  const poolId = poolKey ? createPoolIdFromIdString(poolKey) : null;

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isMobile && mainRef.current) {
      mainRef.current.scrollIntoView();
    }
  }, []);

  if (!poolId) {
    router.push("/liquidity");
    return null;
  }

  return (
    <>
      <main className="action-layout" ref={mainRef}>
        <RemoveLiquidity poolId={poolId} />
      </main>
    </>
  );
};

export default RemoveLiquidityPageLayout;

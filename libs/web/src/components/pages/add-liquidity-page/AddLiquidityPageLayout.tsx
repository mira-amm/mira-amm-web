"use client";

import AddLiquidity from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidity";
import {useRouter, useSearchParams} from "next/navigation";
import {useEffect, useRef} from "react";
import {createPoolIdFromIdString, isPoolIdValid} from "@/src/utils/common";
import {isMobile} from "react-device-detect";

const AddLiquidityPageLayout = () => {
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
        <AddLiquidity poolId={poolId} poolKey={poolKey || ""} />
      </main>
    </>
  );
};

export default AddLiquidityPageLayout;

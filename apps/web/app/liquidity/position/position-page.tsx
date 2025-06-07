"use client";

import {useRouter, useSearchParams} from "next/navigation";
import {createPoolIdFromPoolKey, isPoolIdValid} from "@/src/utils/common";
import PositionView from "@/src/components/pages/view-position-page/components/PositionView/PositionView";

const PositionPage = () => {
  const router = useRouter();
  const query = useSearchParams();
  const poolKey = query.get("pool");
  const poolId = poolKey ? createPoolIdFromPoolKey(poolKey) : null;

  if (!poolId || !isPoolIdValid(poolId)) {
    router.push("/liquidity");
    return null;
  }

  return (
    <main className="flex flex-col p-4 gap-4 lg:max-w-[716px] lg:mx-auto lg:px-4 lg:py-8">
      <PositionView pool={poolId} />
    </main>
  );
};

export default PositionPage
"use client";

import {useRouter} from "next/navigation";
import {createPoolIdFromPoolKey, isPoolIdValid} from "@/src/utils/common";
import {PositionView} from "@/src/components/pages/view-position-page/components/PositionView/PositionView";

export default function PositionPage({poolKey}: {poolKey?: string}) {
  const router = useRouter();
  const poolId = poolKey ? createPoolIdFromPoolKey(poolKey) : null;

  if (!poolId || !isPoolIdValid(poolId)) {
    router.push("/liquidity");
    return null;
  }

  return (
    <main className="flex flex-col gap-4 mx-auto lg:w-[716px] w-full lg:px-4 lg:py-8">
      <PositionView pool={poolId} />
    </main>
  );
}

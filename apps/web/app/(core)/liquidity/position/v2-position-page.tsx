"use client";

import {useRouter} from "next/navigation";
import {V2PositionView} from "@/src/components/pages/view-position-page/components/PositionView/v2-position-page";
import {createPoolIdFromPoolKey} from "@/src/utils/common";

export default function V2PositionPage({poolKey}: {poolKey?: string}) {
  const router = useRouter();

  const poolId = poolKey ? createPoolIdFromPoolKey(poolKey) : null;

  if (!poolId) {
    router.push("/liquidity");
    return null;
  }

  return (
    <main className="flex flex-col gap-4 mx-auto lg:w-[716px] w-full lg:px-4 lg:py-8">
      <V2PositionView pool={poolId} />
    </main>
  );
}

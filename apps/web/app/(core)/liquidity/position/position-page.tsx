"use client";

import {useRouter, useSearchParams} from "next/navigation";
import {useEffect} from "react";
import {createPoolIdFromPoolKey, isPoolIdValid} from "@/src/utils/common";
import {detectPoolType, parsePoolKey} from "@/src/utils/poolTypeDetection";
import {PositionView} from "@/src/components/pages/view-position-page/components/PositionView/PositionView";

export default function PositionPage() {
  const router = useRouter();
  const query = useSearchParams();
  const poolKey = query.get("pool");
  const poolId = poolKey ? createPoolIdFromPoolKey(poolKey) : null;

  useEffect(() => {
    if (poolKey) {
      try {
        // Try to detect if this is a v2 pool using the new detection logic
        const unifiedPoolId = parsePoolKey(poolKey);
        const poolType = detectPoolType(unifiedPoolId);

        // If this is a v2 pool, redirect to v2 pool view
        if (poolType === "v2") {
          router.push(`/liquidity/pool-v2/${poolKey}`);
          return;
        }
      } catch (error) {
        // If parsing fails, continue with v1 logic
        console.error("Error detecting pool type:", error);
      }
    }
  }, [poolKey, router]);

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

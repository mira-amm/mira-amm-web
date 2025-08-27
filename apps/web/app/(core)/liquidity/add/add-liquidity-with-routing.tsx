"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {detectPoolType, parsePoolKey} from "@/src/utils/poolTypeDetection";
import AddLiquidityPage from "./add-liquidity-page";

interface AddLiquidityWithRoutingProps {
  poolKey: string;
}

export default function AddLiquidityWithRouting({
  poolKey,
}: AddLiquidityWithRoutingProps) {
  const router = useRouter();

  useEffect(() => {
    // Parse and detect pool type
    try {
      const poolId = parsePoolKey(poolKey);
      const poolType = detectPoolType(poolId);

      // If this is a v2 pool, redirect to v2 add liquidity page
      if (poolType === "v2") {
        router.push(`/liquidity/add-v2?pool=${poolKey}`);
        return;
      }
    } catch (error) {
      console.error("Error detecting pool type:", error);
      // Continue with v1 page if detection fails
    }
  }, [poolKey, router]);

  // Render v1 add liquidity page for v1 pools or if detection fails
  return <AddLiquidityPage />;
}

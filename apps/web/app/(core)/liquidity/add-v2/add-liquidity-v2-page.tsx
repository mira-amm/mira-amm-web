"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {detectPoolType, parsePoolKey} from "@/src/utils/poolTypeDetection";

interface AddLiquidityV2PageProps {
  poolKey?: string;
}

export default function AddLiquidityV2Page({poolKey}: AddLiquidityV2PageProps) {
  const router = useRouter();

  useEffect(() => {
    // If no pool key provided, redirect to pools page
    if (!poolKey) {
      router.push("/liquidity");
      return;
    }

    // Parse and validate the pool key
    try {
      const poolId = parsePoolKey(poolKey);
      const poolType = detectPoolType(poolId);

      // If this is not a v2 pool, redirect to v1 add liquidity
      if (poolType !== "v2") {
        router.push(`/liquidity/add?pool=${poolKey}`);
        return;
      }
    } catch (error) {
      console.error("Invalid pool key:", error);
      router.push("/liquidity");
      return;
    }
  }, [poolKey, router]);

  if (!poolKey) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <h1 className="text-2xl font-bold">Add Liquidity to Concentrated Pool</h1>
      <p className="text-gray-600">Pool: {poolKey}</p>
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p className="font-semibold">Coming Soon</p>
        <p>v2 concentrated liquidity management is under development.</p>
        <p>This will be implemented in task 3.1.</p>
      </div>
    </div>
  );
}

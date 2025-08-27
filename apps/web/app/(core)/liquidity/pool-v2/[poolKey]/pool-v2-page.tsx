"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {detectPoolType, parsePoolKey} from "@/src/utils/poolTypeDetection";

interface PoolV2PageProps {
  poolKey: string;
}

export default function PoolV2Page({poolKey}: PoolV2PageProps) {
  const router = useRouter();

  useEffect(() => {
    // Parse and validate the pool key
    try {
      const poolId = parsePoolKey(poolKey);
      const poolType = detectPoolType(poolId);

      // If this is not a v2 pool, redirect to v1 position view
      if (poolType !== "v2") {
        router.push(`/liquidity/position?pool=${poolKey}`);
        return;
      }
    } catch (error) {
      console.error("Invalid pool key:", error);
      router.push("/liquidity");
      return;
    }
  }, [poolKey, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <h1 className="text-2xl font-bold">Concentrated Liquidity Pool</h1>
      <p className="text-gray-600">Pool: {poolKey}</p>
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p className="font-semibold">Coming Soon</p>
        <p>v2 concentrated liquidity pool view is under development.</p>
        <p>This will be implemented in task 3.1.</p>
      </div>
    </div>
  );
}

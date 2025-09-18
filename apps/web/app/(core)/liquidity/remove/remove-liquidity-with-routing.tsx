"use client";

import {useCallback, useMemo} from "react";
import RemoveLiquidityPage from "./remove-liquidity-page";
import RemoveBinLiquidity from "@/src/components/pages/bin-liquidity/remove-bin-liquidity";
import {parsePoolKey, detectPoolType} from "@/src/utils/poolTypeDetection";
import {useUnifiedPoolsMetadata} from "@/src/hooks/useUnifiedPoolsMetadata";
import {useAssetMetadata, usePoolConcentrationType} from "@/src/hooks";
import {useRouter} from "next/navigation";

// Centralized mocks for easier replacement
export const MOCK_POOL_TYPE = "v2";

export const MOCK_ASSET_A = {
  amount: "100000",
  metadata: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
    isLoading: false,
  },
  reserve: 100000,
};

export const MOCK_ASSET_B = {
  amount: "100000",
  metadata: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 9,
    isLoading: false,
  },
  reserve: 100000,
};

interface RemoveLiquidityWithRoutingProps {
  poolKey: string;
}

export default function RemoveLiquidityWithRouting({
  poolKey,
}: RemoveLiquidityWithRoutingProps) {
  const router = useRouter();
  const handleOnclose = useCallback(() => {
    router.back();
  }, [router]);

  const unifiedPoolId = useMemo(() => parsePoolKey(poolKey), [poolKey]);

  const poolType = useMemo(() => {
    // ⚠️ Uses mock type
    if (MOCK_POOL_TYPE) return MOCK_POOL_TYPE;
    if (!unifiedPoolId) return "v1" as const;
    return detectPoolType(unifiedPoolId);
  }, [unifiedPoolId]);

  // For v2, fetch pool metadata to discover asset ids
  // const {unifiedPoolsMetadata} = useUnifiedPoolsMetadata(
  //   poolType === "v2" && unifiedPoolId ? [unifiedPoolId] : undefined
  // );

  if (poolType === "v2") {
    // const meta = unifiedPoolsMetadata?.[0];
    // const assetX = meta?.assets?.[0];
    // const assetY = meta?.assets?.[1];

    // const asset0Metadata = useAssetMetadata(assetX || "");
    // const asset1Metadata = useAssetMetadata(assetY || "");

    return (
      <main className="flex flex-col gap-4 max-w-[563px] lg:min-w-[563px] mx-auto lg:py-8 w-full p-4">
        <RemoveBinLiquidity
          onClose={handleOnclose}
          assetA={MOCK_ASSET_A}
          assetB={MOCK_ASSET_B}
          // @ts-ignore BN type ensured by poolType === "v2"
          v2PoolId={unifiedPoolId as any}
        />
      </main>
    );
  }

  // Default: render v1 remove page
  return <RemoveLiquidityPage />;
}

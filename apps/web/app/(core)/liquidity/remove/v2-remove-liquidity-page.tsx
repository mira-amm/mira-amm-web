"use client";

import {BN} from "fuels";
import {useMemo, useCallback} from "react";
import {useRouter} from "next/navigation";
import RemoveBinLiquidity from "@/src/components/pages/bin-liquidity/remove-bin-liquidity";
import {useUnifiedPoolsMetadata, useAssetMetadata} from "@/src/hooks";

export default function V2RemoveLiquidityPage({
  poolKey,
  unifiedPoolIdString,
}: {
  poolKey?: string;
  unifiedPoolIdString: string;
}) {
  const router = useRouter();

  // Deserialize the unifiedPoolId from string back to BN on the client side
  const unifiedPoolId = useMemo(() => {
    return new BN(unifiedPoolIdString);
  }, [unifiedPoolIdString]);

  // Fetch pool metadata to get asset IDs
  const {
    unifiedPoolsMetadata,
    unifiedPoolsMetadataPending: isLoadingPoolMetadata,
  } = useUnifiedPoolsMetadata(unifiedPoolId ? [unifiedPoolId] : undefined);

  const poolMetadata = unifiedPoolsMetadata?.[0];
  const assetXId = poolMetadata?.assets?.[0];
  const assetYId = poolMetadata?.assets?.[1];

  // Fetch asset metadata for both assets
  const assetXMetadata = useAssetMetadata(assetXId || "");
  const assetYMetadata = useAssetMetadata(assetYId || "");

  const handleOnClose = useCallback(() => {
    router.push("/liquidity");
  }, [router]);

  // Prepare asset data for RemoveBinLiquidity component
  const assetA = useMemo(
    () => ({
      amount: "0", // Amount not needed for remove liquidity
      metadata: {
        name: assetXMetadata.name,
        symbol: assetXMetadata.symbol,
        decimals: assetXMetadata.decimals,
        isLoading: assetXMetadata.isLoading || isLoadingPoolMetadata,
      },
      reserve: 0, // Reserve not needed for remove liquidity
    }),
    [assetXMetadata, isLoadingPoolMetadata]
  );

  const assetB = useMemo(
    () => ({
      amount: "0", // Amount not needed for remove liquidity
      metadata: {
        name: assetYMetadata.name,
        symbol: assetYMetadata.symbol,
        decimals: assetYMetadata.decimals,
        isLoading: assetYMetadata.isLoading || isLoadingPoolMetadata,
      },
      reserve: 0, // Reserve not needed for remove liquidity
    }),
    [assetYMetadata, isLoadingPoolMetadata]
  );

  return (
    <main className="flex flex-col gap-4 max-w-[563px] lg:min-w-[563px] mx-auto lg:py-8 w-full p-4">
      <RemoveBinLiquidity
        onClose={handleOnClose}
        assetA={assetA}
        assetB={assetB}
        v2PoolId={unifiedPoolId}
      />
    </main>
  );
}

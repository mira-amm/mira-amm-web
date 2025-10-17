import {useMemo} from "react";
import {BN} from "fuels";

import {
  useAssetMetadata,
  useAssetPrice,
  useAssetBalance,
  useBalances,
} from "@/src/hooks";
import {usePoolsMetadataV2} from "./usePoolsMetadataV2";

/**
 * Hook to get pool assets information for both V2 pools
 */
export const usePoolAssetsV2 = (poolId: BN) => {
  const {balances} = useBalances();

  // For V2 pools, fetch metadata to get asset IDs
  const {unifiedPoolsMetadata, unifiedPoolsMetadataPending: isMetadataLoading} =
    usePoolsMetadataV2(poolId ? [poolId] : undefined);

  // Extract asset IDs based on pool type
  const {firstAssetId, secondAssetId, isStablePool} = useMemo(() => {
    if (!poolId) {
      return {
        firstAssetId: "",
        secondAssetId: "",
        isStablePool: false,
      };
    }

    if (unifiedPoolsMetadata.length > 0) {
      // V2 pool - extract from metadata
      const metadata = unifiedPoolsMetadata[0];

      // Safely extract asset IDs with proper null checks
      const asset0 = metadata.assets?.[0] as any;
      const asset1 = metadata.assets?.[1] as any;

      if (!asset0 || !asset1) {
        // Metadata not fully loaded yet
        return {
          firstAssetId: "",
          secondAssetId: "",
          isStablePool: false,
        };
      }

      return {
        firstAssetId: typeof asset0 === "string" ? asset0 : asset0.bits || "",
        secondAssetId: typeof asset1 === "string" ? asset1 : asset1.bits || "",
        isStablePool: false, // V2 pools don't have stable/volatile distinction
      };
    }

    return {
      firstAssetId: "",
      secondAssetId: "",
      isStablePool: false,
    };
  }, [unifiedPoolsMetadata]);

  // Only fetch asset data if we have valid asset IDs
  const asset0Metadata = useAssetMetadata(firstAssetId || "");
  const asset1Metadata = useAssetMetadata(secondAssetId || "");

  const firstAssetBalance = useAssetBalance(balances, firstAssetId || "");
  const secondAssetBalance = useAssetBalance(balances, secondAssetId || "");

  const {price: asset0Price} = useAssetPrice(firstAssetId || "");
  const {price: asset1Price} = useAssetPrice(secondAssetId || "");

  return {
    poolId,
    firstAssetId,
    secondAssetId,
    isStablePool,
    asset0Metadata,
    asset1Metadata,
    firstAssetBalance,
    secondAssetBalance,
    asset0Price,
    asset1Price,
    isMetadataLoading,
    isLoading: isMetadataLoading || !firstAssetId || !secondAssetId,
  };
};

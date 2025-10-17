import {useMemo} from "react";
import {BN} from "fuels";
import {
  parsePoolKey,
  detectPoolType,
  isV2PoolId,
} from "@/src/utils/poolTypeDetection";
import {
  useAssetMetadata,
  useAssetPrice,
  useAssetBalance,
  useBalances,
} from "@/src/hooks";
import {useUnifiedPoolsMetadata} from "./useUnifiedPoolsMetadata";

/**
 * Hook to get pool assets information for both V1 and V2 pools
 * For V1 pools: parses the poolKey directly to get asset IDs
 * For V2 pools: fetches pool metadata to extract asset IDs
 */
export const useUnifiedPoolAssets = (poolKey: string) => {
  const {balances} = useBalances();

  // Parse pool key to get unified pool ID
  const unifiedPoolId = useMemo(() => {
    try {
      return parsePoolKey(poolKey);
    } catch (error) {
      console.error("Failed to parse pool key:", error);
      return null;
    }
  }, [poolKey]);

  const poolType = useMemo(() => {
    if (!unifiedPoolId) return "v1" as const;
    return detectPoolType(unifiedPoolId);
  }, [unifiedPoolId]);

  // For V2 pools, fetch metadata to get asset IDs
  const {unifiedPoolsMetadata, unifiedPoolsMetadataPending: isMetadataLoading} =
    useUnifiedPoolsMetadata(
      poolType === "v2" && unifiedPoolId ? [unifiedPoolId] : undefined
    );

  // Extract asset IDs based on pool type
  const {firstAssetId, secondAssetId, isStablePool} = useMemo(() => {
    if (!unifiedPoolId) {
      return {
        firstAssetId: "",
        secondAssetId: "",
        isStablePool: false,
      };
    }

    if (poolType === "v1" && Array.isArray(unifiedPoolId)) {
      // V1 pool - extract from pool ID directly
      return {
        firstAssetId: unifiedPoolId[0].bits,
        secondAssetId: unifiedPoolId[1].bits,
        isStablePool: unifiedPoolId[2],
      };
    } else if (poolType === "v2" && unifiedPoolsMetadata.length > 0) {
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
  }, [unifiedPoolId, poolType, unifiedPoolsMetadata]);

  // Only fetch asset data if we have valid asset IDs
  const asset0Metadata = useAssetMetadata(firstAssetId || "");
  const asset1Metadata = useAssetMetadata(secondAssetId || "");

  const firstAssetBalance = useAssetBalance(balances, firstAssetId || "");
  const secondAssetBalance = useAssetBalance(balances, secondAssetId || "");

  const {price: asset0Price} = useAssetPrice(firstAssetId || "");
  const {price: asset1Price} = useAssetPrice(secondAssetId || "");

  return {
    poolId: unifiedPoolId,
    poolType,
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

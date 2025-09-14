import {useQuery} from "@tanstack/react-query";
import {useMiraSDK} from "@/src/core/providers/MiraSDKProvider";
import {PoolId} from "mira-dex-ts";
import {BN} from "fuels";

export type UnifiedPoolId = PoolId | BN; // v1 uses PoolId (tuple), v2 uses BN

export type UnifiedPoolMetadata = {
  poolId: UnifiedPoolId;
  type: "v1-volatile" | "v1-stable" | "v2-concentrated";
  assets: [string, string];
  reserves: {x: BN; y: BN};
  // v2 specific fields
  activeBin?: BN;
  binStep?: number;
  baseFactor?: number;
};

export function useUnifiedPoolsMetadata(pools: UnifiedPoolId[] | undefined) {
  const {readonlyMira: miraV1, readonlyMiraV2: miraV2} = useMiraSDK();
  const shouldFetch = Boolean(miraV1 && miraV2 && pools);

  const {data, isPending} = useQuery({
    queryKey: ["unifiedPoolsMetadata", pools],
    queryFn: async () => {
      if (!pools || !miraV1 || !miraV2) return [];

      const results: UnifiedPoolMetadata[] = [];

      for (const poolId of pools) {
        try {
          // Detect pool type based on ID structure
          if (Array.isArray(poolId)) {
            // v1 pool (tuple format)
            const metadata = await miraV1.poolMetadata(poolId as PoolId);
            if (metadata) {
              results.push({
                poolId,
                type: poolId[2] ? "v1-stable" : "v1-volatile", // Third element indicates stable
                assets: [poolId[0], poolId[1]],
                reserves: metadata.reserves,
              });
            }
          } else {
            // v2 pool (BN format)
            try {
              const metadata = await miraV2.poolMetadata(poolId as BN);
              if (metadata) {
                results.push({
                  poolId,
                  type: "v2-concentrated",
                  assets: [metadata.assetX, metadata.assetY],
                  reserves: metadata.reserves,
                  activeBin: metadata.activeBin,
                  binStep: metadata.binStep,
                  baseFactor: metadata.baseFactor,
                });
              }
            } catch (error) {
              // If v2 fails, might be a v1 pool with numeric ID (fallback)
              console.warn("Failed to fetch v2 pool metadata:", error);
            }
          }
        } catch (error) {
          console.warn("Failed to fetch pool metadata for:", poolId, error);
        }
      }

      return results;
    },
    enabled: shouldFetch,
  });

  return {
    unifiedPoolsMetadata: data || [],
    unifiedPoolsMetadataPending: isPending,
  };
}

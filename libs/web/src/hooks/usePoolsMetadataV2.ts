import {useQuery} from "@tanstack/react-query";
import {useReadonlyMiraV2} from "@/src/hooks";
import {BN} from "fuels";

export type UnifiedPoolMetadata = {
  poolId: BN;
  type: "v2-concentrated";
  assets: [string, string];
  reserves: {x: BN; y: BN};
  activeId?: number;
  binStep?: number;
  baseFactor?: number;
  protocolFees?: {x: BN; y: BN};
};

export function usePoolsMetadataV2(pools: BN[] | undefined) {
  const miraV2 = useReadonlyMiraV2();
  const shouldFetch = Boolean(miraV2 && pools);

  const {data, isPending} = useQuery({
    queryKey: ["unifiedPoolsMetadata", pools],
    queryFn: async () => {
      if (!pools || !miraV2) return [];

      const results: UnifiedPoolMetadata[] = [];

      for (const poolId of pools) {
        try {
          const metadata = await miraV2.poolMetadata(poolId as BN);
          if (metadata) {
            results.push({
              poolId,
              type: "v2-concentrated",
              assets: [metadata.pool.assetX.bits, metadata.pool.assetY.bits],
              reserves: metadata.reserves,
              activeId: metadata.activeId,
              binStep: metadata.pool.binStep,
              baseFactor: metadata.pool.baseFactor,
              protocolFees: metadata.protocolFees,
            });
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

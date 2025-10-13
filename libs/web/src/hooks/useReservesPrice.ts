import {useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {B256Address} from "fuels";
import {PoolId} from "mira-dex-ts";
import {useReadonlyMira, useAssetMetadata, type Pool} from "@/src/hooks";

export const useReservesPrice = ({
  pools,
  sellAssetId,
  buyAssetId,
}: {
  pools: Pool[] | undefined;
  sellAssetId: B256Address | null;
  buyAssetId: B256Address | null;
}) => {
  const miraAmm = useReadonlyMira();
  const sellMetadata = useAssetMetadata(sellAssetId);
  const buyMetadata = useAssetMetadata(buyAssetId);

  const poolIds = useMemo(() => pools?.map((p) => p.poolId), [pools]);

  const stableKey = useMemo(() => {
    const poolKey = poolIds
      ?.map((id) => {
        // Handle both V1 (array) and V2 (BN) pool IDs
        if (Array.isArray(id)) {
          return id.join("-");
        } else {
          return id.toString();
        }
      })
      .join(",");
    return ["reservesPrice", sellAssetId, buyAssetId, poolKey];
  }, [poolIds, sellAssetId, buyAssetId]);

  const shouldFetch =
    !!poolIds &&
    !!poolIds.length &&
    !!miraAmm &&
    !!sellAssetId &&
    !!sellMetadata &&
    !!buyMetadata;

  const {data, isLoading, isError} = useQuery({
    queryKey: stableKey,
    queryFn: async () => {
      const assetInputAmount = 1000;
      const [_, previewPrice] = await miraAmm!.previewSwapExactInput(
        {bits: sellAssetId!},
        assetInputAmount,
        poolIds!
      );

      return (
        ((previewPrice.toNumber() / assetInputAmount) *
          10 ** (sellMetadata.decimals ?? 0)) /
        10 ** (buyMetadata.decimals ?? 0)
      );
    },
    enabled: shouldFetch,
    staleTime: 30_000,
    gcTime: 60_000,
  });

  return {
    reservesPrice: data,
    isLoading,
    isError,
  };
};

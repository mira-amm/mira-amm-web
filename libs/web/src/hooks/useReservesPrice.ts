import {useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {B256Address, BN} from "fuels";
import {PoolId} from "mira-dex-ts";
import {useReadonlyMira, useAssetMetadata} from "@/src/hooks";

export const useReservesPrice = ({
  pools,
  sellAssetId,
  buyAssetId,
}: {
  pools: (PoolId | BN)[] | undefined;
  sellAssetId: B256Address | null;
  buyAssetId: B256Address | null;
}) => {
  const miraAmm = useReadonlyMira();
  const sellMetadata = useAssetMetadata(sellAssetId);
  const buyMetadata = useAssetMetadata(buyAssetId);

  const stableKey = useMemo(() => {
    const poolKey = pools
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
  }, [pools, sellAssetId, buyAssetId]);

  const shouldFetch =
    !!pools &&
    !!pools.length &&
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
        pools as any
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

import {useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {B256Address} from "fuels";
import {PoolId} from "mira-dex-ts";
import {useReadonlyMira, useAssetMetadata} from "@/src/hooks";

export const useReservesPrice = ({
  pools,
  sellAssetId,
  buyAssetId,
}: {
  pools: PoolId[] | undefined;
  sellAssetId: B256Address | null;
  buyAssetId: B256Address | null;
}) => {
  const miraAmm = useReadonlyMira();
  const sellMetadata = useAssetMetadata(sellAssetId);
  const buyMetadata = useAssetMetadata(buyAssetId);

  const stableKey = useMemo(() => {
    const poolKey = pools?.map((id) => id.join("-")).join(",");
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
        pools!
      );

      return (
        ((previewPrice.toNumber() / assetInputAmount) *
          10 ** (sellMetadata.decimals ?? 0)) /
        10 ** (buyMetadata.decimals ?? 0)
      );
    },
    enabled: shouldFetch,
    staleTime: 30_000,
    cacheTime: 60_000,
  });

  return {
    reservesPrice: data,
    isLoading,
    isError,
  };
};

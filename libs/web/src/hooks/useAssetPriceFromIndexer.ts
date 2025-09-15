import {useAssetPrice} from "@/indexer";

export const useAssetPriceFromIndexer = (
  assetId: string
): {price: number; isLoading: boolean} => {
  const {data, isLoading} = useAssetPrice(assetId);

  return {
    price: data?.price || 0,
    isLoading,
  };
};

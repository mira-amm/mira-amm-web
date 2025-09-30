import {useQuery} from "@tanstack/react-query";
import {useAssetMinterContract} from "./useAssetMinterContract";
import {FuelAssetPriceUrl, ETH_ASSET_ID} from "../utils/constants";
const NATIVE_BRIDGE_MINTER_CONTRACT =
  "0x4ea6ccef1215d9479f1024dff70fc055ca538215d2c8c348beddffd54583d0e8";

export const useAssetPrice = (
  assetId: string | null
): {price: number | null; isLoading: boolean} => {
  const {contractId} = useAssetMinterContract(assetId);

  const {data, isLoading} = useQuery({
    queryKey: ["assetPrice", assetId],
    queryFn: async () => {
      const req = await fetch(`${FuelAssetPriceUrl}/${assetId}`);
      const res = await req.json();

      return res.rate || null;
    },
    enabled:
      !!assetId &&
      (contractId === NATIVE_BRIDGE_MINTER_CONTRACT ||
        assetId === ETH_ASSET_ID),
    staleTime: Infinity,
  });

  return {price: data || null, isLoading};
};

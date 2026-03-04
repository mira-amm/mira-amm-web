import {useQuery} from "@tanstack/react-query";
import {useAssetMinterContract} from "./useAssetMinterContract";
import {FuelAssetPriceUrl, ETH_ASSET_ID} from "../utils/constants";
import {useAssetPriceFromIndexer} from "./useAssetPriceFromIndexer";

const NATIVE_BRIDGE_MINTER_CONTRACT =
  "0x4ea6ccef1215d9479f1024dff70fc055ca538215d2c8c348beddffd54583d0e8";

export const useAssetPrice = (
  assetId: string | null
): {price: number | null; isLoading: boolean} => {
  const {contractId} = useAssetMinterContract(assetId);

  const shouldFetchFromMainnet =
    !!assetId &&
    (contractId === NATIVE_BRIDGE_MINTER_CONTRACT ||
      assetId === ETH_ASSET_ID);

  const {data, isLoading} = useQuery({
    queryKey: ["assetPrice", assetId],
    queryFn: async () => {
      const req = await fetch(`${FuelAssetPriceUrl}/${assetId}`);
      const res = await req.json();

      return res.rate || null;
    },
    enabled: shouldFetchFromMainnet,
    staleTime: Infinity,
  });

  // Fallback to indexer if mainnet price is not available
  const {
    price: indexerPrice,
    isLoading: isIndexerLoading,
  } = useAssetPriceFromIndexer(assetId ?? "");

  // Use mainnet price if available, otherwise fallback to indexer price
  const price = data || indexerPrice || null;
  const loading = shouldFetchFromMainnet ? isLoading : isIndexerLoading;

  return {price, isLoading: loading};
};

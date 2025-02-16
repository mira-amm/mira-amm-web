import {CoinData} from "../utils/coinsConfig";
import useAssetMetadata from "./useAssetMetadata";

/**
 * @deprecated : use useAssetMetadata to get asset
 * This hook is just a wrapper for useAssestMetadata to return asset as Coindata type.
 */
const useAsset = (
  assetId: string,
): {isLoading: boolean; asset: CoinData | undefined} => {
  const {isLoading, asset} = useAssetMetadata(assetId);

  return {
    isLoading,
    asset,
  };
};

export default useAsset;

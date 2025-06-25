import {CoinData} from "@/src/utils/coinsConfig";
import { useAssetMetadata } from "@/src/hooks";

/**
 * This hook is just a wrapper for useAssestMetadata to return asset as Coindata type.
 * TODO: Update useAssetMetadata to return assets as CoinData type and deprecate this hook
 */
export function useAsset(
  assetId: string,
): {isLoading: boolean; asset: CoinData | undefined}{
  const {isLoading, decimals, name, symbol} = useAssetMetadata(assetId);

  const asset: CoinData | undefined =
    decimals && name && symbol ? {decimals, name, symbol, assetId} : undefined;
  return {
    isLoading,
    asset,
  };
};

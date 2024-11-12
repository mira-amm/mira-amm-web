import { coinsConfig } from "../utils/coinsConfig";

export const useAssetImage = (assetId: string) => {
  for (const coin of Array.from(coinsConfig.values())) {
    if (coin.assetId === assetId) {
      return coin.icon || null;
    }
  }
  return null;
};

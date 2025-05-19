import {SwapState} from "@/src/components/common/Swap/Swap";
import {ETH_ASSET_ID, USDC_ASSET_ID} from "@/src/utils/constants";
import {useEffect, useMemo, useState} from "react";

const b256Regex = /0x[0-9a-fA-F]{64}/;

export enum SWAP_ASSETS_KEYS {
  ASSET_IN = "assetIn",
  ASSET_OUT = "assetOut",
}

const useInitialSwapState = (isWidget?: boolean): SwapState => {
  const [assetIn, setAssetIn] = useState<string | null>(null);
  const [assetOut, setAssetOut] = useState<string | null>(null);
  const [localStorageCoins, setLocalStorageCoins] = useState<{
    sell: string | null;
    buy: string | null;
  }>({sell: null, buy: null});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAssetIn(params.get(SWAP_ASSETS_KEYS.ASSET_IN));
    setAssetOut(params.get(SWAP_ASSETS_KEYS.ASSET_OUT));

    const local = localStorage.getItem("swapCoins");
    try {
      setLocalStorageCoins(
        JSON.parse(local ?? "null") ?? {
          sell: ETH_ASSET_ID,
          buy: USDC_ASSET_ID,
        },
      );
    } catch {
      setLocalStorageCoins({sell: ETH_ASSET_ID, buy: USDC_ASSET_ID});
    }
  }, []);

  return useMemo(() => {
    const getValidAsset = (asset: string | null, defaultAsset: string) =>
      asset && b256Regex.test(asset) ? asset : defaultAsset;

    const sellAsset = isWidget
      ? getValidAsset(assetIn, ETH_ASSET_ID)
      : getValidAsset(localStorageCoins.sell, ETH_ASSET_ID);

    const buyAsset = isWidget
      ? getValidAsset(assetOut, USDC_ASSET_ID)
      : getValidAsset(localStorageCoins.buy, USDC_ASSET_ID);

    return {
      sell: {assetId: sellAsset, amount: ""},
      buy: {assetId: buyAsset, amount: ""},
    };
  }, [assetIn, assetOut, localStorageCoins, isWidget]);
};

export default useInitialSwapState;

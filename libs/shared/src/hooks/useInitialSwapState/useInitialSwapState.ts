import {ETH_ASSET_ID, USDC_ASSET_ID} from "@shared/src/utils/constants";
import {useSearchParams} from "next/navigation";
import {useMemo} from "react";
import {useLocalStorage} from "usehooks-ts";
import { SwapState } from "../../types/Swap";

const b256Regex = /0x[0-9a-fA-F]{64}/;

export enum SWAP_ASSETS_KEYS {
  ASSET_IN = "assetIn",
  ASSET_OUT = "assetOut",
}

const useInitialSwapState = (isWidget?: boolean): SwapState => {
  // TODO: Resolve hydration issue without losing the ability to set initial state
  const [swapCoins] = useLocalStorage<{
    buy: string | null;
    sell: string | null;
  }>("swapCoins", {sell: null, buy: null});

  const searchParams = useSearchParams();
  const [assetIn, assetOut] = [
    searchParams.get(SWAP_ASSETS_KEYS.ASSET_IN),
    searchParams.get(SWAP_ASSETS_KEYS.ASSET_OUT),
  ];

  return useMemo(() => {
    const getValidAsset = (asset: string | null, defaultAsset: string) =>
      asset && b256Regex.test(asset) ? asset : defaultAsset;

    const sellAsset = isWidget
      ? getValidAsset(assetIn, ETH_ASSET_ID)
      : getValidAsset(swapCoins.sell, ETH_ASSET_ID);

    const buyAsset = isWidget
      ? getValidAsset(assetOut, USDC_ASSET_ID)
      : getValidAsset(swapCoins.buy, USDC_ASSET_ID);

    return {
      sell: {assetId: sellAsset, amount: ""},
      buy: {assetId: buyAsset, amount: ""},
    };
  }, [assetIn, assetOut, isWidget, swapCoins.buy, swapCoins.sell]);
};

export default useInitialSwapState;

import {SwapState} from "@/src/components/common/Swap/Swap";
import {useEffect, useMemo} from "react";
import {useLocalStorage} from "usehooks-ts";
import {ETH_ASSET_ID, USDC_ASSET_ID} from "@/src/utils/constants";
import {usePathname, useSearchParams} from "next/navigation";
import {useRouter} from "next/navigation";

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

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [assetIn, assetOut] = [
    searchParams.get(SWAP_ASSETS_KEYS.ASSET_IN),
    searchParams.get(SWAP_ASSETS_KEYS.ASSET_OUT),
  ];

  useEffect(() => {
    if (isWidget && (!assetIn || !assetOut)) {
      const params = new URLSearchParams(searchParams.toString());

      if (!assetIn) params.set(SWAP_ASSETS_KEYS.ASSET_IN, ETH_ASSET_ID);
      if (!assetOut) params.set(SWAP_ASSETS_KEYS.ASSET_OUT, USDC_ASSET_ID);

      return router.push(`${pathname}?${params.toString()}`);
    }
  }, [isWidget, assetIn, assetOut, searchParams, router, pathname]);

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

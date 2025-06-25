import { useEffect, useMemo, useState } from "react";
import { SwapState } from "@/src/components/common/Swap/Swap";
import { ETH_ASSET_ID, FUEL_ASSET_ID } from "@/src/utils/constants";

const b256Regex = /^0x[0-9a-fA-F]{64}$/;

export enum SWAP_ASSETS_KEYS {
  ASSET_IN = "assetIn",
  ASSET_OUT = "assetOut",
}

const getValidAsset = (asset: string | null, fallback: string) =>
  b256Regex.test(asset || "") ? asset! : fallback;

export function useInitialSwapState(isWidget?: boolean): SwapState {
  const [assets, setAssets] = useState<{ sell: string; buy: string }>({
    sell: ETH_ASSET_ID,
    buy: FUEL_ASSET_ID,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    const paramAssetIn = urlParams.get(SWAP_ASSETS_KEYS.ASSET_IN);
    const paramAssetOut = urlParams.get(SWAP_ASSETS_KEYS.ASSET_OUT);

    let local: { sell?: string; buy?: string } = {};
    try {
      local = JSON.parse(localStorage.getItem("swapCoins") || "{}");
    } catch {
      // FALLBACK DEFAULTS ALREADY HANDLED
    }

    const sell = isWidget
      ? getValidAsset(paramAssetIn, ETH_ASSET_ID)
      : getValidAsset(local.sell ?? null, ETH_ASSET_ID);

    const buy = isWidget
      ? getValidAsset(paramAssetOut, FUEL_ASSET_ID)
      : getValidAsset(local.buy ?? null, FUEL_ASSET_ID);

    setAssets({ sell, buy });
  }, [isWidget]);

  return useMemo(
    () => ({
      sell: { assetId: assets.sell, amount: "" },
      buy: { assetId: assets.buy, amount: "" },
    }),
    [assets],
  );
};

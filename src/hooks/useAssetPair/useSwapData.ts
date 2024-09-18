import {useMemo} from "react";
import {AssetIdInput} from "mira-dex-ts/dist/sdk/typegen/MiraAmmContract";

import {SwapState} from "@/src/components/common/Swap/Swap";
import {coinsConfig} from "@/src/utils/coinsConfig";

type SwapData = {
  sellAssetId: string;
  buyAssetId: string;
  sellDecimals: number;
  buyDecimals: number;
  sellAssetIdInput: AssetIdInput;
  buyAssetIdInput: AssetIdInput;
  assets: [AssetIdInput, AssetIdInput];
};

const useSwapData = (swapState: SwapState): SwapData => {
  return useMemo(() => {
    const sellCoin = swapState.sell.coin;
    const buyCoin = swapState.buy.coin;

    const sellAssetId = coinsConfig.get(sellCoin)?.assetId!;
    const buyAssetId = coinsConfig.get(buyCoin)?.assetId!;

    const sellDecimals = coinsConfig.get(sellCoin)?.decimals!;
    const buyDecimals = coinsConfig.get(buyCoin)?.decimals!;

    const sellAssetIdInput: AssetIdInput = {
      bits: sellAssetId,
    };
    const buyAssetIdInput: AssetIdInput = {
      bits: buyAssetId,
    };

    const assets: [AssetIdInput, AssetIdInput] = [sellAssetIdInput, buyAssetIdInput];

    return {
      sellAssetId,
      buyAssetId,
      sellDecimals,
      buyDecimals,
      sellAssetIdInput,
      buyAssetIdInput,
      assets,
    };
  }, [swapState.buy.coin, swapState.sell.coin]);
};

export default useSwapData;

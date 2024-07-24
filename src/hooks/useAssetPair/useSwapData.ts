import {useMemo} from "react";
import type {AssetIdInput} from "mira-dex-ts/src/typegen/amm-contract/AmmContractAbi";

import {SwapState} from "@/src/components/common/Swap/Swap";
import {coinsConfig} from "@/src/utils/coinsConfig";

type SwapData = {
  sellAssetId: string;
  buyAssetId: string;
  sellDecimals: number;
  buyDecimals: number;
  sellAssetIdInput: AssetIdInput;
  buyAssetIdInput: AssetIdInput;
  assets: AssetIdInput[];
};

const useSwapData = (swapState: SwapState): SwapData => {
  return useMemo(() => {
    const sellCoin = swapState.sell.coin;
    const buyCoin = swapState.buy.coin;

    const sellAssetId = coinsConfig.get(sellCoin)?.assetId!;
    const buyAssetId = coinsConfig.get(buyCoin)?.assetId!;
    const mimicAssetId = coinsConfig.get('MIMIC')?.assetId!;

    const sellDecimals = coinsConfig.get(sellCoin)?.decimals!;
    const buyDecimals = coinsConfig.get(buyCoin)?.decimals!;

    const sellAssetIdInput: AssetIdInput = {
      bits: sellAssetId,
    };
    const buyAssetIdInput: AssetIdInput = {
      bits: buyAssetId,
    };
    const mimicAssetIdInput: AssetIdInput = {
      bits: mimicAssetId,
    };

    let assets: AssetIdInput[] = [];

    if (sellCoin !== 'MIMIC' && buyCoin !== 'MIMIC') {
      assets = [sellAssetIdInput, mimicAssetIdInput, buyAssetIdInput];
    } else {
      assets = [sellAssetIdInput, buyAssetIdInput];
    }

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

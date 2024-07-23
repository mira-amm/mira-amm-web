import {SwapState} from "@/src/components/common/Swap/Swap";
import {coinsConfig} from "@/src/utils/coinsConfig";
import type {AssetIdInput} from "mira-dex-ts/src/typegen/amm-contract/AmmContractAbi";
import {useMemo} from "react";

type ReturnType = {
  sellAssetId: string;
  buyAssetId: string;
  sellDecimals: number;
  buyDecimals: number;
  sellAssetIdInput: AssetIdInput;
  buyAssetIdInput: AssetIdInput;
  assetPair: [AssetIdInput, AssetIdInput];
};

const useSwapData = (swapState: SwapState): ReturnType => {
  return useMemo(() => {
    const sellAssetId = coinsConfig.get(swapState.sell.coin)?.assetId!;
    const buyAssetId = coinsConfig.get(swapState.buy.coin)?.assetId!;

    const sellDecimals = coinsConfig.get(swapState.sell.coin)?.decimals!;
    const buyDecimals = coinsConfig.get(swapState.buy.coin)?.decimals!;

    const sellAssetIdInput: AssetIdInput = {
      bits: sellAssetId
    };
    const buyAssetIdInput: AssetIdInput = {
      bits: buyAssetId
    };
    const assetPair: [AssetIdInput, AssetIdInput] = [
      sellAssetIdInput,
      buyAssetIdInput,
    ];

    return {
      sellAssetId,
      buyAssetId,
      sellDecimals,
      buyDecimals,
      sellAssetIdInput,
      buyAssetIdInput,
      assetPair
    };
  }, [swapState.buy.coin, swapState.sell.coin]);
};

export default useSwapData;

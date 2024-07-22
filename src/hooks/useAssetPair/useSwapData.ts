import type {SwapState} from "@/src/components/common/Swap/Swap";
import {coinsConfig} from "@/src/utils/coinsConfig";
import type {AssetIdInput} from "mira-dex-ts/src/typegen/amm-contract/AmmContractAbi";

const useSwapData = (swapState: SwapState) => {
  const sellAssetId = coinsConfig.get(swapState.sell.coin)?.assetId;
  const buyAssetId = coinsConfig.get(swapState.buy.coin)?.assetId;

  if (!sellAssetId || !buyAssetId) {
    return null;
  }

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

  return { sellAssetId, buyAssetId, sellDecimals, buyDecimals, sellAssetIdInput, buyAssetIdInput, assetPair };
};

export default useSwapData;

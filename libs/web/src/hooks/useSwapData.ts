import {useMemo} from "react";

import {SwapState} from "@/src/components/common/Swap/Swap";
import {useAssetMetadata} from "@/src/hooks";
import {AssetIdInput} from "libs/mira-v1-ts/src/sdk/typegen/contracts/MiraAmmContract";

export function useSwapData(swapState: SwapState): {
  sellAssetId: string;
  buyAssetId: string;
  sellDecimals: number;
  buyDecimals: number;
  sellAssetIdInput: AssetIdInput;
  buyAssetIdInput: AssetIdInput;
} {
  const sellMetadata = useAssetMetadata(swapState.sell.assetId);
  const buyMetadata = useAssetMetadata(swapState.buy.assetId);

  return useMemo(() => {
    const sellAssetIdInput: AssetIdInput = {
      bits: swapState.sell.assetId!,
    };
    const buyAssetIdInput: AssetIdInput = {
      bits: swapState.buy.assetId!,
    };

    return {
      sellAssetId: swapState.sell.assetId!,
      buyAssetId: swapState.buy.assetId!,
      sellDecimals: sellMetadata?.decimals || 0,
      buyDecimals: buyMetadata?.decimals || 0,
      sellAssetIdInput,
      buyAssetIdInput,
    };
  }, [swapState, sellMetadata, buyMetadata]);
}

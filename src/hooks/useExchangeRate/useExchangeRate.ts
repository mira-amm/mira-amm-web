import {useMemo} from "react";

import type {
  CurrencyBoxMode,
  SwapState,
} from "@/src/components/common/Swap/Swap";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {DefaultLocale} from "@/src/utils/constants";
import useAssetMetadata from "../useAssetMetadata";

const useExchangeRate = (
  swapState: SwapState,
  mode: CurrencyBoxMode = "sell",
): string | null => {
  const sellMetadata = useAssetMetadata(swapState.sell.assetId);
  const buyMetadata = useAssetMetadata(swapState.buy.assetId);

  return useMemo(() => {
    const showRate =
      swapState.buy.amount !== "" && swapState.sell.amount !== "";
    if (!showRate) {
      return null;
    }

    const anotherMode = mode === "sell" ? "buy" : "sell";

    const activeModeAmountValue = parseFloat(swapState[mode].amount);
    if (activeModeAmountValue === 0) {
      return null;
    }

    const metadata = mode === "sell" ? sellMetadata : buyMetadata;
    const otherMetadata = mode === "sell" ? buyMetadata : sellMetadata;

    const rate =
      parseFloat(swapState[anotherMode].amount) /
      parseFloat(swapState[mode].amount);
    const priceString = rate.toLocaleString(DefaultLocale, {
      minimumFractionDigits: metadata.decimals || 0,
    });
    return `1 ${metadata.symbol} ≈ ${priceString} ${otherMetadata.symbol}`;
  }, [
    swapState.buy.amount,
    swapState.sell.amount,
    sellMetadata,
    buyMetadata,
    mode,
  ]);
};

export default useExchangeRate;

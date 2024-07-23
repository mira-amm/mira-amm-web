import type {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import {useMemo} from "react";

const useExchangeRate = (swapState: SwapState, mode: CurrencyBoxMode = 'sell'): string | null => {
  return useMemo(() => {
    const showRate = swapState.buy.amount !== '' && swapState.sell.amount !== '';
    if (!showRate) {
      return null;
    }

    const anotherMode = mode === 'sell' ? 'buy' : 'sell';

    const activeModeAmountValue = parseFloat(swapState[mode].amount);
    if (activeModeAmountValue === 0) {
      return null;
    }

    const rate = parseFloat(swapState[anotherMode].amount) / parseFloat(swapState[mode].amount);
    return `1 ${swapState[mode].coin} ≈ ${rate.toFixed(6)} ${swapState[anotherMode].coin}`;
  }, [swapState.buy.amount, swapState.sell.amount, swapState.buy.coin, swapState.sell.coin, mode]);
};

export default useExchangeRate;

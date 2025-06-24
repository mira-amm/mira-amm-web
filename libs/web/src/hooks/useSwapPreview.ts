import {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import useSwapData from "./useAssetPair/useSwapData";
import useAsset from "./useAsset";
import {useMemo} from "react";
import {BN, bn} from "fuels";
import {useDebounce, useSwapRouter, TradeType, TradeState} from "@/src/hooks";
import {Route} from "./useGetPoolsWithReserve";

export type SwapPreview = {
  tradeState: TradeState;
  trade?: {
    bestRoute: Route;
    amountIn: BN;
    amountOut: BN;
  };
  error: string | null;
};

export function useSwapPreview(
  swapState: SwapState,
  mode: CurrencyBoxMode,
): SwapPreview {
  const {sellAssetId, buyAssetId} = useSwapData(swapState);

  const {asset: assetIn} = useAsset(sellAssetId);
  const {asset: assetOut} = useAsset(buyAssetId);

  const tradeType = mode === "buy" ? TradeType.EXACT_OUT : TradeType.EXACT_IN;

  const rawUserInputAmount = useMemo(() => {
    const amountString =
      tradeType === TradeType.EXACT_IN
        ? swapState.sell.amount
        : swapState.buy.amount;
    const amount = parseFloat(amountString);
    const amountValid = !isNaN(amount);
    if (!assetIn || !assetOut) return bn(0);
    const decimals =
      tradeType === TradeType.EXACT_IN ? assetIn.decimals : assetOut.decimals;

    try {
      return amountValid ? bn.parseUnits(amountString, decimals) : bn(0);
    } catch (error) {
      console.error("Error parsing units:", error);
      return bn(0);
    }
  }, [
    assetIn,
    assetOut,
    swapState.buy.amount,
    swapState.sell.amount,
    tradeType,
  ]);

  // passing as bn causes infinite render
  const debouncedValue = useDebounce(rawUserInputAmount.toString(), 500);

  return useSwapRouter(tradeType, bn(debouncedValue), assetIn, assetOut);
}

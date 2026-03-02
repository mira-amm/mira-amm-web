import {useMemo} from "react";
import {TradeState} from "@/src/hooks";

export function useSwapLoadingStates({
  tradeState,
  balancesPending,
  txCostPending,
  swapPending,
  activeMode,
  swapDisabled,
  amountMissing,
  showInsufficientBalance,
  swapButtonTitle,
}: {
  tradeState: TradeState;
  balancesPending: boolean;
  txCostPending: boolean;
  swapPending: boolean;
  activeMode: "buy" | "sell";
  swapDisabled: boolean;
  amountMissing: boolean;
  showInsufficientBalance: boolean;
  swapButtonTitle: string;
}) {
  const previewLoading = tradeState === TradeState.LOADING;
  const inputPreviewLoading = previewLoading && activeMode === "buy";
  const outputPreviewLoading = previewLoading && activeMode === "sell";

  const isActionDisabled = useMemo(() => {
    return (
      (swapDisabled &&
        !previewLoading &&
        tradeState !== TradeState.REFETCHING &&
        !balancesPending &&
        (txCostPending || amountMissing)) ||
      showInsufficientBalance
    );
  }, [
    swapDisabled,
    amountMissing,
    showInsufficientBalance,
    previewLoading,
    tradeState,
    balancesPending,
    txCostPending,
  ]);

  const isActionLoading = useMemo(() => {
    return (
      balancesPending ||
      tradeState === TradeState.REFETCHING ||
      (previewLoading && swapButtonTitle !== "Insufficient balance") ||
      (!amountMissing && !showInsufficientBalance && txCostPending)
    );
  }, [
    balancesPending,
    tradeState,
    previewLoading,
    swapButtonTitle,
    amountMissing,
    showInsufficientBalance,
    txCostPending,
  ]);

  return {
    previewLoading,
    inputPreviewLoading,
    outputPreviewLoading,
    isActionDisabled,
    isActionLoading,
    txCostPending,
    swapPending,
  };
}

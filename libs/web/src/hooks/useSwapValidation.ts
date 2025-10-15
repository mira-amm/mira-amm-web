import {useMemo, useEffect, useState} from "react";
import {bn} from "fuels";
import type {BN} from "fuels";
import {TradeState} from "@/src/hooks";
import type {SwapState} from "./useSwapFormState";

export function useSwapValidation({
  swapState,
  sellValue,
  buyValue,
  sellBalance,
  sellMetadataDecimals,
  isValidNetwork,
  tradeState,
  previewError,
  swapPending,
  sufficientEthBalance,
  review,
}: {
  swapState: SwapState;
  sellValue: string;
  buyValue: string;
  sellBalance: BN;
  sellMetadataDecimals: number;
  isValidNetwork: boolean;
  tradeState: TradeState;
  previewError: string | undefined;
  swapPending: boolean;
  sufficientEthBalance: boolean;
  review: boolean;
}) {
  const [showInsufficientBalance, setShowInsufficientBalance] =
    useState<boolean>(true);
  const [swapButtonTitle, setSwapButtonTitle] = useState<string>("Review");

  const coinMissing = useMemo(
    () => !swapState.buy.assetId || !swapState.sell.assetId,
    [swapState.buy.assetId, swapState.sell.assetId]
  );

  const amountMissing = useMemo(() => {
    const sellNum = parseFloat(sellValue);
    const buyNum = parseFloat(buyValue);
    return (
      !sellValue ||
      !buyValue ||
      isNaN(sellNum) ||
      isNaN(buyNum) ||
      sellNum <= 0 ||
      buyNum <= 0
    );
  }, [sellValue, buyValue]);

  // Check if user has sufficient sell token balance
  useEffect(() => {
    try {
      const parsedSell = bn.parseUnits(sellValue || "0", sellMetadataDecimals);
      const insufficient = sellBalance.lt(parsedSell);
      setShowInsufficientBalance(insufficient);
    } catch {
      setShowInsufficientBalance(false);
    }
  }, [sellValue, sellMetadataDecimals, sellBalance]);

  const swapDisabled = useMemo(() => {
    return (
      !isValidNetwork ||
      coinMissing ||
      showInsufficientBalance ||
      !sellValue ||
      !buyValue ||
      swapButtonTitle === "Input amounts" ||
      tradeState !== TradeState.VALID
    );
  }, [
    isValidNetwork,
    coinMissing,
    showInsufficientBalance,
    sellValue,
    buyValue,
    swapButtonTitle,
    tradeState,
  ]);

  // Update button title based on validation state
  useEffect(() => {
    let title = previewError || "";
    if (!title) {
      if (amountMissing) title = "Input amounts";
      else if (!isValidNetwork) title = "Incorrect network";
      else if (swapPending) title = "Waiting for approval in wallet";
      else if (showInsufficientBalance) title = "Insufficient balance";
      else if (!sufficientEthBalance) title = "Bridge more ETH to pay for gas";
      else if (!review && !amountMissing) title = "Review";
      else title = swapButtonTitle;
    }
    setSwapButtonTitle(title);
  }, [
    previewError,
    isValidNetwork,
    amountMissing,
    swapPending,
    sufficientEthBalance,
    showInsufficientBalance,
    review,
    swapButtonTitle,
  ]);

  return {
    coinMissing,
    amountMissing,
    showInsufficientBalance,
    swapDisabled,
    swapButtonTitle,
    setSwapButtonTitle,
  };
}

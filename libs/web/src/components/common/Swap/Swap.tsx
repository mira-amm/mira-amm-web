"use client";

import {useCallback, useEffect, useState, useRef} from "react";
import {B256Address} from "fuels";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";
import {
  Loader,
  FeatureGuard,
  ConnectWallet,
  ConnectWalletNew,
} from "@/src/components/common";
import {
  PriceAndRate,
  SwapCard,
  SwapModals,
} from "@/src/components/common/Swap/components";
import {
  useSwapFormState,
  useSwapSettings,
  useSwapModals,
  useSwapValidation,
  useSwapTransaction,
  useSwapDataLayer,
  useSwapLoadingStates,
  useIsClient,
  useSwap,
  useInitialSwapState,
  CurrencyBoxMode,
} from "@/src/hooks";

export function Swap({isWidget}: {isWidget?: boolean}) {
  const isClient = useIsClient();
  const initialSwapState = useInitialSwapState(isWidget);
  const [review, setReview] = useState(false);

  // Custom hooks for state management
  const modals = useSwapModals();
  const formState = useSwapFormState(initialSwapState, isWidget);
  const {slippage, setSlippage, slippageMode, setSlippageMode} =
    useSwapSettings();

  const modeForCoinSelector = useRef<CurrencyBoxMode>("sell");

  const isConnectedFromHook = useIsConnected();
  const connectUI = useConnectUI();
  const isConnected = isClient ? isConnectedFromHook.isConnected : false;
  const connect = isClient ? connectUI.connect : () => {};
  const isConnecting = isClient ? connectUI.isConnecting : false;

  // Consolidated data fetching
  const swapDataLayer = useSwapDataLayer({
    swapState: formState.swapState,
    sellValue: formState.sellValue,
    activeMode: formState.activeMode,
    updateSwapStateAmount: formState.updateSwapStateAmount,
  });

  const handleCoinSelectorClick = useCallback(
    (mode: CurrencyBoxMode) => {
      modals.openCoinsModal();
      modeForCoinSelector.current = mode;
    },
    [modals.openCoinsModal]
  );

  const handleCoinSelection = useCallback(
    (assetId: string | null) => {
      const mode = modeForCoinSelector.current;
      formState.selectCoin(mode)(assetId as B256Address);
      modals.closeCoinsModal();
    },
    [formState.selectCoin, modals.closeCoinsModal]
  );

  const swap = useSwap({
    swapState: formState.swapState,
    mode: formState.activeMode,
    slippage,
    pools: swapDataLayer.pools,
  });

  const resetSwapErrors = useCallback(() => {
    swap.resetTxCost();
    swap.resetSwap();
  }, [swap.resetTxCost, swap.resetSwap]);

  // Validation hook
  const validation = useSwapValidation({
    swapState: formState.swapState,
    sellValue: formState.sellValue,
    buyValue: formState.buyValue,
    sellBalance: swapDataLayer.sellBalance,
    sellMetadataDecimals: swapDataLayer.sellMetadata.decimals || 0,
    isValidNetwork: swapDataLayer.isValidNetwork,
    tradeState: swapDataLayer.tradeState,
    previewError: swapDataLayer.previewError || undefined,
    swapPending: swap.swapPending,
    sufficientEthBalance: swapDataLayer.sufficientEthBalance,
    review,
  });

  // Transaction hook
  const transaction = useSwapTransaction({
    fetchTxCost: swap.fetchTxCost,
    triggerSwap: swap.triggerSwap,
    openSuccess: modals.openSuccess,
    openFailure: modals.openFailure,
    refetchBalances: swapDataLayer.refetchBalances,
    clearAmounts: formState.clearAmounts,
    swapState: formState.swapState,
    swapButtonTitle: validation.swapButtonTitle,
    setSwapButtonTitle: validation.setSwapButtonTitle,
    sufficientEthBalance: swapDataLayer.sufficientEthBalance,
    amountMissing: validation.amountMissing,
    swapPending: swap.swapPending,
    exchangeRate: swapDataLayer.exchangeRate,
    review,
    setReview,
  });

  const loadingStates = useSwapLoadingStates({
    tradeState: swapDataLayer.tradeState,
    balancesPending: swapDataLayer.balancesPending,
    txCostPending: swap.txCostPending,
    swapPending: swap.swapPending,
    activeMode: formState.activeMode,
    swapDisabled: validation.swapDisabled,
    amountMissing: validation.amountMissing,
    showInsufficientBalance: validation.showInsufficientBalance,
    swapButtonTitle: validation.swapButtonTitle,
  });

  // Reset review state when validation fails
  useEffect(() => {
    if (validation.amountMissing || validation.showInsufficientBalance) {
      setReview(false);
    }
  }, [validation.amountMissing, validation.showInsufficientBalance]);

  const isRebrandingEnabled = getIsRebrandEnabled();

  return !isClient ? (
    <div className="w-[90vw] mx-auto sm:!w-full flex justify-center items-center gap-3 lg:gap-4">
      <Loader color="gray" rebrand={isRebrandingEnabled} />
    </div>
  ) : (
    <>
      <div className="flex flex-col gap-3 lg:gap-4">
        {isWidget && (
          <FeatureGuard fallback={<ConnectWallet />}>
            <ConnectWalletNew />
          </FeatureGuard>
        )}

        <SwapCard
          isWidget={isWidget}
          swapPending={loadingStates.swapPending}
          slippage={slippage}
          openSettingsModal={modals.openSettingsModal}
          formState={formState}
          swapDataLayer={swapDataLayer}
          inputPreviewLoading={loadingStates.inputPreviewLoading}
          outputPreviewLoading={loadingStates.outputPreviewLoading}
          handleCoinSelectorClick={handleCoinSelectorClick}
          transaction={transaction}
          previewLoading={loadingStates.previewLoading}
          txCostPending={loadingStates.txCostPending}
          feeValue={swapDataLayer.feeValue}
          isConnected={isConnected}
          isConnecting={isConnecting}
          connect={connect}
          isActionDisabled={loadingStates.isActionDisabled}
          isActionLoading={loadingStates.isActionLoading}
          validation={validation}
          isRebrandingEnabled={isRebrandingEnabled}
        />

        <FeatureGuard
          fallback={
            <PriceAndRate
              reservesPrice={swapDataLayer.reservesPrice}
              previewPrice={swapDataLayer.previewPrice}
              swapState={formState.swapState}
            />
          }
        />
      </div>

      {loadingStates.swapPending && (
        <div className="fixed inset-0 w-full h-full backdrop-blur-[5px] z-[4]" />
      )}

      <SwapModals
        modals={modals}
        slippage={slippage}
        slippageMode={slippageMode}
        setSlippage={setSlippage}
        setSlippageMode={setSlippageMode}
        balances={swapDataLayer.balances}
        handleCoinSelection={handleCoinSelection}
        swapStateForPreview={transaction.swapStateForPreview}
        swapResult={swap.swapResult}
        txCostError={swap.txCostError}
        swapError={swap.swapError}
        resetSwapErrors={resetSwapErrors}
        customErrorTitle={transaction.customErrorTitle}
      />
    </>
  );
}

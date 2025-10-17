"use client";

import {useCallback, useEffect, useMemo, useRef} from "react";

import {B256Address} from "fuels";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";

import {Loader, FeatureGuard, ConnectWallet} from "@/src/components/common";

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
  CurrencyBoxMode,
} from "@/src/hooks";

import {
  useIsClient,
  useSwap,
  TradeState,
  useInitialSwapState,
} from "@/src/hooks";
import {
  calculateFeePercent,
  calculateFeeValue,
} from "@/src/utils/swapCalculations";

import {ConnectWalletNew} from "../connect-wallet-new";
const overlayClasses = "fixed inset-0 w-full h-full backdrop-blur-[5px] z-[4]";

export function Swap({isWidget}: {isWidget?: boolean}) {
  const isClient = useIsClient();
  const initialSwapState = useInitialSwapState(isWidget);

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
    activeMode: formState.activeMode,
    updateSwapStateAmount: formState.updateSwapStateAmount,
  });

  const handleCoinSelectorClick = useCallback(
    (mode: CurrencyBoxMode) => {
      modals.openCoinsModal();
      modeForCoinSelector.current = mode;
    },
    [modals]
  );

  const handleCoinSelection = useCallback(
    (assetId: string | null) => {
      const mode = modeForCoinSelector.current;
      formState.selectCoin(mode)(assetId as B256Address);
      modals.closeCoinsModal();
    },
    [formState, modals]
  );

  const {
    fetchTxCost,
    txCostPending,
    txCostError,
    resetTxCost,
    triggerSwap,
    swapPending,
    swapResult,
    swapError,
    resetSwap,
  } = useSwap({
    swapState: formState.swapState,
    mode: formState.activeMode,
    slippage,
    pools: swapDataLayer.pools,
  });

  const resetSwapErrors = useCallback(() => {
    resetTxCost();
    resetSwap();
  }, [resetSwap, resetTxCost]);

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
    swapPending,
    sufficientEthBalance: swapDataLayer.sufficientEthBalance,
    review: false, // Will be updated by transaction hook
  });

  // Transaction hook
  const transaction = useSwapTransaction({
    fetchTxCost,
    triggerSwap,
    openSuccess: modals.openSuccess,
    openFailure: modals.openFailure,
    refetchBalances: swapDataLayer.refetchBalances,
    clearAmounts: formState.clearAmounts,
    swapState: formState.swapState,
    swapButtonTitle: validation.swapButtonTitle,
    setSwapButtonTitle: validation.setSwapButtonTitle,
    sufficientEthBalance: swapDataLayer.sufficientEthBalance,
    amountMissing: validation.amountMissing,
    swapPending,
    exchangeRate: swapDataLayer.exchangeRate,
  });

  const feePercent = useMemo(
    () => calculateFeePercent(swapDataLayer.trade?.bestRoute?.pools),
    [swapDataLayer.trade?.bestRoute?.pools]
  );

  const feeValue = useMemo(
    () =>
      calculateFeeValue(
        formState.sellValue,
        feePercent,
        swapDataLayer.sellMetadata.decimals || 0
      ),
    [formState.sellValue, feePercent, swapDataLayer.sellMetadata.decimals]
  );

  // Reset review state when validation fails
  useEffect(() => {
    if (validation.amountMissing || validation.showInsufficientBalance) {
      transaction.setReview(false);
    }
  }, [
    validation.amountMissing,
    validation.showInsufficientBalance,
    transaction,
  ]);

  const loadingStates = useSwapLoadingStates({
    tradeState: swapDataLayer.tradeState,
    balancesPending: swapDataLayer.balancesPending,
    txCostPending,
    swapPending,
    activeMode: formState.activeMode,
    swapDisabled: validation.swapDisabled,
    amountMissing: validation.amountMissing,
    showInsufficientBalance: validation.showInsufficientBalance,
    swapButtonTitle: validation.swapButtonTitle,
  });

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
          feeValue={feeValue}
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

      {loadingStates.swapPending && <div className={overlayClasses} />}

      <SwapModals
        modals={modals}
        slippage={slippage}
        slippageMode={slippageMode}
        setSlippage={setSlippage}
        setSlippageMode={setSlippageMode}
        balances={swapDataLayer.balances}
        handleCoinSelection={handleCoinSelection}
        swapStateForPreview={transaction.swapStateForPreview}
        swapResult={swapResult}
        txCostError={txCostError}
        swapError={swapError}
        resetSwapErrors={resetSwapErrors}
        customErrorTitle={transaction.customErrorTitle}
      />
    </>
  );
}

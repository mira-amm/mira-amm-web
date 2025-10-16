"use client";

import {useCallback, useEffect, useMemo, useRef} from "react";

import {B256Address} from "fuels";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";

import {
  CoinsListModal,
  CurrencyBox,
  SwapSuccessModal,
  SwapFailureModal,
  Logo,
  IconButton,
  Loader,
  SlippageSetting,
  FeatureGuard,
  SettingsModalContent,
  ConnectWallet,
} from "@/src/components/common";

import {createPoolKey} from "@/src/utils/common";

import {
  PreviewSummary,
  PriceAndRate,
  Rate,
  SwapActionButton,
} from "@/src/components/common/Swap/components";
import {
  useSwapFormState,
  useSwapSettings,
  useSwapModals,
  useSwapValidation,
  useSwapTransaction,
  useSwapDataLayer,
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

import {ArrowUpDown} from "lucide-react";
import {cn} from "@/src/utils/cn";
import {ConnectWalletNew} from "../connect-wallet-new";
import SettingsModalContentNew from "../settings-modal-content-new";

const lineSplitterClasses = "relative w-full h-px bg-background-grey-dark my-4";
const currencyBoxWidgetBg = "bg-background-grey-dark";
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

  const previewLoading = swapDataLayer.tradeState === TradeState.LOADING;
  const inputPreviewLoading = previewLoading && formState.activeMode === "buy";
  const outputPreviewLoading =
    previewLoading && formState.activeMode === "sell";

  const isActionDisabled = useMemo(() => {
    return (
      (validation.swapDisabled &&
        !previewLoading &&
        swapDataLayer.tradeState !== TradeState.REFETCHING &&
        !swapDataLayer.balancesPending &&
        (txCostPending || validation.amountMissing)) ||
      validation.showInsufficientBalance
    );
  }, [
    validation.swapDisabled,
    validation.amountMissing,
    validation.showInsufficientBalance,
    previewLoading,
    swapDataLayer.tradeState,
    swapDataLayer.balancesPending,
    txCostPending,
  ]);

  const isActionLoading = useMemo(() => {
    return (
      swapDataLayer.balancesPending ||
      swapDataLayer.tradeState === TradeState.REFETCHING ||
      (previewLoading &&
        validation.swapButtonTitle !== "Insufficient balance") ||
      (!validation.amountMissing &&
        !validation.showInsufficientBalance &&
        txCostPending)
    );
  }, [
    swapDataLayer.balancesPending,
    swapDataLayer.tradeState,
    previewLoading,
    validation.swapButtonTitle,
    validation.amountMissing,
    validation.showInsufficientBalance,
    txCostPending,
  ]);

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

        <div
          className={cn(
            "flex flex-col gap-4 p-5 pb-[18px] rounded-ten bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark",
            swapPending && "z-[5]"
          )}
        >
          <div className="flex items-center gap-[10px]  text-base leading-[19px] text-content-grey lg:text-xl lg:leading-[24px]">
            <div className="flex-1 text-black dark:text-content-primary">
              {isWidget ? <Logo /> : <p>Swap</p>}
            </div>
            <SlippageSetting
              slippage={slippage}
              openSettingsModal={modals.openSettingsModal}
            />
          </div>

          <CurrencyBox
            value={formState.sellValue}
            assetId={formState.swapState.sell.assetId}
            mode="sell"
            balance={swapDataLayer.sellBalance}
            setAmount={formState.setAmount("sell")}
            loading={inputPreviewLoading || swapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
            usdRate={swapDataLayer.sellAssetPrice.price}
            className={isWidget ? currencyBoxWidgetBg : undefined}
          />

          <div className={lineSplitterClasses}>
            <IconButton
              className="group absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 flex justify-center items-center rounded-full dark:bg-background-primary dark:text-content-grey hover:text-content-primary bg-background-primary p-2"
              onClick={formState.swapAssets}
            >
              <ArrowUpDown className="transition-transform duration-300 group-hover:rotate-180 text-white dark:text-content-dimmed-dark" />
            </IconButton>
          </div>

          <CurrencyBox
            value={formState.buyValue}
            assetId={formState.swapState.buy.assetId}
            mode="buy"
            balance={swapDataLayer.buyBalance}
            setAmount={formState.setAmount("buy")}
            loading={outputPreviewLoading || swapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
            usdRate={swapDataLayer.buyAssetPrice.price}
            className={isWidget ? currencyBoxWidgetBg : undefined}
          />

          {transaction.review && (
            <PreviewSummary
              previewLoading={previewLoading}
              tradeState={swapDataLayer.tradeState}
              exchangeRate={swapDataLayer.exchangeRate}
              pools={swapDataLayer.pools}
              feeValue={feeValue}
              sellMetadataSymbol={swapDataLayer.sellMetadata.symbol ?? ""}
              txCost={transaction.txCost}
              txCostPending={txCostPending}
              createPoolKeyFn={createPoolKey}
              reservesPrice={swapDataLayer.reservesPrice}
              previewPrice={swapDataLayer.previewPrice}
            />
          )}

          <FeatureGuard>
            <Rate swapState={formState.swapState} />
          </FeatureGuard>

          <SwapActionButton
            isConnected={isConnected}
            isConnecting={isConnecting}
            connect={connect}
            isActionDisabled={isActionDisabled}
            isActionLoading={isActionLoading}
            handleSwapClick={transaction.handleSwapClick}
            swapButtonTitle={validation.swapButtonTitle}
            isRebrandingEnabled={isRebrandingEnabled}
          />
        </div>

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

      {swapPending && <div className={overlayClasses} />}

      <FeatureGuard
        fallback={
          <modals.SettingsModal title="Settings">
            <SettingsModalContent
              slippage={slippage}
              slippageMode={slippageMode}
              setSlippage={setSlippage}
              setSlippageMode={setSlippageMode}
              closeModal={modals.closeSettingsModal}
            />
          </modals.SettingsModal>
        }
      >
        <modals.SettingsModal title={`Slippage tolerance: ${slippage / 100}%`}>
          <SettingsModalContentNew
            slippage={slippage}
            setSlippage={setSlippage}
            closeModal={modals.closeSettingsModal}
          />
        </modals.SettingsModal>
      </FeatureGuard>

      <modals.CoinsModal title="Choose token">
        <CoinsListModal
          selectCoin={handleCoinSelection}
          balances={swapDataLayer.balances}
        />
      </modals.CoinsModal>

      <modals.SuccessModal title={<></>}>
        <SwapSuccessModal
          swapState={transaction.swapStateForPreview.current}
          transactionHash={swapResult?.id}
        />
      </modals.SuccessModal>

      <modals.FailureModal title={<></>} onClose={resetSwapErrors}>
        <SwapFailureModal
          error={txCostError || swapError}
          closeModal={modals.closeFailureModal}
          customTitle={transaction.customErrorTitle}
        />
      </modals.FailureModal>
    </>
  );
}

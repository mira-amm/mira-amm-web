"use client";

import {useCallback, useEffect, useMemo, useRef} from "react";

import {B256Address, bn} from "fuels";
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
  CurrencyBoxMode,
} from "@/src/hooks";

import {
  useExchangeRate,
  useSwapPreview,
  useIsClient,
  useReservesPrice,
  useCheckActiveNetwork,
  useAssetMetadata,
  useCheckEthBalance,
  useBalances,
  useSwap,
  useAssetPrice,
  TradeState,
  useInitialSwapState,
  useDocumentTitle,
} from "@/src/hooks";
import {
  calculateFeePercent,
  calculateFeeValue,
  calculatePreviewPrice,
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

  const {balances, balancesPending, refetchBalances} = useBalances();
  const sellBalance = useMemo(
    () =>
      balances?.find((b) => b.assetId === formState.swapState.sell.assetId)
        ?.amount ?? bn(0),
    [balances, formState.swapState.sell.assetId]
  );

  const buyBalance = useMemo(
    () =>
      balances?.find((b) => b.assetId === formState.swapState.buy.assetId)
        ?.amount ?? bn(0),
    [balances, formState.swapState.buy.assetId]
  );

  const sellMetadata = useAssetMetadata(formState.swapState.sell.assetId);
  const buyMetadata = useAssetMetadata(formState.swapState.buy.assetId);

  // HACK: This is a bit of an ugly way to set document titles
  useDocumentTitle(`Swap: ${sellMetadata.symbol} to ${buyMetadata.symbol}`);

  const isValidNetwork = useCheckActiveNetwork();
  const {
    trade,
    tradeState,
    error: previewError,
  } = useSwapPreview(formState.swapState, formState.activeMode);

  const pools = useMemo(
    () => trade?.bestRoute?.pools.map((p) => p.poolId) ?? [],
    [trade?.bestRoute?.pools]
  );
  const anotherMode = formState.activeMode === "sell" ? "buy" : "sell";
  const decimals = useMemo(
    () =>
      anotherMode === "sell" ? sellMetadata.decimals : buyMetadata.decimals,
    [anotherMode, sellMetadata.decimals, buyMetadata.decimals]
  );

  const previewValueString = useMemo(() => {
    if (
      !trade ||
      tradeState !== TradeState.VALID ||
      !trade.amountIn ||
      trade.amountIn.eq(0) ||
      !trade.amountOut ||
      trade.amountOut.eq(0) ||
      !decimals
    ) {
      return "";
    }
    return formState.activeMode === "sell"
      ? trade.amountOut.formatUnits(decimals)
      : trade.amountIn.formatUnits(decimals);
  }, [trade, tradeState, formState.activeMode, decimals]);

  useEffect(() => {
    if (!previewValueString) return;
    formState.updateSwapStateAmount(anotherMode, previewValueString);
  }, [previewValueString, anotherMode, formState]);

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
    pools,
  });

  const resetSwapErrors = useCallback(() => {
    resetTxCost();
    resetSwap();
  }, [resetSwap, resetTxCost]);

  const sufficientEthBalance = useCheckEthBalance(formState.swapState.sell);
  const exchangeRate = useExchangeRate(formState.swapState);

  // Validation hook
  const validation = useSwapValidation({
    swapState: formState.swapState,
    sellValue: formState.sellValue,
    buyValue: formState.buyValue,
    sellBalance,
    sellMetadataDecimals: sellMetadata.decimals || 0,
    isValidNetwork,
    tradeState,
    previewError: previewError || undefined,
    swapPending,
    sufficientEthBalance,
    review: false, // Will be updated by transaction hook
  });

  // Transaction hook
  const transaction = useSwapTransaction({
    fetchTxCost,
    triggerSwap,
    openSuccess: modals.openSuccess,
    openFailure: modals.openFailure,
    refetchBalances,
    clearAmounts: formState.clearAmounts,
    swapState: formState.swapState,
    swapButtonTitle: validation.swapButtonTitle,
    setSwapButtonTitle: validation.setSwapButtonTitle,
    sufficientEthBalance,
    amountMissing: validation.amountMissing,
    swapPending,
    exchangeRate,
  });

  const feePercent = useMemo(
    () => calculateFeePercent(trade?.bestRoute?.pools),
    [trade?.bestRoute?.pools]
  );

  const feeValue = useMemo(
    () =>
      calculateFeeValue(
        formState.sellValue,
        feePercent,
        sellMetadata.decimals || 0
      ),
    [formState.sellValue, feePercent, sellMetadata.decimals]
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

  const previewLoading = tradeState === TradeState.LOADING;
  const inputPreviewLoading = previewLoading && formState.activeMode === "buy";
  const outputPreviewLoading =
    previewLoading && formState.activeMode === "sell";

  const {reservesPrice} = useReservesPrice({
    pools,
    sellAssetId: formState.swapState.sell.assetId,
    buyAssetId: formState.swapState.buy.assetId,
  });

  const previewPrice = useMemo(
    () =>
      calculatePreviewPrice(
        formState.swapState.sell.amount,
        formState.swapState.buy.amount
      ),
    [formState.swapState.sell.amount, formState.swapState.buy.amount]
  );

  const sellAssetPrice = useAssetPrice(formState.swapState.sell.assetId);
  const buyAssetPrice = useAssetPrice(formState.swapState.buy.assetId);

  const isActionDisabled = useMemo(() => {
    return (
      (validation.swapDisabled &&
        !previewLoading &&
        tradeState !== TradeState.REFETCHING &&
        !balancesPending &&
        (txCostPending || validation.amountMissing)) ||
      validation.showInsufficientBalance
    );
  }, [
    validation.swapDisabled,
    validation.amountMissing,
    validation.showInsufficientBalance,
    previewLoading,
    tradeState,
    balancesPending,
    txCostPending,
  ]);

  const isActionLoading = useMemo(() => {
    return (
      balancesPending ||
      tradeState === TradeState.REFETCHING ||
      (previewLoading &&
        validation.swapButtonTitle !== "Insufficient balance") ||
      (!validation.amountMissing &&
        !validation.showInsufficientBalance &&
        txCostPending)
    );
  }, [
    balancesPending,
    tradeState,
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
            balance={sellBalance}
            setAmount={formState.setAmount("sell")}
            loading={inputPreviewLoading || swapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
            usdRate={sellAssetPrice.price}
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
            balance={buyBalance}
            setAmount={formState.setAmount("buy")}
            loading={outputPreviewLoading || swapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
            usdRate={buyAssetPrice.price}
            className={isWidget ? currencyBoxWidgetBg : undefined}
          />

          {transaction.review && (
            <PreviewSummary
              previewLoading={previewLoading}
              tradeState={tradeState}
              exchangeRate={exchangeRate}
              pools={pools}
              feeValue={feeValue}
              sellMetadataSymbol={sellMetadata.symbol ?? ""}
              txCost={transaction.txCost}
              txCostPending={txCostPending}
              createPoolKeyFn={createPoolKey}
              reservesPrice={reservesPrice}
              previewPrice={previewPrice}
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
              reservesPrice={reservesPrice}
              previewPrice={previewPrice}
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
        <CoinsListModal selectCoin={handleCoinSelection} balances={balances} />
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

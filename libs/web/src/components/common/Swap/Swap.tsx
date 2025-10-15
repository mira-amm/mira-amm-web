"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";

import {B256Address, bn} from "fuels";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";

import {Button} from "@/meshwave-ui/Button";

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

import {PreviewSummary, PriceAndRate, Rate} from "@/src/components/common/Swap/components";
import {
  useSwapFormState,
  useSwapSettings,
  useSwapModals,
  useSwapValidation,
  useSwapTransaction,
  CurrencyBoxMode,
} from "@/src/hooks"

import {
  useExchangeRate,
  useSwapPreview,
  useIsClient,
  useReservesPrice,
  useCheckActiveNetwork,
  useAssetMetadata,
  useCheckEthBalance,
  useBalances,
  useModal,
  useSwap,
  useAssetPrice,
  TradeState,
  useInitialSwapState,
  useDocumentTitle,
} from "@/src/hooks";

import {ArrowUpDown, LoaderCircle} from "lucide-react";
import {cn} from "@/src/utils/cn";
import {ConnectWalletNew} from "../connect-wallet-new";
import SettingsModalContentNew from "../settings-modal-content-new";
import LoaderBar from "../loader-bar";

const lineSplitterClasses = "relative w-full h-px bg-background-grey-dark my-4";
const currencyBoxWidgetBg = "bg-background-grey-dark";
const overlayClasses = "fixed inset-0 w-full h-full backdrop-blur-[5px] z-[4]";

export function Swap({isWidget}: {isWidget?: boolean}) {
  const isClient = useIsClient();
  const initialSwapState = useInitialSwapState(isWidget);

  // Custom hooks for state management
  const {
    SettingsModal,
    openSettingsModal,
    closeSettingsModal,
    CoinsModal,
    openCoinsModal,
    closeCoinsModal,
    SuccessModal,
    openSuccess,
    FailureModal,
    openFailure,
    closeFailureModal,
  } = useSwapModals();

  const {
    swapState,
    setSwapState,
    inputsState,
    activeMode,
    setActiveMode,
    sellValue,
    buyValue,
    swapAssets,
    selectCoin,
    setAmount,
    clearAmounts,
    updateSwapStateAmount,
  } = useSwapFormState(initialSwapState, isWidget);

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
      balances?.find((b) => b.assetId === swapState.sell.assetId)?.amount ??
      bn(0),
    [balances, swapState.sell.assetId]
  );

  const buyBalance = useMemo(
    () =>
      balances?.find((b) => b.assetId === swapState.buy.assetId)?.amount ??
      bn(0),
    [balances, swapState.buy.assetId]
  );

  const sellMetadata = useAssetMetadata(swapState.sell.assetId);
  const buyMetadata = useAssetMetadata(swapState.buy.assetId);

  // HACK: This is a bit of an ugly way to set document titles
  useDocumentTitle(`Swap: ${sellMetadata.symbol} to ${buyMetadata.symbol}`);

  const isValidNetwork = useCheckActiveNetwork();
  const {
    trade,
    tradeState,
    error: previewError,
  } = useSwapPreview(swapState, activeMode);

  const pools = useMemo(
    () => trade?.bestRoute?.pools.map((p) => p.poolId) ?? [],
    [trade?.bestRoute?.pools]
  );
  const anotherMode = activeMode === "sell" ? "buy" : "sell";
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
    return activeMode === "sell"
      ? trade.amountOut.formatUnits(decimals)
      : trade.amountIn.formatUnits(decimals);
  }, [trade, tradeState, activeMode, decimals]);

  useEffect(() => {
    if (!previewValueString) return;
    updateSwapStateAmount(anotherMode, previewValueString);
  }, [previewValueString, anotherMode, updateSwapStateAmount]);

  const handleCoinSelectorClick = useCallback(
    (mode: CurrencyBoxMode) => {
      openCoinsModal();
      modeForCoinSelector.current = mode;
    },
    [openCoinsModal]
  );

  const handleCoinSelection = useCallback(
    (assetId: string | null) => {
      const mode = modeForCoinSelector.current;
      selectCoin(mode)(assetId as B256Address);
      closeCoinsModal();
    },
    [selectCoin, closeCoinsModal]
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
  } = useSwap({swapState, mode: activeMode, slippage, pools});

  const resetSwapErrors = useCallback(() => {
    resetTxCost();
    resetSwap();
  }, [resetSwap, resetTxCost]);

  const sufficientEthBalance = useCheckEthBalance(swapState.sell);
  const exchangeRate = useExchangeRate(swapState);

  // Validation hook
  const {
    coinMissing,
    amountMissing,
    showInsufficientBalance,
    swapDisabled,
    swapButtonTitle,
    setSwapButtonTitle,
  } = useSwapValidation({
    swapState,
    sellValue,
    buyValue,
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
  const {
    txCost,
    txCostData,
    review,
    setReview,
    customErrorTitle,
    handleSwapClick,
    swapStateForPreview,
  } = useSwapTransaction({
    fetchTxCost,
    triggerSwap,
    openSuccess,
    openFailure,
    refetchBalances,
    clearAmounts,
    swapState,
    swapButtonTitle,
    setSwapButtonTitle,
    sufficientEthBalance,
    amountMissing,
    swapPending,
    exchangeRate,
  });

  const feePercent = useMemo(() => {
    return (
      trade?.bestRoute?.pools.reduce((acc, {poolId}) => {
        return acc + (poolId[2] ? 0.05 : 0.3);
      }, 0) ?? 0
    );
  }, [trade?.bestRoute?.pools]);

  const feeValue = useMemo(() => {
    if (!sellValue || !sellMetadata.decimals) return "0";
    const sellNum = parseFloat(sellValue);
    const raw = (feePercent / 100) * sellNum;
    return raw.toFixed(sellMetadata.decimals);
  }, [sellValue, sellMetadata.decimals, feePercent])

  // Reset review state when validation fails
  useEffect(() => {
    if (amountMissing || showInsufficientBalance) {
      setReview(false);
    }
  }, [amountMissing, showInsufficientBalance, setReview]);

  const previewLoading = tradeState === TradeState.LOADING;
  const inputPreviewLoading = previewLoading && activeMode === "buy";
  const outputPreviewLoading = previewLoading && activeMode === "sell";

  const {reservesPrice} = useReservesPrice({
    pools,
    sellAssetId: swapState.sell.assetId,
    buyAssetId: swapState.buy.assetId,
  });

  const previewPrice = useMemo(() => {
    const s = parseFloat(swapState.sell.amount);
    const b = parseFloat(swapState.buy.amount);
    if (isNaN(s) || isNaN(b) || s === 0) return undefined;
    return b / s;
  }, [swapState.sell.amount, swapState.buy.amount]);

  const sellAssetPrice = useAssetPrice(swapState.sell.assetId);
  const buyAssetPrice = useAssetPrice(swapState.buy.assetId);

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
    previewLoading,
    tradeState,
    balancesPending,
    txCostPending,
    amountMissing,
    showInsufficientBalance,
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
              openSettingsModal={openSettingsModal}
            />
          </div>

          <CurrencyBox
            value={sellValue}
            assetId={swapState.sell.assetId}
            mode="sell"
            balance={sellBalance}
            setAmount={setAmount("sell")}
            loading={inputPreviewLoading || swapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
            usdRate={sellAssetPrice.price}
            className={isWidget ? currencyBoxWidgetBg : undefined}
          />

          <div className={lineSplitterClasses}>
            <IconButton
              className="group absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 flex justify-center items-center rounded-full dark:bg-background-primary dark:text-content-grey hover:text-content-primary bg-background-primary p-2"
              onClick={swapAssets}
            >
              <ArrowUpDown className="transition-transform duration-300 group-hover:rotate-180 text-white dark:text-content-dimmed-dark" />
            </IconButton>
          </div>

          <CurrencyBox
            value={buyValue}
            assetId={swapState.buy.assetId}
            mode="buy"
            balance={buyBalance}
            setAmount={setAmount("buy")}
            loading={outputPreviewLoading || swapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
            usdRate={buyAssetPrice.price}
            className={isWidget ? currencyBoxWidgetBg : undefined}
          />

          {review && (
            <PreviewSummary
              previewLoading={previewLoading}
              tradeState={tradeState}
              exchangeRate={exchangeRate}
              pools={pools}
              feeValue={feeValue}
              sellMetadataSymbol={sellMetadata.symbol ?? ""}
              txCost={txCost}
              txCostPending={txCostPending}
              createPoolKeyFn={createPoolKey}
              reservesPrice={reservesPrice}
              previewPrice={previewPrice}
            />
          )}

          <FeatureGuard>
            <Rate swapState={swapState} />
          </FeatureGuard>

          {!isConnected ? (
            <Button
              onClick={connect}
              disabled={isConnecting}
              size="2xl"
              className={cn(
                !isConnected &&
                isRebrandingEnabled &&
                "bg-accent-primary border-0 text-black hover:bg-accent-primary-1 shadow-none disabled:opacity-100"
              )}
            >
              Connect Wallet
            </Button>
          ) : (
            <Button
              disabled={isActionDisabled}
              onClick={handleSwapClick}
              size="2xl"
              className={cn(
                isActionDisabled &&
                isRebrandingEnabled &&
                "bg-accent-primary border-0 text-black hover:bg-accent-primary-1 shadow-none disabled:opacity-100"
              )}
            >
              {isActionLoading ? (
                <Loader rebrand={isRebrandingEnabled} />
              ) : (
                swapButtonTitle
              )}
            </Button>
          )}
        </div>

        <FeatureGuard
          fallback={
            <PriceAndRate
              reservesPrice={reservesPrice}
              previewPrice={previewPrice}
              swapState={swapState}
            />
          }
        />
      </div>

      {swapPending && <div className={overlayClasses} />}

      <FeatureGuard
        fallback={
          <SettingsModal title="Settings">
            <SettingsModalContent
              slippage={slippage}
              slippageMode={slippageMode}
              setSlippage={setSlippage}
              setSlippageMode={setSlippageMode}
              closeModal={closeSettingsModal}
            />
          </SettingsModal>
        }
      >
        <SettingsModal title={`Slippage tolerance: ${slippage / 100}%`}>
          <SettingsModalContentNew
            slippage={slippage}
            setSlippage={setSlippage}
            closeModal={closeSettingsModal}
          />
        </SettingsModal>
      </FeatureGuard>

      <CoinsModal title="Choose token">
        <CoinsListModal selectCoin={handleCoinSelection} balances={balances} />
      </CoinsModal>

      <SuccessModal title={<></>}>
        <SwapSuccessModal
          swapState={swapStateForPreview.current}
          transactionHash={swapResult?.id}
        />
      </SuccessModal>

      <FailureModal title={<></>} onClose={resetSwapErrors}>
        <SwapFailureModal
          error={txCostError || swapError}
          closeModal={closeFailureModal}
          customTitle={customErrorTitle}
        />
      </FailureModal>
    </>
  );
}

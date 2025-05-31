"use client";

import { useConnectUI, useIsConnected } from "@fuels/react";
import { clsx } from "clsx";
import {
  CoinsListModal,
  SwapSuccessModal,
  Logo,
  ConnectButton,
  ActionButton,
  IconButton,
  Loader,
  SlippageSetting,
} from "@/src/components/common";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CurrencyBox from "@/src/components/common/Swap/components/CurrencyBox/CurrencyBox";
import { ConvertIcon } from "@/meshwave-ui/icons";
import styles from "./Swap.module.css";
import ExchangeRate from "@/src/components/common/Swap/components/ExchangeRate/ExchangeRate";
import useExchangeRate from "@/src/hooks/useExchangeRate/useExchangeRate";
import { createPoolKey, openNewTab } from "@/src/utils/common";
import SettingsModalContent from "@/src/components/common/Swap/components/SettingsModalContent/SettingsModalContent";
import useInitialSwapState from "@/src/hooks/useInitialSwapState/useInitialSwapState";
import useCheckActiveNetwork from "@/src/hooks/useCheckActiveNetwork";
import usePreview from "@/src/hooks/useSwapPreviewV2";
import { PriceImpact } from "@/src/components/common/Swap/components/price-impact";
import { FuelAppUrl } from "@/src/utils/constants";
import useReservesPrice from "@/src/hooks/useReservesPrice";
import SwapFailureModal from "@/src/components/common/Swap/components/SwapFailureModal/SwapFailureModal";
import {
  B256Address,
  bn,
  BN,
  ScriptTransactionRequest,
  TransactionCost,
} from "fuels";
import { PoolId } from "mira-dex-ts";
import {
  useIsClient,
  useAssetMetadata,
  useCheckEthBalance,
  useBalances,
  useModal,
  useSwap,
  useAssetImage,
  useAssetPrice,
} from "@/src/hooks";
import { TradeState } from "@/src/hooks/useSwapRouter";
import { useAnimationStore } from "@/src/stores/useGlitchScavengerHunt";
import { triggerClassAnimation } from "../GlitchEffects/ClassAnimationTrigger";

export type CurrencyBoxMode = "buy" | "sell";
export type CurrencyBoxState = { assetId: string | null; amount: string };
type InputsState = Record<CurrencyBoxMode, { amount: string }>;
export type SwapState = Record<CurrencyBoxMode, CurrencyBoxState>;
export type SlippageMode = "auto" | "custom";

const DefaultSlippageValue = 100;
const initialInputsState: InputsState = { sell: { amount: "" }, buy: { amount: "" } };

function SwapRouteItem({ pool }: { pool: PoolId }) {
  const firstAssetIcon = useAssetImage(pool[0].bits);
  const secondAssetIcon = useAssetImage(pool[1].bits);
  const firstAssetMetadata = useAssetMetadata(pool[0].bits);
  const secondAssetMetadata = useAssetMetadata(pool[1].bits);
  const fee = pool[2] ? 0.05 : 0.3;

  return (
    <>
      <img src={firstAssetIcon || ""} alt={firstAssetMetadata.symbol} />
      <img src={secondAssetIcon || ""} alt={secondAssetMetadata.symbol} />
      <p>({fee}%)</p>
    </>
  );
}

const Swap = ({ isWidget }: { isWidget?: boolean }) => {
  const [SettingsModal, openSettingsModal, closeSettingsModal] = useModal();
  const [CoinsModal, openCoinsModal, closeCoinsModal] = useModal();
  const [SuccessModal, openSuccess] = useModal();
  const [FailureModal, openFailure, closeFailureModal] = useModal();
  const isClient = useIsClient();
  const initialSwapState = useInitialSwapState(isWidget);

  const [swapState, setSwapState] = useState<SwapState>(initialSwapState);
  const [inputsState, setInputsState] = useState<InputsState>(initialInputsState);
  const [activeMode, setActiveMode] = useState<CurrencyBoxMode>("sell");
  const [slippage, setSlippage] = useState<number>(DefaultSlippageValue);
  const [slippageMode, setSlippageMode] = useState<SlippageMode>("auto");
  const [txCostData, setTxCostData] = useState<{ tx: ScriptTransactionRequest; txCost: TransactionCost }>();
  const [txCost, setTxCost] = useState<number | null>(null);
  const [swapButtonTitle, setSwapButtonTitle] = useState("Review");
  const [review, setReview] = useState(false);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(true);
  const [customErrorTitle, setCustomErrorTitle] = useState("");

  const previousPreviewValue = useRef("");
  const swapStateForPreview = useRef(swapState);
  const modeForCoinSelector = useRef<CurrencyBoxMode>("sell");

  const isConnectedFromHook = useIsConnected();
  const connectUI = useConnectUI();
  const isConnected = isClient ? isConnectedFromHook.isConnected : false;
  const connect = isClient ? connectUI.connect : () => {};
  const isConnecting = isClient ? connectUI.isConnecting : false;

  const { balances, balancesPending, refetchBalances } = useBalances();
  const sellBalance = balances?.find(b => b.assetId === swapState.sell.assetId)?.amount ?? bn(0);
  const buyBalance = balances?.find(b => b.assetId === swapState.buy.assetId)?.amount ?? bn(0);

  const sellMetadata = useAssetMetadata(swapState.sell.assetId);
  const buyMetadata = useAssetMetadata(swapState.buy.assetId);
  const isValidNetwork = useCheckActiveNetwork();
  const {
    trade,
    tradeState,
    error: previewError,
  } = usePreview(swapState, activeMode);

  const pools = trade?.bestRoute?.pools.map(p => p.poolId);
  const anotherMode = activeMode === "sell" ? "buy" : "sell";
  const decimals = anotherMode === "sell" ? sellMetadata.decimals : buyMetadata.decimals;

  const previewValueString = useMemo(() => {
    if (
      !trade || tradeState !== TradeState.VALID ||
      !trade.amountIn || trade.amountIn.eq(0) ||
      !trade.amountOut || trade.amountOut.eq(0) || !decimals
    ) return "";
    return activeMode === "sell"
      ? trade.amountOut.formatUnits(decimals)
      : trade.amountIn.formatUnits(decimals);
  }, [trade, tradeState, activeMode, decimals]);

  useEffect(() => {
    if (previewValueString !== swapState[anotherMode].amount) {
      setSwapState(prev => ({ ...prev, [anotherMode]: { ...prev[anotherMode], amount: previewValueString } }));
    }
    if (previewValueString !== inputsState[anotherMode].amount) {
      setInputsState(prev => ({ ...prev, [anotherMode]: { amount: previewValueString } }));
    }
  }, [previewValueString, anotherMode]);

  const sellValue = inputsState.sell.amount;
  const buyValue = inputsState.buy.amount;

  const setSwapCoins = useCallback((next: (prev: any) => any) => {
    const current = JSON.parse(localStorage.getItem("swapCoins") ?? "null") ?? {
      sell: initialSwapState.sell.assetId,
      buy: initialSwapState.buy.assetId,
    };
    localStorage.setItem("swapCoins", JSON.stringify(next(current)));
  }, [initialSwapState]);

  const swapAssets = useCallback(() => {
    setSwapState(({ sell, buy }) => ({ buy: { ...sell }, sell: { ...buy } }));
    setInputsState(({ sell, buy }) => ({ buy: { ...sell }, sell: { ...buy } }));
    setActiveMode("sell");
    if (!isWidget) {
      setSwapCoins(({ sell, buy }) => ({ sell: buy, buy: sell }));
      useAnimationStore.getState().handleMagicTripleClickToken();
    }
  }, [isWidget, setSwapCoins]);

  const selectCoin = useCallback((mode: CurrencyBoxMode) => (assetId: B256Address | null) => {
    const isDuplicate =
      (mode === "buy" && swapState.sell.assetId === assetId) ||
      (mode === "sell" && swapState.buy.assetId === assetId);
    if (isDuplicate) return swapAssets();

    const amount = inputsState[mode].amount;
    setSwapState(prev => ({ ...prev, [mode]: { amount, assetId } }));
    setInputsState(prev => ({ ...prev, [mode]: { amount } }));
    if (!isWidget) setSwapCoins(prev => ({ ...prev, [mode]: assetId }));
    setActiveMode(mode);
  }, [inputsState, isWidget, setSwapCoins, swapAssets, swapState]);

  const setAmount = useCallback((mode: CurrencyBoxMode) => (amount: string) => {
    if (!amount) {
      setSwapState(prev => ({
        sell: { ...prev.sell, amount: "" },
        buy: { ...prev.buy, amount: "" },
      }));
      setInputsState(initialInputsState);
      previousPreviewValue.current = "";
      setActiveMode(mode);
      return;
    }
    const other = mode === "buy" ? "sell" : "buy";
    setSwapState(prev => ({
      ...prev,
      [mode]: { ...prev[mode], amount },
      [other]: { ...prev[other], amount: "" },
    }));
    setInputsState(prev => ({
      ...prev,
      [mode]: { amount },
      [other]: { amount: "" },
    }));
    if (mode !== activeMode) {
      setActiveMode(mode);
      previousPreviewValue.current = "";
    }
  }, [activeMode]);

  const handleCoinSelectorClick = useCallback((mode: CurrencyBoxMode) => {
    openCoinsModal();
    modeForCoinSelector.current = mode;
  }, [openCoinsModal]);

  const handleCoinSelection = (assetId: string | null) => {
    selectCoin(modeForCoinSelector.current)(assetId);
    closeCoinsModal();
  };

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
  } = useSwap({ swapState, mode: activeMode, slippage, pools });

  const resetSwapErrors = useCallback(() => {
    resetTxCost();
    resetSwap();
  }, [resetSwap, resetTxCost]);

  const coinMissing = !swapState.buy.assetId || !swapState.sell.assetId;
  const amountMissing = !sellValue || !buyValue || +sellValue <= 0 || +buyValue <= 0;

  const sufficientEthBalance = useCheckEthBalance(swapState.sell);
  const exchangeRate = useExchangeRate(swapState);

  const fetchCost = useCallback(async () => {
    try {
      const data = await fetchTxCost();
      setTxCostData(data);
      setTxCost(data?.txCost.gasPrice.toNumber() / 10 ** 9 || null);
      setCustomErrorTitle("");
    } catch {
      setCustomErrorTitle("Review failed, please try again");
      setTxCost(null);
      setReview(false);
      setSwapButtonTitle("Review");
      openFailure();
    }
  }, [fetchTxCost, openFailure]);

  const handleSwapClick = useCallback(async () => {
    if (swapButtonTitle === "Review") {
      setReview(true);
      setSwapButtonTitle("Swap");
      fetchCost();
      return;
    }
    if (!sufficientEthBalance) {
      openNewTab(`${FuelAppUrl}/bridge?from=eth&to=fuel&auto_close=true&=true`);
      return;
    }
    if (amountMissing || swapPending || exchangeRate === null) return;

    swapStateForPreview.current = swapState;
    try {
      if (txCostData?.tx) {
        const result = await triggerSwap(txCostData.tx);
        if (result) {
          setSwapState(initialSwapState);
          setInputsState(initialInputsState);
          setReview(false);
          openSuccess();
          triggerClassAnimation("dino");
          await refetchBalances();
        }
      } else openFailure();
    } catch (e) {
      console.error(e);
      if (!(e instanceof Error) || !e.message.includes("User canceled")) {
        openFailure();
        setSwapButtonTitle("Swap");
      }
    }
  }, [
    swapButtonTitle,
    sufficientEthBalance,
    amountMissing,
    swapPending,
    exchangeRate,
    swapState,
    txCostData?.tx,
    triggerSwap,
    openSuccess,
    openFailure,
    refetchBalances,
    initialSwapState,
    initialInputsState,
  ]);

  useEffect(() => {
    try {
      const insufficient = sellBalance.lt(bn.parseUnits(sellValue, sellMetadata.decimals || 0));
      setShowInsufficientBalance(insufficient);
    } catch {}
  }, [sellValue, sellMetadata, sellBalance]);

  const feePercent = trade?.bestRoute?.pools.reduce((p, { poolId }) => p + (poolId[2] ? 0.05 : 0.3), 0) ?? 0;
  const feeValue = sellValue ? ((feePercent / 100) * +sellValue).toFixed(sellMetadata.decimals || 0) : 0;

  const swapDisabled =
    !isValidNetwork ||
    coinMissing ||
    showInsufficientBalance ||
    !sellValue ||
    !buyValue ||
    swapButtonTitle === "Input amounts" ||
    tradeState !== TradeState.VALID;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    previewError,
    isValidNetwork,
    amountMissing,
    swapPending,
    sufficientEthBalance,
    showInsufficientBalance,
  ]);

  useEffect(() => {
    if (amountMissing || showInsufficientBalance) setReview(false);
  }, [amountMissing, showInsufficientBalance]);

  const previewLoading = tradeState === TradeState.LOADING;
  const inputPreviewLoading = previewLoading && activeMode === "buy";
  const outputPreviewLoading = previewLoading && activeMode === "sell";

  const { reservesPrice } = useReservesPrice({
    pools,
    sellAssetId: swapState.sell.assetId,
    buyAssetId: swapState.buy.assetId,
  });

  const previewPrice = useMemo(() => {
    const sell = parseFloat(swapState.sell.amount);
    const buy = parseFloat(swapState.buy.amount);
    return !isNaN(sell) && !isNaN(buy) ? buy / sell : undefined;
  }, [swapState]);

  const sellAssetPrice = useAssetPrice(swapState.sell.assetId);
  const buyAssetPrice = useAssetPrice(swapState.buy.assetId);

  const isActionDisabled =
    (swapDisabled &&
      !previewLoading &&
      tradeState !== TradeState.REEFETCHING &&
      !balancesPending &&
      (txCostPending || amountMissing)) ||
    showInsufficientBalance;

  const isActionLoading =
    balancesPending ||
    tradeState === TradeState.REEFETCHING ||
    (previewLoading && swapButtonTitle !== "Insufficient balance") ||
    (!amountMissing && !showInsufficientBalance && txCostPending);

  if (!isClient) {
    return (
      <div className={styles.swapPlaceholder}>
        <Loader color="gray" />
      </div>
    );
  }

  return (
    <>
      <div className={styles.swapAndRate}>
        <div
          className={clsx(
            styles.swapContainer,
            isWidget && styles.widgetSwapContainer,
            swapPending && styles.swapContainerLoading,
          )}
        >
          <div className={styles.heading}>
            <div className={styles.title}>{isWidget ? <Logo /> : <p>Swap</p>}</div>
            <SlippageSetting slippage={slippage} openSettingsModal={openSettingsModal} />
            {isWidget && <ConnectButton className={styles.connectWallet} isWidget />}
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
            className={isWidget ? styles.widgetBoxBg : undefined}
          />

          <div className={styles.splitter}>
            <IconButton onClick={swapAssets} className={styles.convertButton}>
              <ConvertIcon />
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
            className={isWidget ? styles.widgetBoxBg : undefined}
          />

          {review && (
            <div className={styles.summary}>
              <div className={styles.summaryEntry}>
                <p>Rate</p>
                {previewLoading || tradeState === TradeState.REEFETCHING ? (
                  <Loader color="gray" />
                ) : (
                  <p>{exchangeRate}</p>
                )}
              </div>

              <div className={styles.summaryEntry}>
                <p>Order routing</p>
                <div className={styles.feeLine}>
                  {previewLoading || tradeState === TradeState.REEFETCHING ? (
                    <Loader color="gray" />
                  ) : (
                    pools?.map((pool, i) => (
                      <div className={styles.poolsFee} key={createPoolKey(pool)}>
                        <SwapRouteItem pool={pool} />
                        {i !== pools.length - 1 && "+"}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className={styles.summaryEntry}>
                <p>Estimated fees</p>
                {previewLoading || tradeState === TradeState.REEFETCHING ? (
                  <Loader color="gray" />
                ) : (
                  <p>{feeValue} {sellMetadata.symbol}</p>
                )}
              </div>

              <div className={styles.summaryEntry}>
                <p>Network cost</p>
                {txCostPending ? <Loader color="gray" /> : <p>{txCost?.toFixed(9)} ETH</p>}
              </div>
            </div>
          )}

          {!isConnected ? (
            <ActionButton variant="secondary" onClick={connect} loading={isConnecting}>
              Connect Wallet
            </ActionButton>
          ) : (
            <ActionButton
              variant="primary"
              disabled={isActionDisabled}
              className={isWidget && isActionDisabled ? styles.widgetBoxBg : undefined}
              onClick={handleSwapClick}
              loading={isActionLoading}
            >
              {swapButtonTitle}
            </ActionButton>
          )}
        </div>

        <div className={styles.rates}>
          <PriceImpact reservesPrice={reservesPrice} previewPrice={previewPrice} />
          <ExchangeRate swapState={swapState} />
        </div>
      </div>

      {swapPending && <div className={styles.loadingOverlay} />}

      <SettingsModal title="Settings">
        <SettingsModalContent
          slippage={slippage}
          slippageMode={slippageMode}
          setSlippage={setSlippage}
          setSlippageMode={setSlippageMode}
          closeModal={closeSettingsModal}
        />
      </SettingsModal>

      <CoinsModal title="Choose token">
        <CoinsListModal selectCoin={handleCoinSelection} balances={balances} />
      </CoinsModal>

      <SuccessModal title={<></>}>
        <SwapSuccessModal swapState={swapStateForPreview.current} transactionHash={swapResult?.id} />
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
};

export default Swap;

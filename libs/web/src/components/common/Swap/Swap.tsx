"use client";

import {useConnectUI, useIsConnected} from "@fuels/react";
import {clsx} from "clsx";
import {
  CoinsListModal,
  SwapSuccessModal,
  Logo,
  IconButton,
  Loader,
  SlippageSetting,
} from "@/src/components/common";
import {useCallback, useEffect, useMemo, useRef, useState, memo} from "react";
import CurrencyBox from "@/src/components/common/Swap/components/CurrencyBox/CurrencyBox";
import {ConvertIcon} from "@/meshwave-ui/icons";
import ExchangeRate from "@/src/components/common/Swap/components/ExchangeRate/ExchangeRate";
import useExchangeRate from "@/src/hooks/useExchangeRate/useExchangeRate";
import {createPoolKey, openNewTab} from "@/src/utils/common";
import SettingsModalContent from "@/src/components/common/Swap/components/SettingsModalContent/SettingsModalContent";
import useInitialSwapState from "@/src/hooks/useInitialSwapState/useInitialSwapState";
import useCheckActiveNetwork from "@/src/hooks/useCheckActiveNetwork";
import usePreview from "@/src/hooks/useSwapPreviewV2";
import {PriceImpact} from "@/src/components/common/Swap/components/price-impact";
import {FuelAppUrl} from "@/src/utils/constants";
import useReservesPrice from "@/src/hooks/useReservesPrice";
import SwapFailureModal from "@/src/components/common/Swap/components/SwapFailureModal/SwapFailureModal";
import {
  B256Address,
  bn,
  BN,
  ScriptTransactionRequest,
  TransactionCost,
} from "fuels";
import {PoolId} from "mira-dex-ts";
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
import {TradeState} from "@/src/hooks/useSwapRouter";
import {useAnimationStore} from "@/src/stores/useGlitchScavengerHunt";
import {triggerClassAnimation} from "../GlitchEffects/ClassAnimationTrigger";
import {ConnectWallet} from "../connect-wallet";
import {Button} from "@/meshwave-ui/Button";
import {cn} from "@/src/utils/cn";

export type CurrencyBoxMode = "buy" | "sell";
export type CurrencyBoxState = {assetId: string | null; amount: string};
type InputsState = Record<CurrencyBoxMode, {amount: string}>;
export type SwapState = Record<CurrencyBoxMode, CurrencyBoxState>;
export type SlippageMode = "auto" | "custom";

export const DefaultSlippageValue = 100;
const initialInputsState: InputsState = {sell: {amount: ""}, buy: {amount: ""}};

const swapAndRateClasses = "flex flex-col gap-3 lg:gap-4";
const swapContainerBaseClasses =
  "flex flex-col gap-4 p-4 pb-[18px] rounded-2xl bg-background-grey-dark";
const swapContainerWidgetClasses = "bg-background-primary";
const swapContainerLoadingClasses = "z-[5]";
const headerBaseClasses =
  "flex items-center gap-[10px] font-medium text-[16px] leading-[19px] text-content-grey lg:text-[20px] lg:leading-[24px]";
const headerTitleClasses = "flex-1 text-content-primary";
const lineSplitterClasses = "relative w-full h-px bg-background-grey-dark my-4";
const convertButtonClasses =
  "group absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 flex justify-center items-center rounded-full bg-background-primary text-content-grey hover:text-content-primary";
const currencyBoxWidgetBg = "bg-background-grey-dark";
const summaryBaseClasses =
  "flex flex-col gap-2 text-content-tertiary text-[12px] leading-[16px] lg:text-[13px] lg:leading-[18px]";
const summaryEntryClasses = "flex justify-between";
const routingLineClasses = "flex flex-wrap items-center gap-1";
const poolsFeeClasses = "flex items-center gap-1";
const overlayClasses = "fixed inset-0 w-full h-full backdrop-blur-[5px] z-[4]";

const SwapRouteItem = memo(function SwapRouteItem({pool}: {pool: PoolId}) {
  const firstAssetIcon = useAssetImage(pool[0].bits);
  const secondAssetIcon = useAssetImage(pool[1].bits);
  const firstAssetMetadata = useAssetMetadata(pool[0].bits);
  const secondAssetMetadata = useAssetMetadata(pool[1].bits);
  const fee = pool[2] ? 0.05 : 0.3;

  return (
    <div className="flex items-center gap-1">
      <img
        src={firstAssetIcon || ""}
        alt={firstAssetMetadata.symbol}
        className="-mr-2 h-4 w-4"
      />
      <img
        src={secondAssetIcon || ""}
        alt={secondAssetMetadata.symbol}
        className="h-4 w-4"
      />
      <p>({fee}%)</p>
    </div>
  );
});

SwapRouteItem.displayName = "SwapRouteItem";

const PreviewSummary = memo(function PreviewSummary({
  previewLoading,
  tradeState,
  exchangeRate,
  pools,
  feeValue,
  sellMetadataSymbol,
  txCost,
  txCostPending,
  createPoolKeyFn,
}: {
  previewLoading: boolean;
  tradeState: TradeState;
  exchangeRate: string | undefined;
  pools: PoolId[];
  feeValue: string;
  sellMetadataSymbol: string;
  txCost: number | null;
  txCostPending: boolean;
  createPoolKeyFn: (pool: PoolId) => string;
}) {
  return (
    <div className={summaryBaseClasses}>
      <div className={summaryEntryClasses}>
        <p>Rate</p>
        {previewLoading || tradeState === TradeState.REEFETCHING ? (
          <Loader color="gray" />
        ) : (
          <p>{exchangeRate}</p>
        )}
      </div>

      <div className={summaryEntryClasses}>
        <p>Order routing</p>
        <div className={routingLineClasses}>
          {previewLoading || tradeState === TradeState.REEFETCHING ? (
            <Loader color="gray" />
          ) : (
            pools.map((pool, i) => (
              <div className={poolsFeeClasses} key={createPoolKeyFn(pool)}>
                <SwapRouteItem pool={pool} />
                {i !== pools.length - 1 && <span>+</span>}
              </div>
            ))
          )}
        </div>
      </div>

      <div className={summaryEntryClasses}>
        <p>Estimated fees</p>
        {previewLoading || tradeState === TradeState.REEFETCHING ? (
          <Loader color="gray" />
        ) : (
          <p>
            {feeValue} {sellMetadataSymbol}
          </p>
        )}
      </div>

      <div className={summaryEntryClasses}>
        <p>Network cost</p>
        {txCostPending ? (
          <Loader color="gray" />
        ) : (
          <p>{txCost?.toFixed(9)} ETH</p>
        )}
      </div>
    </div>
  );
});

PreviewSummary.displayName = "PreviewSummary";

const PriceAndRate = memo(function PriceAndRate({
  reservesPrice,
  previewPrice,
  swapState,
}: {
  reservesPrice: number | undefined;
  previewPrice: number | undefined;
  swapState: SwapState;
}) {
  return (
    <div className="flex justify-between">
      <PriceImpact reservesPrice={reservesPrice} previewPrice={previewPrice} />
      <ExchangeRate swapState={swapState} />
    </div>
  );
});

PriceAndRate.displayName = "PriceAndRate";

const Swap = ({isWidget}: {isWidget?: boolean}) => {
  // Modal hooks
  const [SettingsModal, openSettingsModal, closeSettingsModal] = useModal();
  const [CoinsModal, openCoinsModal, closeCoinsModal] = useModal();
  const [SuccessModal, openSuccess] = useModal();
  const [FailureModal, openFailure, closeFailureModal] = useModal();

  const isClient = useIsClient();

  const initialSwapState = useInitialSwapState(isWidget);

  const [swapState, setSwapState] = useState<SwapState>(initialSwapState);
  const [inputsState, setInputsState] =
    useState<InputsState>(initialInputsState);
  const [activeMode, setActiveMode] = useState<CurrencyBoxMode>("sell");
  const [slippage, setSlippage] = useState<number>(DefaultSlippageValue);
  const [slippageMode, setSlippageMode] = useState<SlippageMode>("auto");
  const [txCostData, setTxCostData] = useState<{
    tx: ScriptTransactionRequest;
    txCost: TransactionCost;
  }>();
  const [txCost, setTxCost] = useState<number | null>(null);
  const [swapButtonTitle, setSwapButtonTitle] = useState<string>("Review");
  const [review, setReview] = useState<boolean>(false);
  const [showInsufficientBalance, setShowInsufficientBalance] =
    useState<boolean>(true);
  const [customErrorTitle, setCustomErrorTitle] = useState<string>("");

  const swapStateForPreview = useRef<SwapState>(swapState);
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
    [balances, swapState.sell.assetId],
  );
  const buyBalance = useMemo(
    () =>
      balances?.find((b) => b.assetId === swapState.buy.assetId)?.amount ??
      bn(0),
    [balances, swapState.buy.assetId],
  );

  const sellMetadata = useAssetMetadata(swapState.sell.assetId);
  const buyMetadata = useAssetMetadata(swapState.buy.assetId);

  const isValidNetwork = useCheckActiveNetwork();
  const {
    trade,
    tradeState,
    error: previewError,
  } = usePreview(swapState, activeMode);

  const pools = useMemo(
    () => trade?.bestRoute?.pools.map((p) => p.poolId) ?? [],
    [trade?.bestRoute?.pools],
  );
  const anotherMode = activeMode === "sell" ? "buy" : "sell";
  const decimals = useMemo(
    () =>
      anotherMode === "sell" ? sellMetadata.decimals : buyMetadata.decimals,
    [anotherMode, sellMetadata.decimals, buyMetadata.decimals],
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

    setSwapState((prev) => {
      const currentOpp = prev[anotherMode].amount;
      if (currentOpp === previewValueString) return prev;
      return {
        ...prev,
        [anotherMode]: {
          ...prev[anotherMode],
          amount: previewValueString,
        },
      };
    });

    setInputsState((prev) => {
      const currentOppInput = prev[anotherMode].amount;
      if (currentOppInput === previewValueString) return prev;
      return {
        ...prev,
        [anotherMode]: {amount: previewValueString},
      };
    });
  }, [previewValueString, anotherMode]);

  const sellValue = inputsState.sell.amount;
  const buyValue = inputsState.buy.amount;

  const setSwapCoins = useCallback(
    (
      updater: (prev: {sell: string | null; buy: string | null}) => {
        sell: string | null;
        buy: string | null;
      },
    ) => {
      const stored = JSON.parse(
        localStorage.getItem("swapCoins") ?? "null",
      ) ?? {
        sell: initialSwapState.sell.assetId,
        buy: initialSwapState.buy.assetId,
      };
      const next = updater(stored);
      localStorage.setItem("swapCoins", JSON.stringify(next));
    },
    [initialSwapState],
  );

  const swapAssets = useCallback(() => {
    setSwapState(({sell, buy}) => ({
      sell: {...buy},
      buy: {...sell},
    }));
    setInputsState(({sell, buy}) => ({
      sell: {...buy},
      buy: {...sell},
    }));
    setActiveMode("sell");
    if (!isWidget) {
      setSwapCoins(({sell, buy}) => ({sell: buy, buy: sell}));
      useAnimationStore.getState().handleMagicTripleClickToken();
    }
  }, [isWidget, setSwapCoins]);

  const selectCoin = useCallback(
    (mode: CurrencyBoxMode) => (assetId: B256Address | null) => {
      const isDuplicate =
        (mode === "buy" && swapState.sell.assetId === assetId) ||
        (mode === "sell" && swapState.buy.assetId === assetId);
      if (isDuplicate) {
        swapAssets();
        return;
      }
      const amount = inputsState[mode].amount;
      setSwapState((prev) => ({
        ...prev,
        [mode]: {assetId, amount},
      }));
      setInputsState((prev) => ({
        ...prev,
        [mode]: {amount},
      }));
      if (!isWidget) {
        setSwapCoins((prev) => ({...prev, [mode]: assetId}));
      }
      setActiveMode(mode);
    },
    [inputsState, isWidget, setSwapCoins, swapAssets, swapState],
  );

  const setAmount = useCallback(
    (mode: CurrencyBoxMode) => (amount: string) => {
      if (!amount) {
        setSwapState((prev) => ({
          sell: {...prev.sell, amount: ""},
          buy: {...prev.buy, amount: ""},
        }));
        setInputsState(initialInputsState);
        setActiveMode(mode);
        return;
      }
      const other = mode === "buy" ? "sell" : "buy";
      setSwapState((prev) => ({
        ...prev,
        [mode]: {...prev[mode], amount},
        [other]: {...prev[other], amount: ""},
      }));
      setInputsState((prev) => ({
        ...prev,
        [mode]: {amount},
        [other]: {amount: ""},
      }));
      if (mode !== activeMode) {
        setActiveMode(mode);
      }
    },
    [activeMode],
  );

  const handleCoinSelectorClick = useCallback(
    (mode: CurrencyBoxMode) => {
      openCoinsModal();
      modeForCoinSelector.current = mode;
    },
    [openCoinsModal],
  );

  const handleCoinSelection = useCallback(
    (assetId: string | null) => {
      const mode = modeForCoinSelector.current;
      selectCoin(mode)(assetId as B256Address);
      closeCoinsModal();
    },
    [selectCoin, closeCoinsModal],
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

  const coinMissing = useMemo(
    () => !swapState.buy.assetId || !swapState.sell.assetId,
    [swapState.buy.assetId, swapState.sell.assetId],
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
      } else {
        openFailure();
      }
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
    txCostData,
    triggerSwap,
    openSuccess,
    openFailure,
    refetchBalances,
    initialSwapState,
    initialInputsState,
    fetchCost,
  ]);

  useEffect(() => {
    if (!sellMetadata.decimals) {
      setShowInsufficientBalance(false);
      return;
    }
    try {
      const parsedSell = bn.parseUnits(sellValue || "0", sellMetadata.decimals);
      const insufficient = sellBalance.lt(parsedSell);
      setShowInsufficientBalance(insufficient);
    } catch {
      setShowInsufficientBalance(false);
    }
  }, [sellValue, sellMetadata.decimals, sellBalance]);

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
  }, [sellValue, sellMetadata.decimals, feePercent]);

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
  ]);

  useEffect(() => {
    if (amountMissing || showInsufficientBalance) {
      setReview(false);
    }
  }, [amountMissing, showInsufficientBalance]);

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
        tradeState !== TradeState.REEFETCHING &&
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
      tradeState === TradeState.REEFETCHING ||
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

  if (!isClient) {
    return (
      <div className={swapAndRateClasses}>
        <Loader color="gray" />
      </div>
    );
  }

  return (
    <>
      <div className={swapAndRateClasses}>
        <div
          className={clsx(
            swapContainerBaseClasses,
            isWidget && swapContainerWidgetClasses,
            swapPending && swapContainerLoadingClasses,
          )}
        >
          <div className={headerBaseClasses}>
            <div className={headerTitleClasses}>
              {isWidget ? <Logo /> : <p>Swap</p>}
            </div>
            <SlippageSetting
              slippage={slippage}
              openSettingsModal={openSettingsModal}
            />
            {isWidget && <ConnectWallet />}
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
            <IconButton className={convertButtonClasses} onClick={swapAssets}>
              <ConvertIcon className="transition-transform duration-300 group-hover:rotate-180" />
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
              sellMetadataSymbol={sellMetadata.symbol}
              txCost={txCost}
              txCostPending={txCostPending}
              createPoolKeyFn={createPoolKey}
            />
          )}

          {!isConnected ? (
            <Button
              onClick={connect}
              loading={isConnecting}
              variant="secondary"
              size="2xl"
            >
              Connect Wallet
            </Button>
          ) : (
            <Button
              disabled={isActionDisabled}
              onClick={handleSwapClick}
              loading={isActionLoading}
              size="2xl"
            >
              {swapButtonTitle}
            </Button>
          )}
        </div>

        <PriceAndRate
          reservesPrice={reservesPrice}
          previewPrice={previewPrice}
          swapState={swapState}
        />
      </div>

      {swapPending && <div className={overlayClasses} />}

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
};

export default Swap;

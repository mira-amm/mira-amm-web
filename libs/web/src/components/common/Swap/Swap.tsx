"use client";

import {useCallback, useEffect, useMemo, useRef, useState, memo} from "react";

import {
  B256Address,
  BN,
  bn,
  ScriptTransactionRequest,
  TransactionCost,
} from "fuels";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {PoolId} from "mira-dex-ts";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";

import {Button} from "@/meshwave-ui/Button";

import {
  CoinsListModal,
  CurrencyBox,
  ExchangeRate,
  SwapSuccessModal,
  SwapFailureModal,
  Logo,
  IconButton,
  Loader,
  SlippageSetting,
  FeatureGuard,
  SettingsModalContent,
  PriceImpact,
  ConnectWallet,
  triggerClassAnimation,
} from "@/src/components/common";

import {createPoolKey, openNewTab} from "@/src/utils/common";

import {PriceImpactNew} from "@/src/components/common/Swap/components/price-impact";

import {FuelAppUrl} from "@/src/utils/constants";

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
  useAssetImage,
  useAssetPrice,
  TradeState,
  useInitialSwapState,
  useDocumentTitle,
} from "@/src/hooks";
import Image from "next/image";

import {useAnimationStore} from "@/src/stores/useGlitchScavengerHunt";
import {ArrowUpDown, LoaderCircle} from "lucide-react";
import {cn} from "@/src/utils/cn";
import {ConnectWalletNew} from "../connect-wallet-new";
import SettingsModalContentNew from "../settings-modal-content-new";
import LoaderBar from "../loader-bar";

export type CurrencyBoxMode = "buy" | "sell";
export type SlippageMode = "auto" | "custom";
export type CurrencyBoxState = {assetId: string | null; amount: string};
export type SwapState = Record<CurrencyBoxMode, CurrencyBoxState>;
export type InputsState = Record<CurrencyBoxMode, {amount: string}>;

// TODO: Remove pool type hardcoding
const poolType = "v2";
const initialInputsState: InputsState = {sell: {amount: ""}, buy: {amount: ""}};

const lineSplitterClasses = "relative w-full h-px bg-background-grey-dark my-4";
const currencyBoxWidgetBg = "bg-background-grey-dark";
const overlayClasses = "fixed inset-0 w-full h-full backdrop-blur-[5px] z-[4]";

const SwapRouteItem = memo(function SwapRouteItem({pool}: {pool: PoolId}) {
  const firstAssetIcon = useAssetImage(pool[0].bits);
  const secondAssetIcon = useAssetImage(pool[1].bits);
  const fee = pool[2] ? 0.05 : 0.3;

  return (
    <div className="flex items-center gap-1">
      <Image
        alt={`${pool[0].bits} icon`}
        src={firstAssetIcon || ""}
        className="-mr-2 h-4 w-4"
        width={16}
        height={16}
      />
      <Image
        alt={`${pool[1].bits} icon`}
        src={secondAssetIcon || ""}
        className="h-4 w-4"
        width={16}
        height={16}
      />
      <p className="text-sm">({fee}%)</p>
    </div>
  );
});

const PriceSummarySkeletonLoader = ({
  className = "w-[50%]",
}: {
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "bg-accent-primary/30 animate-pulse h-3 rounded-md",
        className
      )}
    />
  );
};

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
  reservesPrice,
  previewPrice,
}: {
  previewLoading: boolean;
  tradeState: TradeState;
  exchangeRate: string | null;
  pools: PoolId[];
  feeValue: string;
  sellMetadataSymbol: string;
  txCost: number | null;
  txCostPending: boolean;
  createPoolKeyFn: (pool: PoolId) => string;
  reservesPrice: number | undefined;
  previewPrice: number | undefined;
}) {
  return (
    <div className="flex bg-background-primary dark:bg-background-secondary p-4 rounded-lg flex-col gap-2 text-accent-primary font-alt dark:text-content-tertiary leading-[16px]">
      <div className="flex justify-between">
        <p className="text-sm">Rate:</p>
        {previewLoading || tradeState === TradeState.REFETCHING ? (
          <PriceSummarySkeletonLoader className="w-[65%]" />
        ) : (
          <p className="text-sm">{exchangeRate}</p>
        )}
      </div>

      <div className="flex justify-between">
        <p className="text-sm">Routing:</p>
        {previewLoading || tradeState === TradeState.REFETCHING ? (
          <PriceSummarySkeletonLoader className="w-[35%]" />
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            {pools.map((pool, i) => (
              <div
                className="flex items-center gap-1"
                key={createPoolKeyFn(pool)}
              >
                <SwapRouteItem pool={pool} />
                {i !== pools.length - 1 && <span>+</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <p className="text-sm">Estimated fees:</p>
        {previewLoading || tradeState === TradeState.REFETCHING ? (
          <PriceSummarySkeletonLoader className="w-[35%]" />
        ) : (
          <p className="text-sm">
            {feeValue} {sellMetadataSymbol}
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <p className="text-sm">Gas cost:</p>
        {txCostPending ? (
          <PriceSummarySkeletonLoader className="w-[35%]" />
        ) : (
          <p className="text-sm">{txCost?.toFixed(9)} ETH</p>
        )}
      </div>

      <FeatureGuard>
        <PriceImpactNew
          reservesPrice={reservesPrice}
          previewPrice={previewPrice}
        />
      </FeatureGuard>
    </div>
  );
});

const PriceAndRate = memo(function PriceAndRate({
  swapState,
  reservesPrice,
  previewPrice,
}: {
  swapState: SwapState;
  reservesPrice: number | undefined;
  previewPrice: number | undefined;
}) {
  return (
    <div className="flex justify-between">
      <PriceImpact reservesPrice={reservesPrice} previewPrice={previewPrice} />
      <div className="flex justify-end">
        <ExchangeRate swapState={swapState} />
      </div>
    </div>
  );
});

PriceAndRate.displayName = "PriceAndRate";

const Rate = memo(function Rate({swapState}: {swapState: SwapState}) {
  return (
    <div className="flex justify-end">
      <ExchangeRate swapState={swapState} />
    </div>
  );
});

Rate.displayName = "Rate";

export function Swap({isWidget}: {isWidget?: boolean}) {
  const isClient = useIsClient();
  const initialSwapState = useInitialSwapState(isWidget);
  const [SettingsModal, openSettingsModal, closeSettingsModal] = useModal();
  const [CoinsModal, openCoinsModal, closeCoinsModal] = useModal();
  const [SuccessModal, openSuccess] = useModal();
  const [FailureModal, openFailure, closeFailureModal] = useModal();
  const [swapState, setSwapState] = useState<SwapState>(initialSwapState);
  const [inputsState, setInputsState] =
    useState<InputsState>(initialInputsState);
  const [activeMode, setActiveMode] = useState<CurrencyBoxMode>("sell");
  const [slippage, setSlippage] = useState<number>(100);
  const [slippageMode, setSlippageMode] = useState<SlippageMode>("auto");
  const [txCostData, setTxCostData] = useState<{
    tx: ScriptTransactionRequest;
    txCost: BN;
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
  } = useSwapPreview(swapState, activeMode, poolType);

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
      }
    ) => {
      const stored = JSON.parse(
        localStorage.getItem("swapCoins") ?? "null"
      ) ?? {
        sell: initialSwapState.sell.assetId,
        buy: initialSwapState.buy.assetId,
      };
      const next = updater(stored);
      localStorage.setItem("swapCoins", JSON.stringify(next));
    },
    [initialSwapState]
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
      // Delay the glitch effect to ensure it captures the updated state
      setTimeout(() => {
        useAnimationStore.getState().handleMagicTripleClickToken();
      }, 0);
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
    [inputsState, isWidget, setSwapCoins, swapAssets, swapState]
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
    [activeMode]
  );

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
  } = useSwap({swapState, mode: activeMode, slippage, pools, poolType});

  const resetSwapErrors = useCallback(() => {
    resetTxCost();
    resetSwap();
  }, [resetSwap, resetTxCost]);

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

  const sufficientEthBalance = useCheckEthBalance(swapState.sell);
  const exchangeRate = useExchangeRate(swapState);

  const fetchCost = useCallback(async () => {
    try {
      const data = await fetchTxCost();
      setTxCostData(data);

      if (data?.txCost) {
        setTxCost(data.txCost.toNumber() / 10 ** 9);
      } else {
        setTxCost(null);
      }

      setCustomErrorTitle("");
    } catch (e) {
      console.error(e);
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
        if (result?.isStatusPreConfirmationSuccess) {
          // Preserve current asset selection, only clear amounts
          setSwapState((prev) => ({
            sell: {...prev.sell, amount: ""},
            buy: {...prev.buy, amount: ""},
          }));
          setInputsState({sell: {amount: ""}, buy: {amount: ""}});
          setReview(false);
          openSuccess();
          triggerClassAnimation("dino");
          await refetchBalances();
          // TODO: use variable outputs
          // check this after rebrand
          await result.waitForResult;
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
    fetchCost,
  ]);

  useEffect(() => {
    try {
      const decimals = sellMetadata.decimals;
      const parsedSell = bn.parseUnits(sellValue || "0", decimals);
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
            <Button onClick={connect} disabled={isConnecting} size="2xl">
              Connect Wallet
            </Button>
          ) : (
            <Button
              disabled={isActionDisabled}
              onClick={handleSwapClick}
              size="2xl"
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

import {useConnectUI, useIsConnected} from "@fuels/react";
import {clsx} from "clsx";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useDebounceCallback, useLocalStorage} from "usehooks-ts";

import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import IconButton from "@/src/components/common/IconButton/IconButton";
import CurrencyBox from "@/src/components/common/Swap/components/CurrencyBox/CurrencyBox";
import ConvertIcon from "@/src/components/icons/Convert/ConvertIcon";
import useModal from "@/src/hooks/useModal/useModal";
import useSwap from "@/src/hooks/useSwap/useSwap";

import CoinsListModal from "@/src/components/common/Swap/components/CoinsListModal/CoinsListModal";
import ExchangeRate from "@/src/components/common/Swap/components/ExchangeRate/ExchangeRate";
import SettingsModalContent from "@/src/components/common/Swap/components/SettingsModalContent/SettingsModalContent";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import {useAssetPrice} from "@/src/hooks/useAssetPrice";
import useBalances from "@/src/hooks/useBalances/useBalances";
import useCheckActiveNetwork from "@/src/hooks/useCheckActiveNetwork";
import useCheckEthBalance from "@/src/hooks/useCheckEthBalance/useCheckEthBalance";
import useExchangeRate from "@/src/hooks/useExchangeRate/useExchangeRate";
import useInitialSwapState from "@/src/hooks/useInitialSwapState/useInitialSwapState";
import useReservesPrice from "@/src/hooks/useReservesPrice";
import usePreviewV2 from "@/src/hooks/useSwapPreviewV2";
import {TradeState} from "@/src/hooks/useSwapRouter";
import {openNewTab} from "@/src/utils/common";
import {FuelAppUrl} from "@/src/utils/constants";
import {
  B256Address,
  bn,
  BN,
  ErrorCode,
  FuelError,
  ScriptTransactionRequest,
  TransactionCost,
} from "fuels";
import {SlippageSetting} from "../SlippageSetting/SlippageSetting";
import StatusModal, {ModalType} from "../StatusModal";
import ReviewSwap from "./components/ReviewSwap/ReviewSwap";
import styles from "./Swap.module.css";

export type CurrencyBoxMode = "buy" | "sell";
export type CurrencyBoxState = {
  assetId: string | null;
  amount: string;
};
type InputState = {
  amount: string;
};

export type SwapState = Record<CurrencyBoxMode, CurrencyBoxState>;
type InputsState = Record<CurrencyBoxMode, InputState>;

const initialInputsState: InputsState = {
  sell: {
    amount: "",
  },
  buy: {
    amount: "",
  },
};

export type SlippageMode = "auto" | "custom";

export const DefaultSlippageValue = 100;

const Swap = () => {
  const [SettingsModal, openSettingsModal, closeSettingsModal] = useModal();
  const [CoinsModal, openCoinsModal, closeCoinsModal] = useModal();
  const [SuccessModal, openSuccess] = useModal();
  const [FailureModal, openFailure, closeFailureModal] = useModal();

  const initialSwapState = useInitialSwapState();

  const [swapState, setSwapState] = useState<SwapState>(initialSwapState);
  const [inputsState, setInputsState] =
    useState<InputsState>(initialInputsState);
  const [activeMode, setActiveMode] = useState<CurrencyBoxMode>("sell");
  const [slippage, setSlippage] = useState<number>(DefaultSlippageValue);
  const [txCostData, setTxCostData] = useState<
    {tx: ScriptTransactionRequest; txCost: TransactionCost} | undefined
  >();
  const [txCost, setTxCost] = useState<number | null>(null);
  const [swapButtonTitle, setSwapButtonTitle] = useState<string>("Review");
  const [review, setReview] = useState<boolean>(false);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(true);
  const [customErrorTitle, setCustomErrorTitle] = useState<string>("");

  const [swapCoins, setSwapCoins] = useLocalStorage("swapCoins", {
    sell: initialSwapState.sell.assetId,
    buy: initialSwapState.buy.assetId,
  });

  const sellMetadata = useAssetMetadata(swapState.sell.assetId);
  const buyMetadata = useAssetMetadata(swapState.buy.assetId);

  const previousPreviewValue = useRef("");
  const swapStateForPreview = useRef(swapState);
  const modeForCoinSelector = useRef<CurrencyBoxMode>("sell");

  const {isConnected} = useIsConnected();
  const {connect, isConnecting} = useConnectUI();
  const {balances, balancesPending, refetchBalances} = useBalances();

  const isValidNetwork = useCheckActiveNetwork();

  useEffect(() => {
    if (!isConnected) {
      setSwapState(initialSwapState);
      setInputsState(initialInputsState);
      // setActiveMode("sell");
      // setSlippage(DefaultSlippageValue);
      // setSlippageMode("auto");
      // setTxCost(null);
      previousPreviewValue.current = "";
    }
  }, [isConnected]);

  const sellBalance = balances?.find(
    (b) => b.assetId === swapState.sell.assetId,
  )?.amount;
  const sellBalanceValue = sellBalance ?? new BN(0);
  const buyBalance = balances?.find(
    (b) => b.assetId === swapState.buy.assetId,
  )?.amount;
  const buyBalanceValue = buyBalance ?? new BN(0);

  // const {previewData, previewLoading, previewError, refetchPreview} =
  //   useSwapPreview({
  //     swapState,
  //     mode: activeMode,
  //   });

  const {
    trade,
    tradeState,
    error: previewError,
  } = usePreviewV2(swapState, activeMode);

  const pools = trade?.bestRoute?.pools.map((pool) => pool.poolId);

  const anotherMode = activeMode === "sell" ? "buy" : "sell";
  const decimals =
    anotherMode === "sell" ? sellMetadata.decimals : buyMetadata.decimals;

  const previewValueString2 =
    !trade ||
    tradeState === TradeState.INVALID ||
    tradeState === TradeState.NO_ROUTE_FOUND ||
    !trade?.amountIn ||
    trade?.amountIn?.eq(0) ||
    !trade?.amountOut ||
    trade?.amountOut?.eq(0) ||
    !decimals
      ? ""
      : activeMode === "sell"
        ? trade.amountOut.formatUnits(decimals)
        : trade.amountIn.formatUnits(decimals);

  useEffect(() => {
    if (previewValueString2 !== swapState[anotherMode].amount) {
      setSwapState((prevState) => ({
        ...prevState,
        [anotherMode]: {
          ...prevState[anotherMode],
          amount: previewValueString2,
        },
      }));
    }
  }, [trade, previewValueString2]);
  useEffect(() => {
    if (previewValueString2 !== inputsState[anotherMode].amount) {
      setInputsState((prevState) => ({
        ...prevState,
        [anotherMode]: {
          amount: previewValueString2,
        },
      }));
    }
  }, [trade, previewValueString2]);

  const sellValue = inputsState.sell.amount;
  const buyValue = inputsState.buy.amount;

  const swapAssets = useCallback(() => {
    setSwapState((prevState) => ({
      buy: {
        ...prevState.sell,
      },
      sell: {
        ...prevState.buy,
      },
    }));

    setActiveMode("sell");

    setInputsState((prevState) => ({
      buy: {
        ...prevState.sell,
      },
      sell: {
        ...prevState.buy,
      },
    }));

    setSwapCoins((prevState) => ({
      buy: prevState.sell,
      sell: prevState.buy,
    }));
  }, [setSwapCoins]);

  const selectCoin = useCallback(
    (mode: "buy" | "sell") => {
      return (assetId: B256Address | null) => {
        if (
          (mode === "buy" && swapState.sell.assetId === assetId) ||
          (mode === "sell" && swapState.buy.assetId === assetId)
        ) {
          swapAssets();
        } else {
          const amount = inputsState[mode].amount;
          setSwapState((prevState) => ({
            ...prevState,
            [mode]: {
              amount,
              assetId,
            },
          }));
          setInputsState((prevState) => ({
            ...prevState,
            [mode]: {
              amount,
            },
          }));
        }

        setSwapCoins((prevState) => ({
          ...prevState,
          [mode]: assetId,
        }));

        setActiveMode(mode);
      };
    },
    [
      inputsState,
      setSwapCoins,
      swapAssets,
      swapState.buy.assetId,
      swapState.sell.assetId,
    ],
  );

  const debouncedSetState = useDebounceCallback(setSwapState, 500);
  const setAmount = useCallback(
    (mode: "buy" | "sell") => {
      return (amount: string) => {
        if (amount === "") {
          debouncedSetState((prevState) => ({
            sell: {
              assetId: prevState.sell.assetId,
              amount: "",
            },
            buy: {
              assetId: prevState.buy.assetId,
              amount: "",
            },
          }));

          setInputsState({
            sell: {
              amount: "",
            },
            buy: {
              amount: "",
            },
          });

          previousPreviewValue.current = "";
          setActiveMode(mode);

          return;
        }

        debouncedSetState((prevState) => ({
          ...prevState,
          [mode]: {
            ...prevState[mode],
            amount,
          },
        }));
        setInputsState((prevState) => ({
          ...prevState,
          [mode]: {
            amount,
          },
        }));

        if (mode !== activeMode) {
          setActiveMode(mode);
          previousPreviewValue.current = "";
        }
      };
    },
    [debouncedSetState, activeMode],
  );

  const handleCoinSelectorClick = useCallback(
    (mode: CurrencyBoxMode) => {
      openCoinsModal();
      modeForCoinSelector.current = mode;
    },
    [openCoinsModal],
  );

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
  } = useSwap({
    swapState,
    mode: activeMode,
    slippage,
    pools,
  });

  const resetSwapErrors = useCallback(async () => {
    // await refetchPreview();
    resetTxCost();
    resetSwap();
  }, [resetSwap, resetTxCost]);

  const coinMissing =
    swapState.buy.assetId === null || swapState.sell.assetId === null;
  const amountMissing =
    swapState.buy.amount === "" ||
    swapState.sell.amount === "" ||
    Number(swapState.buy.amount) <= 0 ||
    Number(swapState.sell.amount) <= 0;
  const sufficientEthBalance = useCheckEthBalance(swapState.sell);
  const exchangeRate = useExchangeRate(swapState);

  //Fetches cost during review button click
  const fetchCost = useCallback(async () => {
    try {
      const txCostData = await fetchTxCost();

      setTxCostData(txCostData);

      if (txCostData?.txCost.gasPrice) {
        setTxCost(txCostData.txCost.gasPrice.toNumber() / 10 ** 9);
      }
      setCustomErrorTitle("");
    } catch (e) {
      setCustomErrorTitle("Review failed, please try again");
      setTxCost(null);
      setReview(false);
      setSwapButtonTitle("Review");
      openFailure();
    }
  }, [fetchTxCost, setTxCost, openFailure]);

  const handleSwapClick = useCallback(async () => {
    if (swapButtonTitle === "Review") {
      setReview(true);
      setSwapButtonTitle("Swap");
      fetchCost();
      return;
    } else {
      if (!sufficientEthBalance) {
        openNewTab(
          `${FuelAppUrl}/bridge?from=eth&to=fuel&auto_close=true&=true`,
        );
        return;
      }

      //If the selling amount is 0, the function does not work.
      if (amountMissing || swapPending || exchangeRate === null) {
        return;
      }
      swapStateForPreview.current = swapState;
      try {
        if (txCostData?.tx) {
          const swapResult = await triggerSwap(txCostData.tx);
          if (swapResult) {
            // reset swap form on success
            setSwapState(initialSwapState);
            setInputsState(initialInputsState);
            setReview(false);
            openSuccess();
            await refetchBalances();
          }
        } else {
          openFailure();
        }
      } catch (e) {
        console.error(e);
        if (
          e instanceof Error &&
          !e.message.includes("User canceled sending transaction")
        ) {
          openFailure();
          setSwapButtonTitle("Swap");
        }
      }
    }
  }, [
    sufficientEthBalance,
    amountMissing,
    swapPending,
    swapState,
    triggerSwap,
    openSuccess,
    openFailure,
    refetchBalances,
    swapButtonTitle,
    fetchCost,
    txCostData?.tx,
    exchangeRate,
  ]);

  useEffect(() => {
    try {
      const insufficientSellBalance = sellBalanceValue.lt(
        bn.parseUnits(sellValue, sellMetadata.decimals || 0),
      );
      setShowInsufficientBalance(insufficientSellBalance);
    } catch (e) {}
  }, [sellValue, sellMetadata, sellBalanceValue]);

  const feePercent =
    trade?.bestRoute?.pools.reduce((percent, {poolId}) => {
      const isStablePool = poolId[2];
      const poolPercent = isStablePool ? 0.05 : 0.3;

      return percent + poolPercent;
    }, 0) ?? 0;

  const feeValue =
    sellValue === ""
      ? 0
      : ((feePercent / 100) * parseFloat(sellValue)).toFixed(
          sellMetadata.decimals || 0,
        );

  const swapDisabled =
    !isValidNetwork ||
    coinMissing ||
    showInsufficientBalance ||
    !sellValue ||
    !buyValue ||
    swapButtonTitle === "Input amounts" ||
    tradeState !== TradeState.VALID;
  useEffect(() => {
    let newSwapButtonTitle = "";

    if (!isValidNetwork) {
      newSwapButtonTitle = "Incorrect network";
    } else if (swapPending) {
      newSwapButtonTitle = "Waiting for approval in wallet";
    } else if (showInsufficientBalance) {
      newSwapButtonTitle = "Insufficient balance";
    } else if (!sufficientEthBalance) {
      newSwapButtonTitle = "Bridge more ETH to pay for gas";
    } else if (!review && !amountMissing) {
      newSwapButtonTitle = "Review";
    } else if (amountMissing) {
      newSwapButtonTitle = "Input amounts";
    } else {
      newSwapButtonTitle = swapButtonTitle; // Default to previous title
    }

    setSwapButtonTitle(newSwapButtonTitle);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
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
    const sellNumericValue = parseFloat(swapState.sell.amount);
    const buyNumericValue = parseFloat(swapState.buy.amount);

    if (!isNaN(sellNumericValue) && !isNaN(buyNumericValue)) {
      return buyNumericValue / sellNumericValue;
    }

    return;
  }, [swapState.buy.amount, swapState.sell.amount]);

  const sellAssetPrice = useAssetPrice(swapState.sell.assetId);
  const buyAssetPrice = useAssetPrice(swapState.buy.assetId);

  const isActionDisabled =
    (swapDisabled &&
      // added previewLoading and refetch loading as swapDisabled contains those checks and to avoid disabled effect on button
      !previewLoading &&
      tradeState !== TradeState.REEFETCHING &&
      !balancesPending &&
      (txCostPending || amountMissing)) ||
    showInsufficientBalance;

  //If amount is missing txCostPending is irrelevant
  //If in sufficient fund, previewLoading is irrelevant
  const isActionLoading =
    balancesPending ||
    tradeState === TradeState.REEFETCHING ||
    (previewLoading && swapButtonTitle !== "Insufficient balance") ||
    (!amountMissing && !showInsufficientBalance && txCostPending);

  // Swap succcess and failure error message for the modal
  const calculateModalContent = () => {
    const currentState = swapStateForPreview.current;
    const successModalSubtitle = `${currentState.sell.amount} ${sellMetadata.symbol} for ${currentState.buy.amount} ${buyMetadata.symbol}`;

    let errorMessage = "An error occurred. Please try again.";
    const error = txCostError || swapError;
    if (error instanceof FuelError) {
      errorMessage = error.message;
      if (
        error.code === ErrorCode.SCRIPT_REVERTED &&
        (error.message.includes("Insufficient output amount") ||
          error.message.includes("Exceeding input amount"))
      ) {
        errorMessage = "Slippage exceeds limit. Adjust settings and try again.";
      }
    } else if (error?.message === "User rejected the transaction!") {
      errorMessage =
        "You closed your wallet before sending the transaction. Try again?";
    }

    return [successModalSubtitle, errorMessage];
  };

  const [successModalSubtitle, errorMessage] = calculateModalContent();

  return (
    <>
      <div className={styles.swapAndRate}>
        <div
          className={clsx(
            styles.swapContainer,
            swapPending && styles.swapContainerLoading,
          )}
        >
          <div className={styles.heading}>
            <p className={styles.title}>Swap</p>
            <SlippageSetting
              slippage={slippage}
              openSettingsModal={openSettingsModal}
            />
          </div>
          <CurrencyBox
            value={sellValue}
            assetId={swapState.sell.assetId}
            mode="sell"
            balance={sellBalanceValue}
            setAmount={setAmount("sell")}
            loading={inputPreviewLoading || swapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
            usdRate={sellAssetPrice.price}
            previewError={
              activeMode === "buy" && !inputPreviewLoading ? previewError : null
            }
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
            balance={buyBalanceValue}
            setAmount={setAmount("buy")}
            loading={outputPreviewLoading || swapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
            usdRate={buyAssetPrice.price}
            previewError={
              activeMode === "sell" && !outputPreviewLoading
                ? previewError
                : null
            }
          />
          {review && (
            <ReviewSwap
              tradeState={tradeState}
              exchangeRate={exchangeRate}
              pools={pools}
              feeValue={feeValue}
              sellMetadataSymbol={sellMetadata.symbol}
              txCostPending={txCostPending}
              txCost={txCost}
              reservesPrice={reservesPrice}
              previewPrice={previewPrice}
            />
          )}

          {!isConnected && (
            <ActionButton
              variant="primary"
              onClick={connect}
              loading={isConnecting}
            >
              Connect Wallet
            </ActionButton>
          )}
          {isConnected && (
            <ActionButton
              variant="primary"
              disabled={isActionDisabled}
              onClick={handleSwapClick}
              loading={isActionLoading}
              className={clsx(isActionLoading && styles.btnLoading)}
            >
              {swapButtonTitle}
            </ActionButton>
          )}
        </div>
        <div className={styles.rates}>
          <ExchangeRate swapState={swapState} />
        </div>
      </div>
      {swapPending && <div className={styles.loadingOverlay} />}
      <SettingsModal title={`Slippage tolerance: ${slippage / 100}%`}>
        <SettingsModalContent slippage={slippage} setSlippage={setSlippage} />
      </SettingsModal>
      <CoinsModal title="Choose token">
        <CoinsListModal selectCoin={handleCoinSelection} balances={balances} />
      </CoinsModal>
      <SuccessModal title={<></>}>
        <StatusModal
          subTitle={successModalSubtitle}
          type={ModalType.SUCCESS}
          title="Swap success"
          transactionHash={swapResult?.id}
        />
      </SuccessModal>
      <FailureModal title={<></>} onClose={resetSwapErrors}>
        <StatusModal
          subTitle={errorMessage}
          type={ModalType.ERROR}
          title="Swap failure"
        />
      </FailureModal>
    </>
  );
};

export default Swap;

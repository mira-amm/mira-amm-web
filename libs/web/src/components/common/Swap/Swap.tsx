import {useConnectUI, useIsConnected} from "@fuels/react";
import {clsx} from "clsx";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useLocalStorage} from "usehooks-ts";

import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import IconButton from "@/src/components/common/IconButton/IconButton";
import ConvertIcon from "@/src/components/icons/Convert/ConvertIcon";
import useModal from "@/src/hooks/useModal/useModal";
import useSwap from "@/src/hooks/useSwap/useSwap";
import useExchangeRate from "@/src/hooks/useExchangeRate/useExchangeRate";
import {openNewTab} from "@/src/utils/common";
import useBalances from "@/src/hooks/useBalances/useBalances";
import CoinsListModal from "@/src/components/common/Swap/components/CoinsListModal/CoinsListModal";
import SettingsModalContent from "@/src/components/common/Swap/components/SettingsModalContent/SettingsModalContent";
import useCheckEthBalance from "@/src/hooks/useCheckEthBalance/useCheckEthBalance";
import useInitialSwapState from "@/src/hooks/useInitialSwapState/useInitialSwapState";
import useCheckActiveNetwork from "@/src/hooks/useCheckActiveNetwork";
import usePreview from "@/src/hooks/useSwapPreviewV2";
import {FuelAppUrl} from "@/src/utils/constants";
import useReservesPrice from "@/src/hooks/useReservesPrice";
import {useAssetPrice} from "@/src/hooks/useAssetPrice";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import {PoolId} from "mira-dex-ts";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import {SlippageSetting} from "../SlippageSetting/SlippageSetting";
import ConnectButton from "@/src/components/common/ConnectButton/ConnectButton";
import {TradeState} from "@/src/hooks/useSwapRouter";
import {
  B256Address,
  bn,
  BN,
  ErrorCode,
  FuelError,
  ScriptTransactionRequest,
  TransactionCost,
} from "fuels";
import StatusModal, {ModalType} from "../StatusModal";
import ReviewSwap from "./components/ReviewSwap/ReviewSwap";

import styles from "./Swap.module.css";
import CurrencyBox from "../CurrencyBox/CurrencyBox";
import ExchangeRate from "./components/ExchangeRate/ExchangeRate";
import MiraTextLogo from "../../icons/Logo/MiraTextLogo";

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

function SwapRouteItem({pool}: {pool: PoolId}) {
  const firstAssetIcon = useAssetImage(pool[0].bits);
  const secondAssetIcon = useAssetImage(pool[1].bits);

  const firstAssetMetadata = useAssetMetadata(pool[0].bits);
  const secondAssetMetadata = useAssetMetadata(pool[1].bits);

  const isStablePool = pool[2];
  const poolFeePercent = isStablePool ? 0.05 : 0.3;

  return (
    <>
      <img src={firstAssetIcon || ""} alt={firstAssetMetadata.symbol} />
      <img src={secondAssetIcon || ""} alt={secondAssetMetadata.symbol} />
      <p>({poolFeePercent}%)</p>
    </>
  );
}

const Swap = ({isWidget}: {isWidget?: boolean}) => {
  const [SettingsModal, openSettingsModal, closeSettingsModal] = useModal();
  const [CoinsModal, openCoinsModal, closeCoinsModal] = useModal();
  const [SuccessModal, openSuccess] = useModal();
  const [FailureModal, openFailure, closeFailureModal] = useModal();

  const initialSwapState = useInitialSwapState(isWidget);

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

  const [, setSwapCoins] = useLocalStorage("swapCoins", {
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

  const {
    trade,
    tradeState,
    error: previewError,
  } = usePreview(swapState, activeMode);

  const pools = trade?.bestRoute?.pools.map((pool) => pool.poolId);

  const anotherMode = activeMode === "sell" ? "buy" : "sell";
  const decimals =
    anotherMode === "sell" ? sellMetadata.decimals : buyMetadata.decimals;

  const previewValueString =
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
    if (previewValueString !== swapState[anotherMode].amount) {
      setSwapState((prevState) => ({
        ...prevState,
        [anotherMode]: {
          ...prevState[anotherMode],
          amount: previewValueString,
        },
      }));
    }
  }, [trade, previewValueString, swapState]);
  useEffect(() => {
    if (previewValueString !== inputsState[anotherMode].amount) {
      setInputsState((prevState) => ({
        ...prevState,
        [anotherMode]: {
          amount: previewValueString,
        },
      }));
    }
  }, [trade, previewValueString, inputsState]);

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

    if (isWidget) {
      return;
    }

    setSwapCoins((prevState) => ({
      buy: prevState.sell,
      sell: prevState.buy,
    }));
  }, [isWidget, setSwapCoins]);

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

          if (isWidget) {
            return;
          }
          setSwapCoins((prevState) => ({
            ...prevState,
            [mode]: assetId,
          }));

          setActiveMode(mode);
        }
      };
    },
    [
      inputsState,
      isWidget,
      setSwapCoins,
      swapAssets,
      swapState.buy.assetId,
      swapState.sell.assetId,
    ],
  );

  const setAmount = useCallback(
    (mode: "buy" | "sell") => {
      return (amount: string) => {
        if (amount === "") {
          setSwapState((prevState) => ({
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

        const otherMode = mode === "buy" ? "sell" : "buy";

        // resetting other mode's amounts as on user's input, the other mode amount will be recalculated
        setSwapState((prevState) => ({
          ...prevState,
          [mode]: {
            ...prevState[mode],
            amount,
          },
          [otherMode]: {
            ...prevState[otherMode],
            amount: "",
          },
        }));
        setInputsState((prevState) => ({
          ...prevState,
          [mode]: {
            amount,
          },
          [otherMode]: {
            amount: "",
          },
        }));

        if (mode !== activeMode) {
          setActiveMode(mode);
          previousPreviewValue.current = "";
        }
      };
    },
    [setSwapState, activeMode],
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
    if (previewError) newSwapButtonTitle = previewError;
    else if (amountMissing && !swapPending) {
      newSwapButtonTitle = "Input amounts";
    } else if (!isValidNetwork) {
      newSwapButtonTitle = "Incorrect network";
    } else if (swapPending) {
      newSwapButtonTitle = "Waiting for approval in wallet";
    } else if (showInsufficientBalance) {
      newSwapButtonTitle = "Insufficient balance";
    } else if (!sufficientEthBalance) {
      newSwapButtonTitle = "Bridge more ETH to pay for gas";
    } else if (!review && !amountMissing) {
      newSwapButtonTitle = "Review";
    } else {
      newSwapButtonTitle = swapButtonTitle; // Default to previous title
    }

    setSwapButtonTitle(newSwapButtonTitle);

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
    showInsufficientBalance ||
    swapPending;

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
    const successModalSubtitle = (
      <>
        <span className="mc-mono-m">{currentState.sell.amount}</span>{" "}
        <span className="mc-type-m">{sellMetadata.symbol}</span> for{" "}
        <span className="mc-mono-m">{currentState.buy.amount}</span>{" "}
        <span className="mc-type-m">{buyMetadata.symbol}</span>
      </>
    );
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
      <div>
        <div
          className={clsx(
            styles.swapContainer,
            isWidget && styles.widgetSwapContainer,
            swapPending && styles.swapContainerLoading,
          )}
        >
          <div className={styles.heading}>
            <div className={styles.title}>
              {isWidget ? (
                <MiraTextLogo primaryColor="black" />
              ) : (
                <p className={"mc-type-l"}>Swap</p>
              )}
            </div>
            <SlippageSetting
              slippage={slippage}
              openSettingsModal={openSettingsModal}
              isDisabled={swapPending}
            />
            {isWidget && (
              <ConnectButton className={styles.connectWallet} isWidget />
            )}
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
            className={isWidget ? styles.widgetBoxBg : undefined}
          />
          <div className={styles.splitter}>
            <IconButton
              onClick={swapPending ? () => {} : swapAssets}
              className={styles.convertButton}
            >
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
            className={isWidget ? styles.widgetBoxBg : undefined}
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

          <ExchangeRate swapState={swapState} className={styles.rates} />

          {!isConnected && (
            <ActionButton
              variant="primary"
              onClick={connect}
              loading={isConnecting}
              size={"big"}
              fullWidth
            >
              Connect Wallet
            </ActionButton>
          )}
          {isConnected && (
            <ActionButton
              variant="primary"
              disabled={isActionDisabled}
              className={clsx(
                isWidget && isActionDisabled ? styles.widgetBoxBg : undefined,
              )}
              onClick={handleSwapClick}
              loading={isActionLoading}
              size={"big"}
              fullWidth
            >
              {swapButtonTitle}
            </ActionButton>
          )}
        </div>
      </div>
      <SettingsModal
        title={`Slippage tolerance: ${slippage / 100}%`}
        size={"regular"}
        className={styles.settingsModal}
      >
        <SettingsModalContent slippage={slippage} setSlippage={setSlippage} />
      </SettingsModal>
      <CoinsModal
        title="Choose token"
        size="regular"
        className={styles.coinsModal}
      >
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

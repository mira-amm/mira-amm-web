import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useConnectUI, useIsConnected} from "@fuels/react";
import {useDebounceCallback, useLocalStorage} from "usehooks-ts";
import {clsx} from "clsx";

import CurrencyBox from "@/src/components/common/Swap/components/CurrencyBox/CurrencyBox";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import ConvertIcon from "@/src/components/icons/Convert/ConvertIcon";
import IconButton from "@/src/components/common/IconButton/IconButton";
import useModal from "@/src/hooks/useModal/useModal";
import useSwap from "@/src/hooks/useSwap/useSwap";

import styles from "./Swap.module.css";
import ExchangeRate from "@/src/components/common/Swap/components/ExchangeRate/ExchangeRate";
import useExchangeRate from "@/src/hooks/useExchangeRate/useExchangeRate";
import {createPoolKey, openNewTab} from "@/src/utils/common";
import useBalances from "@/src/hooks/useBalances/useBalances";
import CoinsListModal from "@/src/components/common/Swap/components/CoinsListModal/CoinsListModal";
import SwapSuccessModal from "@/src/components/common/Swap/components/SwapSuccessModal/SwapSuccessModal";
import SettingsModalContent from "@/src/components/common/Swap/components/SettingsModalContent/SettingsModalContent";
import useCheckEthBalance from "@/src/hooks/useCheckEthBalance/useCheckEthBalance";
import useInitialSwapState from "@/src/hooks/useInitialSwapState/useInitialSwapState";
import useCheckActiveNetwork from "@/src/hooks/useCheckActiveNetwork";
import useSwapPreview from "@/src/hooks/useSwapPreview";
import PriceImpact from "@/src/components/common/Swap/components/PriceImpact/PriceImpact";
import {FuelAppUrl} from "@/src/utils/constants";
import useReservesPrice from "@/src/hooks/useReservesPrice";
import SwapFailureModal from "@/src/components/common/Swap/components/SwapFailureModal/SwapFailureModal";
import {B256Address, bn, BN} from "fuels";
import {PoolId} from "mira-dex-ts";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import {useAssetPrice} from "@/src/hooks/useAssetPrice";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import {SlippageSetting} from "../SlippageSetting/SlippageSetting";
import Loader from "@/src/components/common/Loader/Loader";
import {ScriptTransactionRequest, TransactionCost} from "fuels";

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
  const [slippageMode, setSlippageMode] = useState<SlippageMode>("auto");
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

  const {previewData, previewLoading, previewError, refetchPreview} =
    useSwapPreview({
      swapState,
      mode: activeMode,
    });
  const anotherMode = activeMode === "sell" ? "buy" : "sell";
  const decimals =
    anotherMode === "sell" ? sellMetadata.decimals : buyMetadata.decimals;
  const previewValueString =
    previewData !== null
      ? previewData.previewAmount.eq(0)
        ? ""
        : previewData.previewAmount.formatUnits(decimals || 0)
      : previousPreviewValue.current;
  previousPreviewValue.current = previewValueString;
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
  }, [previewData, previewValueString]);
  useEffect(() => {
    if (previewValueString !== inputsState[anotherMode].amount) {
      setInputsState((prevState) => ({
        ...prevState,
        [anotherMode]: {
          amount: previewValueString,
        },
      }));
    }
  }, [previewData, previewValueString]);

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
        setActiveMode(mode);
      };
    },
    [debouncedSetState],
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
    pools: previewData?.pools,
  });

  const resetSwapErrors = useCallback(async () => {
    await refetchPreview();
    resetTxCost();
    resetSwap();
  }, [refetchPreview, resetSwap, resetTxCost]);

  const coinMissing =
    swapState.buy.assetId === null || swapState.sell.assetId === null;
  const amountMissing =
    swapState.buy.amount === "" || swapState.sell.amount === "";
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
      setShowInsufficientBalance(
        insufficientSellBalance && sufficientEthBalance,
      );
    } catch (e) {}
  }, [sellValue, sellMetadata, sufficientEthBalance, sellBalanceValue]);

  const feePercent =
    previewData?.pools.reduce((percent, pool) => {
      const isStablePool = pool[2];
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
    Boolean(previewError) ||
    !sellValue ||
    !buyValue ||
    previewLoading;

  useEffect(() => {
    if (!isValidNetwork) {
      setSwapButtonTitle("Incorrect network");
    } else if (swapPending) {
      setSwapButtonTitle("Waiting for approval in wallet");
    } else if (!sufficientEthBalance || showInsufficientBalance) {
      setSwapButtonTitle("Insufficient balance");
    } else if (!review && !amountMissing) {
      setSwapButtonTitle("Review");
    } else if (amountMissing) {
      setSwapButtonTitle("Input amounts");
    }
  }, [
    isValidNetwork,
    showInsufficientBalance,
    sufficientEthBalance,
    swapPending,
    review,
    amountMissing,
  ]);

  useEffect(() => {
    if (amountMissing) {
      setReview(false);
    }
  }, [amountMissing]);

  const inputPreviewLoading = previewLoading && activeMode === "buy";
  const outputPreviewLoading = previewLoading && activeMode === "sell";

  const {reservesPrice} = useReservesPrice({
    pools: previewData?.pools,
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
    swapDisabled &&
    !previewLoading &&
    !balancesPending &&
    (txCostPending || amountMissing);

  //If amount is missing txCostPending is irrelevant
  //If in sufficient fund, previewLoading is irrelevant
  const isActionLoading =
    balancesPending ||
    (previewLoading && swapButtonTitle !== "Insufficient balance") ||
    (!amountMissing && txCostPending);

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
            <div className={styles.summary}>
              <div className={styles.summaryEntry}>
                <p>Rate</p>
                {previewLoading ? (
                  <Loader color="gray" />
                ) : (
                  <p>{exchangeRate}</p>
                )}
              </div>

              <div className={styles.summaryEntry}>
                <p>Order routing</p>
                <div className={styles.feeLine}>
                  {previewLoading ? (
                    <Loader color="gray" />
                  ) : (
                    previewData?.pools.map((pool, index) => {
                      const poolKey = createPoolKey(pool);

                      return (
                        <div className={styles.poolsFee} key={poolKey}>
                          <SwapRouteItem pool={pool} />
                          {index !== previewData.pools.length - 1 && "+"}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className={styles.summaryEntry}>
                <p>Estimated fees</p>
                {previewLoading ? (
                  <Loader color="gray" />
                ) : (
                  <p>
                    {feeValue} {sellMetadata.symbol}
                  </p>
                )}
              </div>

              <div className={styles.summaryEntry}>
                <p>Network cost</p>
                {txCostPending ? (
                  <Loader color="gray" />
                ) : (
                  <p>{txCost?.toFixed(9)} ETH</p>
                )}
              </div>
            </div>
          )}

          {!isConnected && (
            <ActionButton
              variant="secondary"
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
            >
              {swapButtonTitle}
            </ActionButton>
          )}
        </div>
        <div className={styles.rates}>
          <PriceImpact
            reservesPrice={reservesPrice}
            previewPrice={previewPrice}
          />
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

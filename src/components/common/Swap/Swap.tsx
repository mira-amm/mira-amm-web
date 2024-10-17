import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { useConnectUI, useIsConnected } from "@fuels/react";
import { useDebounceCallback, useLocalStorage } from "usehooks-ts";
import { clsx } from "clsx";

import CurrencyBox from "@/src/components/common/Swap/components/CurrencyBox/CurrencyBox";
import SettingsIcon from "@/src/components/icons/Settings/SettingsIcon";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import ConvertIcon from "@/src/components/icons/Convert/ConvertIcon";
import IconButton from "@/src/components/common/IconButton/IconButton";
import useModal from "@/src/hooks/useModal/useModal";
import { CoinName, coinsConfig } from "@/src/utils/coinsConfig";
import useSwap from "@/src/hooks/useSwap/useSwap";

import styles from "./Swap.module.css";
import ExchangeRate from "@/src/components/common/Swap/components/ExchangeRate/ExchangeRate";
import useExchangeRate from "@/src/hooks/useExchangeRate/useExchangeRate";
import {createPoolKey, getAssetNameByAssetId, openNewTab} from "@/src/utils/common";
import useBalances from "@/src/hooks/useBalances/useBalances";
import CoinsListModal from "@/src/components/common/Swap/components/CoinsListModal/CoinsListModal";
import SwapSuccessModal from "@/src/components/common/Swap/components/SwapSuccessModal/SwapSuccessModal";
import SettingsModalContent from "@/src/components/common/Swap/components/SettingsModalContent/SettingsModalContent";
import useCheckEthBalance from "@/src/hooks/useCheckEthBalance/useCheckEthBalance";
import useInitialSwapState from "@/src/hooks/useInitialSwapState/useInitialSwapState";
import useCheckActiveNetwork from "@/src/hooks/useCheckActiveNetwork";
import useSwapPreview from "@/src/hooks/useSwapPreview";
import PriceImpact from "@/src/components/common/Swap/components/PriceImpact/PriceImpact";
import useUSDRate from "@/src/hooks/useUSDRate";
import {FuelAppUrl} from "@/src/utils/constants";
import useReservesPrice from "@/src/hooks/useReservesPrice";
import SwapFailureModal from "@/src/components/common/Swap/components/SwapFailureModal/SwapFailureModal";
import {BN, FuelError} from "fuels";

export type CurrencyBoxMode = "buy" | "sell";
export type CurrencyBoxState = {
  coin: CoinName;
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

export const DefaultSlippageValue = 1;

const Swap = () => {
  const [SettingsModal, openSettingsModal, closeSettingsModal] = useModal();
  const [CoinsModal, openCoinsModal, closeCoinsModal] = useModal();
  const [SuccessModal, openSuccess] = useModal();
  const [FailureModal, openFailure, closeFailureModal] = useModal();

  const initialSwapState = useInitialSwapState();

  const [swapState, setSwapState] = useState<SwapState>(initialSwapState);
  const [inputsState, setInputsState] = useState<InputsState>(initialInputsState);
  const [activeMode, setActiveMode] = useState<CurrencyBoxMode>("sell");
  const [slippage, setSlippage] = useState<number>(DefaultSlippageValue);
  const [txCost, setTxCost] = useState<number | null>(null);
  const [slippageMode, setSlippageMode] = useState<SlippageMode>("auto");

  const [swapCoins, setSwapCoins] = useLocalStorage("swapCoins", {
    sell: initialSwapState.sell.coin,
    buy: initialSwapState.buy.coin,
  });

  const previousPreviewValue = useRef("");
  const swapStateForPreview = useRef(swapState);
  const modeForCoinSelector = useRef<CurrencyBoxMode>("sell");

  const { isConnected } = useIsConnected();
  const { connect, isConnecting } = useConnectUI();
  const { balances, balancesPending, refetchBalances } = useBalances();

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

  const sellBalance = balances?.find((b) => b.assetId === coinsConfig.get(swapState.sell.coin)?.assetId)?.amount;
  const sellBalanceValue = sellBalance ?? new BN(0);
  const buyBalance = balances?.find((b) => b.assetId === coinsConfig.get(swapState.buy.coin)?.assetId)?.amount;
  const buyBalanceValue = buyBalance ?? new BN(0);

  const {
    previewData,
    previewLoading,
    previewError,
    refetchPreview,
  } = useSwapPreview({
    swapState,
    mode: activeMode
  });
  const anotherMode = activeMode === "sell" ? "buy" : "sell";
  const decimals =
    anotherMode === "sell" ? coinsConfig.get(swapState.sell.coin)?.decimals! : coinsConfig.get(swapState.buy.coin)?.decimals!;
  const normalizedPreviewValue = previewData && previewData.previewAmount / 10 ** decimals;
  const previewValueString =
    normalizedPreviewValue !== null
      ? normalizedPreviewValue === 0
        ? ""
        : normalizedPreviewValue.toFixed(decimals)
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
  }, [previewValueString]);
  useEffect(() => {
    if (previewValueString !== inputsState[anotherMode].amount) {
      setInputsState((prevState) => ({
        ...prevState,
        [anotherMode]: {
          amount: previewValueString,
        },
      }));
    }
  }, [previewValueString]);

  const sellDecimals = coinsConfig.get(swapState.sell.coin)?.decimals!;
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

    setActiveMode('sell');

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
      return (coin: CoinName) => {
        if (
          (mode === "buy" && swapState.sell.coin === coin) ||
          (mode === "sell" && swapState.buy.coin === coin)
        ) {
          swapAssets();
        } else {
          const decimals = coinsConfig.get(coin)?.decimals!;
          const amount = inputsState[mode].amount.substring(0, inputsState[mode].amount.indexOf(".") + decimals + 1);
          setSwapState((prevState) => ({
            ...prevState,
            [mode]: {
              amount,
              coin,
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
          [mode]: coin,
        }));

        setActiveMode(mode);
      };
    },
    [inputsState, setSwapCoins, swapAssets, swapState.buy.coin, swapState.sell.coin]
  );

  const debouncedSetState = useDebounceCallback(setSwapState, 500);
  const setAmount = useCallback(
    (mode: "buy" | "sell") => {
      return (amount: string) => {
        // if (amount === '') {
        //   debouncedSetState(prevState => ({
        //     'sell': {
        //       coin: prevState.sell.coin,
        //       amount: '',
        //     },
        //     'buy': {
        //       coin: prevState.buy.coin,
        //       amount: '',
        //     },
        //   }));
        //
        //   setInputsState({
        //     'sell': {
        //       amount: '',
        //     },
        //     'buy': {
        //       amount: '',
        //     },
        //   });
        //
        //   previousPreviewValue.current = '';
        //   setActiveMode(mode);
        //
        //   return;
        // }

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
    [debouncedSetState]
  );

  const handleCoinSelectorClick = useCallback(
    (mode: CurrencyBoxMode) => {
      openCoinsModal();
      modeForCoinSelector.current = mode;
    },
    [openCoinsModal]
  );

  const handleCoinSelection = (coin: CoinName | null) => {
    selectCoin(modeForCoinSelector.current)(coin);
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

  const coinMissing = swapState.buy.coin === null || swapState.sell.coin === null;
  const amountMissing = swapState.buy.amount === "" || swapState.sell.amount === "";
  const sufficientEthBalance = useCheckEthBalance(swapState.sell);
  const handleSwapClick = useCallback(async () => {
    if (!sufficientEthBalance) {
      openNewTab(`${FuelAppUrl}/bridge?from=eth&to=fuel&auto_close=true&=true`);
      return;
    }

    if (amountMissing || swapPending) {
      return;
    }

    swapStateForPreview.current = swapState;
    try {
      const txCostData = await fetchTxCost();

      if (txCostData?.txCost.gasPrice) {
        setTxCost(txCostData.txCost.gasPrice.toNumber() / 10 ** 9);
      }

      if (txCostData?.tx) {
        const swapResult = await triggerSwap(txCostData.tx);
        if (swapResult) {
          openSuccess();
          await refetchBalances();
        }
      }
    } catch (e) {
      console.error(e);
      if (e instanceof Error && !e.message.includes('User canceled sending transaction')) {
        openFailure();
      }
    }
  }, [
    sufficientEthBalance,
    amountMissing,
    swapPending,
    swapState,
    fetchTxCost,
    triggerSwap,
    openSuccess,
    openFailure,
    refetchBalances
  ]);

  const insufficientSellBalance = sellBalanceValue.lt(parseFloat(sellValue));
  const showInsufficientBalance = insufficientSellBalance && sufficientEthBalance;

  let swapButtonTitle = "Swap";
  if (!isValidNetwork) {
    swapButtonTitle = "Incorrect network";
  } else if (swapPending) {
    swapButtonTitle = "Waiting for approval in wallet";
  } else if (!sufficientEthBalance) {
    swapButtonTitle = "Bridge more ETH to pay for gas";
  } else if (showInsufficientBalance) {
    swapButtonTitle = "Insufficient balance";
  }

  const swapDisabled =
    !isValidNetwork || coinMissing || showInsufficientBalance || Boolean(previewError) || !sellValue || !buyValue;

  const exchangeRate = useExchangeRate(swapState);
  const feePercent = previewData?.pools.reduce((percent, pool) => {
    const isStablePool = pool[2];
    const poolPercent = isStablePool ? 0.05 : 0.3;

    return percent + poolPercent;
  }, 0) ?? 0;
  const feeValue = ((feePercent / 100) * parseFloat(sellValue)).toFixed(sellDecimals);

  const inputPreviewLoading = previewLoading && activeMode === "buy";
  const outputPreviewLoading = previewLoading && activeMode === "sell";

  const { reservesPrice } = useReservesPrice({ pools: previewData?.pools, assetName: swapState.sell.coin });

  const previewPrice = useMemo(() => {
    const sellNumericValue = parseFloat(swapState.sell.amount);
    const buyNumericValue = parseFloat(swapState.buy.amount);

    if (!isNaN(sellNumericValue) && !isNaN(buyNumericValue)) {
      return buyNumericValue / sellNumericValue;
    }

    return;
  }, [swapState.buy.amount, swapState.sell.amount]);

  const { ratesData } = useUSDRate(swapState.sell.coin, swapState.buy.coin);
  const firstAssetRate = ratesData?.find((item) => item.asset === swapState.sell.coin)?.rate;
  const secondAssetRate = ratesData?.find((item) => item.asset === swapState.buy.coin)?.rate;

  return (
    <>
      <div className={styles.swapAndRate}>
        <div className={clsx(styles.swapContainer, swapPending && styles.swapContainerLoading)}>
          <div className={styles.heading}>
            <p className={styles.title}>Swap</p>
            <p className={styles.slippageLabel}>{slippage}% slippage</p>
            <IconButton onClick={openSettingsModal} className={styles.settingsButton}>
              <SettingsIcon />
            </IconButton>
          </div>
          <CurrencyBox
            value={sellValue}
            coin={swapState.sell.coin}
            mode="sell"
            balance={sellBalanceValue}
            setAmount={setAmount("sell")}
            loading={inputPreviewLoading || swapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
            usdRate={firstAssetRate}
            previewError={activeMode === 'buy' && !inputPreviewLoading ? previewError : null}
          />
          <div className={styles.splitter}>
            <IconButton onClick={swapAssets} className={styles.convertButton}>
              <ConvertIcon />
            </IconButton>
          </div>
          <CurrencyBox
            value={buyValue}
            coin={swapState.buy.coin}
            mode="buy"
            balance={buyBalanceValue}
            setAmount={setAmount("buy")}
            loading={outputPreviewLoading || swapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
            usdRate={secondAssetRate}
            previewError={activeMode === 'sell' && !outputPreviewLoading ? previewError : null}
          />
          {swapPending && (
            <div className={styles.summary}>
              <div className={styles.summaryEntry}>
                <p>Rate</p>
                <p>{exchangeRate}</p>
              </div>

              <div className={styles.summaryEntry}>
                <p>Order routing</p>
                <div className={styles.feeLine}>
                  {previewData?.pools.map((pool, index) => {
                    const isStablePool = pool[2];
                    const poolFeePercent = isStablePool ? 0.05 : 0.3;
                    const firstAssetName = getAssetNameByAssetId(pool[0].bits);
                    const secondAssetName = getAssetNameByAssetId(pool[1].bits);
                    // TODO: Add fallback icon if asset icon is not found
                    const firstAssetIcon = coinsConfig.get(firstAssetName)?.icon!;
                    const secondAssetIcon = coinsConfig.get(secondAssetName)?.icon!;
                    const poolKey = createPoolKey(pool);

                    return (
                      <div className={styles.poolsFee} key={poolKey}>
                        <img src={firstAssetIcon} alt={firstAssetName}/>
                        <img src={secondAssetIcon} alt={secondAssetName}/>
                        <p>
                          ({poolFeePercent}%)
                        </p>
                        {index !== previewData.pools.length - 1 && "+"}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.summaryEntry}>
                <p>Estimated fees</p>
                <p>
                  {feeValue} {swapState.sell.coin}
                </p>
              </div>

              <div className={styles.summaryEntry}>
                <p>Network cost</p>
                <p>{txCost?.toFixed(9)} ETH</p>
              </div>
            </div>
          )}
          {!isConnected && (
            <ActionButton variant="secondary" onClick={connect} loading={isConnecting}>
              Connect Wallet
            </ActionButton>
          )}
          {isConnected && (
            <ActionButton variant="primary" disabled={swapDisabled} onClick={handleSwapClick}
                          loading={balancesPending || txCostPending}>
              {swapButtonTitle}
            </ActionButton>
          )}
        </div>
        <div className={styles.rates}>
          <PriceImpact reservesPrice={reservesPrice} previewPrice={previewPrice}/>
          <ExchangeRate swapState={swapState}/>
        </div>
      </div>
      {swapPending && <div className={styles.loadingOverlay}/>}
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
        <CoinsListModal selectCoin={handleCoinSelection} balances={balances}/>
      </CoinsModal>
      <SuccessModal title={<></>}>
        <SwapSuccessModal swapState={swapStateForPreview.current} transactionHash={swapResult?.id}/>
      </SuccessModal>
      <FailureModal title={<></>} onClose={resetSwapErrors}>
        <SwapFailureModal error={txCostError || swapError} closeModal={closeFailureModal} />
      </FailureModal>
    </>
  );
};

export default Swap;

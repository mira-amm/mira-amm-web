import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useAccount, useConnectUI, useIsConnected } from "@fuels/react";
import { useDebounceCallback, useLocalStorage } from "usehooks-ts";
import { clsx } from "clsx";

import CurrencyBox from "@/src/components/common/Swap/components/CurrencyBox/CurrencyBox";
import SettingsIcon from "@/src/components/icons/Settings/SettingsIcon";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import ConvertIcon from "@/src/components/icons/Convert/ConvertIcon";
import IconButton from "@/src/components/common/IconButton/IconButton";
import useModal from "@/src/hooks/useModal/useModal";
import useExactInputPreview from "@/src/hooks/useExactInputPreview/useExactInputPreview";
import useExactOutputPreview from "@/src/hooks/useExactOutputPreview/useExactOutputPreview";
import { CoinName, coinsConfig } from "@/src/utils/coinsConfig";
import useSwap from "@/src/hooks/useSwap/useSwap";

import styles from "./Swap.module.css";
import ExchangeRate from "@/src/components/common/Swap/components/ExchangeRate/ExchangeRate";
import useExchangeRate from "@/src/hooks/useExchangeRate/useExchangeRate";
import { openNewTab } from "@/src/utils/common";
import useBalances from "@/src/hooks/useBalances/useBalances";
import CoinsListModal from "@/src/components/common/Swap/components/CoinsListModal/CoinsListModal";
import SwapSuccessModal from "@/src/components/common/Swap/components/SwapSuccessModal/SwapSuccessModal";
import TestnetLabel from "@/src/components/common/TestnetLabel/TestnetLabel";
import SettingsModalContent from "@/src/components/common/Swap/components/SettingsModalContent/SettingsModalContent";
import useCheckEthBalance from "@/src/hooks/useCheckEthBalance/useCheckEthBalance";
import useInitialSwapState from "@/src/hooks/useInitialSwapState/useInitialSwapState";
import useFaucetLink from "@/src/hooks/useFaucetLink";
import { InsufficientReservesError } from "mira-dex-ts/dist/sdk/errors";
import { PriceImpact } from "./components/PriceImpact/PriceImpact";

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

const Swap = () => {
  const [SettingsModal, openSettingsModal] = useModal();
  const [CoinsModal, openCoinsModal, closeCoinsModal] = useModal();
  const [SuccessModal, openSuccess] = useModal();

  const initialSwapState = useInitialSwapState();

  const [swapState, setSwapState] = useState<SwapState>(initialSwapState);
  const [inputsState, setInputsState] =
    useState<InputsState>(initialInputsState);
  const [lastFocusedMode, setLastFocusedMode] =
    useState<CurrencyBoxMode>("sell");
  const [slippage, setSlippage] = useState<number>(1);
  const [txCost, setTxCost] = useState<number | null>(null);

  const [swapCoins, setSwapCoins] = useLocalStorage("swapCoins", {
    sell: initialSwapState.sell.coin,
    buy: initialSwapState.buy.coin,
  });

  const previousInputPreviewValue = useRef("");
  const previousOutputPreviewValue = useRef("");
  const swapStateForPreview = useRef(swapState);
  const modeForCoinSelector = useRef<CurrencyBoxMode>("sell");

  const { isConnected } = useIsConnected();
  const { connect, isConnecting } = useConnectUI();
  const { account } = useAccount();
  const { balances, isPending, refetch } = useBalances();

  const sellBalance = balances
    ?.find((b) => b.assetId === coinsConfig.get(swapState.sell.coin)?.assetId)
    ?.amount.toNumber();
  const sellBalanceValue = sellBalance
    ? sellBalance / 10 ** coinsConfig.get(swapState.sell.coin)?.decimals!
    : 0;
  const buyBalance = balances
    ?.find((b) => b.assetId === coinsConfig.get(swapState.buy.coin)?.assetId)
    ?.amount.toNumber();
  const buyBalanceValue = buyBalance
    ? buyBalance / 10 ** coinsConfig.get(swapState.buy.coin)?.decimals!
    : 0;

  const {
    data: inputPreviewData,
    isFetching: inputPreviewIsFetching,
    error: inputPreviewError,
  } = useExactInputPreview({
    swapState,
    sellAmount: swapState.sell.amount
      ? parseFloat(swapState.sell.amount)
      : null,
    lastFocusedMode,
  });
  const buyDecimals = coinsConfig.get(swapState.buy.coin)?.decimals!;
  const inputPreviewValue =
    inputPreviewData && inputPreviewData[1].toNumber() / 10 ** buyDecimals;
  const inputPreviewValueString =
    inputPreviewValue !== undefined
      ? inputPreviewValue === 0
        ? ""
        : inputPreviewValue.toFixed(buyDecimals)
      : previousInputPreviewValue.current;
  previousInputPreviewValue.current = inputPreviewValueString;
  const buyValue =
    lastFocusedMode === "sell"
      ? inputPreviewValueString
      : inputsState.buy.amount;
  if (buyValue !== swapState.buy.amount) {
    setSwapState((prevState) => ({
      ...prevState,
      buy: {
        ...prevState.buy,
        amount: buyValue,
      },
    }));
  }

  const {
    data: outputPreviewData,
    isFetching: outputPreviewIsFetching,
    error: outputPreviewError,
  } = useExactOutputPreview({
    swapState,
    buyAmount: swapState.buy.amount ? parseFloat(swapState.buy.amount) : null,
    lastFocusedMode,
  });
  const sellDecimals = coinsConfig.get(swapState.sell.coin)?.decimals!;
  const outputPreviewValue =
    outputPreviewData && outputPreviewData[1].toNumber() / 10 ** sellDecimals;
  const outputPreviewValueString =
    outputPreviewValue !== undefined
      ? outputPreviewValue === 0
        ? ""
        : outputPreviewValue.toFixed(sellDecimals)
      : previousOutputPreviewValue.current;
  previousOutputPreviewValue.current = outputPreviewValueString;
  const sellValue =
    lastFocusedMode === "buy"
      ? outputPreviewValueString
      : inputsState.sell.amount;
  if (sellValue !== swapState.sell.amount) {
    setSwapState((prevState) => ({
      ...prevState,
      sell: {
        ...prevState.sell,
        amount: sellValue,
      },
    }));
  }

  // const changeCoins = () => {
  //   setSwapState(prevState => ({
  //     buy: {
  //       ...prevState.buy,
  //       coin: prevState.sell.coin,
  //     },
  //     sell: {
  //       ...prevState.sell,
  //       coin: prevState.buy.coin,
  //     },
  //   }));
  //
  //   const params = new URLSearchParams(searchParams.toString());
  //   if (swapState.sell.coin) {
  //     params.set('buy', swapState.sell.coin ?? '');
  //   }
  //   if (swapState.buy.coin) {
  //     params.set('sell', swapState.buy.coin ?? '');
  //   }
  //   router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  // };

  const swapAssets = useCallback(() => {
    setSwapState((prevState) => ({
      buy: {
        ...prevState.sell,
      },
      sell: {
        ...prevState.buy,
      },
    }));

    // setLastFocusedMode(lastFocusedMode === 'buy' ? 'sell' : 'buy');

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
          const amount = inputsState[mode].amount.substring(
            0,
            inputsState[mode].amount.indexOf(".") + decimals + 1
          );
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

        setLastFocusedMode(mode);
      };
    },
    [
      inputsState,
      setSwapCoins,
      swapAssets,
      swapState.buy.coin,
      swapState.sell.coin,
    ]
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
        //   setLastFocusedMode(mode);
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
        setLastFocusedMode(mode);
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

  const { fetchTxCost, triggerSwap, swapPending, swapResult } = useSwap({
    swapState,
    mode: lastFocusedMode,
    slippage,
  });

  const coinMissing =
    swapState.buy.coin === null || swapState.sell.coin === null;
  const amountMissing =
    swapState.buy.amount === "" || swapState.sell.amount === "";
  const sufficientEthBalance = useCheckEthBalance(swapState.sell);
  const faucetLink = useFaucetLink();
  const handleSwapClick = useCallback(async () => {
    if (!sufficientEthBalance) {
      openNewTab(faucetLink);
      return;
    }

    if (amountMissing || swapPending) {
      return;
    }

    swapStateForPreview.current = swapState;
    const txCostData = await fetchTxCost();

    if (txCostData?.txCost.gasPrice) {
      setTxCost(txCostData.txCost.gasPrice.toNumber() / 10 ** 9);
    }

    if (txCostData?.tx) {
      const swapResult = await triggerSwap(txCostData.tx);
      if (swapResult) {
        openSuccess();
        await refetch();
      }
    }
  }, [
    sufficientEthBalance,
    amountMissing,
    swapPending,
    swapState,
    fetchTxCost,
    triggerSwap,
    account,
    openSuccess,
    refetch,
  ]);

  const insufficientSellBalance = parseFloat(sellValue) > sellBalanceValue;
  const ethWithZeroBalanceSelected =
    swapState.sell.coin === "ETH" &&
    balances
      ?.find((b) => b.assetId === coinsConfig.get("ETH")?.assetId)
      ?.amount.toNumber() === 0;
  const showInsufficientBalance =
    insufficientSellBalance && !ethWithZeroBalanceSelected;
  const previewError = inputPreviewError || outputPreviewError;
  const insufficientReserves =
    previewError instanceof InsufficientReservesError;

  let swapButtonTitle = "Swap";
  if (swapPending) {
    swapButtonTitle = "Waiting for approval in wallet";
  } else if (insufficientReserves) {
    swapButtonTitle = "Insufficient reserves in pool";
  } else if (showInsufficientBalance) {
    swapButtonTitle = "Insufficient balance";
  } else if (!sufficientEthBalance) {
    swapButtonTitle = "Claim some ETH to pay for gas";
  }

  const swapDisabled =
    coinMissing || showInsufficientBalance || insufficientReserves;

  const feePercentage = 0.3;
  const exchangeRate = useExchangeRate(swapState);
  const feeValue = ((feePercentage / 100) * parseFloat(sellValue)).toFixed(
    sellDecimals
  );

  const calculatedPrice = useMemo(() => {
    if (!exchangeRate) {
      return null;
    }
    const parts = exchangeRate.split('≈');
    if (parts.length < 2) {
      return 0;
    }
    const priceStr = parts[1].trim().split(' ')[0];
    const price = parseFloat(priceStr);
    console.log(price)
    return price || 0;
  }, [exchangeRate]);

  const previewPrice = useMemo(() => {
    if (lastFocusedMode === 'sell' && inputPreviewValue && parseFloat(swapState.sell.amount)) {
      console.log(inputPreviewValue)
      console.log(inputPreviewValue / parseFloat(swapState.sell.amount));
      return inputPreviewValue / parseFloat(swapState.sell.amount);
    } else if (lastFocusedMode === 'buy' && outputPreviewValue && parseFloat(swapState.buy.amount)) {
      console.log(outputPreviewValue)
      console.log(parseFloat(swapState.buy.amount) / outputPreviewValue);
      return parseFloat(swapState.buy.amount) / outputPreviewValue;
    }
    return 0;
  }, [lastFocusedMode, inputPreviewValue, outputPreviewValue, swapState]);

  return (
    <>
      <div className={styles.swapAndRate}>
        <div
          className={clsx(
            styles.swapContainer,
            swapPending && styles.swapContainerLoading
          )}
        >
          <div className={styles.heading}>
            <p className={styles.title}>Swap</p>
            <IconButton
              onClick={openSettingsModal}
              className={styles.settingsButton}
            >
              <SettingsIcon />
            </IconButton>
          </div>
          <CurrencyBox
            value={sellValue}
            coin={swapState.sell.coin}
            mode="sell"
            balance={sellBalanceValue}
            setAmount={setAmount("sell")}
            loading={outputPreviewIsFetching || swapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
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
            loading={inputPreviewIsFetching || swapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
          />
          {swapPending && (
            <div className={styles.summary}>
              <div className={styles.summaryEntry}>
                <p>Rate</p>
                <p>{exchangeRate}</p>
              </div>
              <div className={styles.summaryEntry}>
                <p>Fee ({feePercentage}%)</p>
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
              disabled={swapDisabled}
              onClick={handleSwapClick}
              loading={isPending}
            >
              {swapButtonTitle}
            </ActionButton>
          )}
        </div>
        <div className={styles.rates}>
          {calculatedPrice && <PriceImpact
            calculatedPrice={calculatedPrice}
            previewPrice={previewPrice}
          />}
          <ExchangeRate swapState={swapState} />
        </div>
      </div>
      {swapPending && <div className={styles.loadingOverlay} />}
      <SettingsModal title="Settings">
        <SettingsModalContent slippage={slippage} setSlippage={setSlippage} />
      </SettingsModal>
      <CoinsModal title="Choose token">
        <CoinsListModal selectCoin={handleCoinSelection} balances={balances} />
      </CoinsModal>
      <SuccessModal title={<TestnetLabel />}>
        <SwapSuccessModal
          swapState={swapStateForPreview.current}
          transactionHash={swapResult?.id}
        />
      </SuccessModal>
    </>
  );
};

export default Swap;

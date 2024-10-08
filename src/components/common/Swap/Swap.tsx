import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getAssetNameByAssetId, openNewTab } from "@/src/utils/common";
import useBalances from "@/src/hooks/useBalances/useBalances";
import CoinsListModal from "@/src/components/common/Swap/components/CoinsListModal/CoinsListModal";
import SwapSuccessModal from "@/src/components/common/Swap/components/SwapSuccessModal/SwapSuccessModal";
import SettingsModalContent from "@/src/components/common/Swap/components/SettingsModalContent/SettingsModalContent";
import useCheckEthBalance from "@/src/hooks/useCheckEthBalance/useCheckEthBalance";
import useInitialSwapState from "@/src/hooks/useInitialSwapState/useInitialSwapState";
import useFaucetLink from "@/src/hooks/useFaucetLink";
import { InsufficientReservesError } from "mira-dex-ts/dist/sdk/errors";
import useCheckActiveNetwork from "@/src/hooks/useCheckActiveNetwork";
import useSwapPreview from "@/src/hooks/useSwapPreview";
import usePoolsMetadata from "@/src/hooks/usePoolsMetadata";
import PriceImpact from "@/src/components/common/Swap/components/PriceImpact/PriceImpact";
import useUSDRate from "@/src/hooks/useUSDRate";
import {FuelAppUrl} from "@/src/utils/constants";

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

  const initialSwapState = useInitialSwapState();

  const [swapState, setSwapState] = useState<SwapState>(initialSwapState);
  const [inputsState, setInputsState] = useState<InputsState>(initialInputsState);
  const [lastFocusedMode, setLastFocusedMode] = useState<CurrencyBoxMode>("sell");
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
  const { balances, isPending, refetch } = useBalances();

  const isValidNetwork = useCheckActiveNetwork();

  const sellBalance = balances?.find((b) => b.assetId === coinsConfig.get(swapState.sell.coin)?.assetId)?.amount.toNumber();
  const sellBalanceValue = sellBalance ? sellBalance / 10 ** coinsConfig.get(swapState.sell.coin)?.decimals! : 0;
  const buyBalance = balances?.find((b) => b.assetId === coinsConfig.get(swapState.buy.coin)?.assetId)?.amount.toNumber();
  const buyBalanceValue = buyBalance ? buyBalance / 10 ** coinsConfig.get(swapState.buy.coin)?.decimals! : 0;

  const { previewData, previewFetching, previewError } = useSwapPreview({ swapState, mode: lastFocusedMode });
  const anotherMode = lastFocusedMode === "sell" ? "buy" : "sell";
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

  const sellDecimals = coinsConfig.get(swapState.sell.coin)?.decimals!;
  const sellValue = lastFocusedMode === "buy" ? previewValueString : inputsState.sell.amount;
  const buyValue = lastFocusedMode === "sell" ? previewValueString : inputsState.buy.amount;

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
        if ((mode === "buy" && swapState.sell.coin === coin) || (mode === "sell" && swapState.buy.coin === coin)) {
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

        setLastFocusedMode(mode);
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
    pools: previewData?.pools,
  });

  const coinMissing = swapState.buy.coin === null || swapState.sell.coin === null;
  const amountMissing = swapState.buy.amount === "" || swapState.sell.amount === "";
  const sufficientEthBalance = useCheckEthBalance(swapState.sell);
  const faucetLink = useFaucetLink();
  const handleSwapClick = useCallback(async () => {
    if (!sufficientEthBalance) {
      openNewTab(`${FuelAppUrl}/bridge?from=eth&to=fuel&auto_close=true&=true`);
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
  }, [sufficientEthBalance, amountMissing, swapPending, swapState, fetchTxCost, faucetLink, triggerSwap, openSuccess, refetch]);

  const insufficientSellBalance = parseFloat(sellValue) > sellBalanceValue;
  const ethWithZeroBalanceSelected =
    swapState.sell.coin === "ETH" &&
    balances?.find((b) => b.assetId === coinsConfig.get("ETH")?.assetId)?.amount.toNumber() === 0;
  const showInsufficientBalance = insufficientSellBalance && !ethWithZeroBalanceSelected;
  const insufficientReserves = previewError instanceof InsufficientReservesError;

  let swapButtonTitle = "Swap";
  if (!isValidNetwork) {
    swapButtonTitle = "Incorrect network";
  } else if (swapPending) {
    swapButtonTitle = "Waiting for approval in wallet";
  } else if (insufficientReserves) {
    swapButtonTitle = "Insufficient reserves in pool";
  } else if (showInsufficientBalance) {
    swapButtonTitle = "Insufficient balance";
  } else if (!sufficientEthBalance) {
    swapButtonTitle = "Bridge more ETH to pay for gas";
  }

  const swapDisabled =
    !isValidNetwork || coinMissing || showInsufficientBalance || insufficientReserves || !sellValue || !buyValue;

  const feePercentage = 0.3;
  const exchangeRate = useExchangeRate(swapState);
  const feeValue = ((feePercentage / 100) * parseFloat(sellValue)).toFixed(sellDecimals);

  const inputPreviewPending = previewFetching && lastFocusedMode === "buy";
  const outputPreviewPending = previewFetching && lastFocusedMode === "sell";

  const { poolsMetadata } = usePoolsMetadata(previewData?.pools);

  const reservedPrice = useMemo(() => {
    if (!poolsMetadata) {
      return null;
    }

    let previousAssetId: string | null = null;
    const sellAssetId = coinsConfig.get(swapState.sell.coin)?.assetId;

    const rates: number[] = [];

    poolsMetadata.forEach((poolMetadata) => {
      if (!poolMetadata) {
        return;
      }

      const { poolId, reserve0, reserve1 } = poolMetadata;
      if (!previousAssetId) {
        previousAssetId = poolId[0].bits === sellAssetId ? poolId[0].bits : poolId[1].bits;
      }

      const previousAssetReserve = poolId[0].bits === previousAssetId ? reserve0 : reserve1;
      const previousAsset = getAssetNameByAssetId(poolId[0].bits === previousAssetId ? poolId[0].bits : poolId[1].bits);
      const previousAssetDecimals = coinsConfig.get(previousAsset)?.decimals;
      const previousAssetNormalized = previousAssetReserve.toNumber() / 10 ** previousAssetDecimals!;

      const nextAssetReserve = poolId[0].bits === previousAssetId ? reserve1 : reserve0;
      const nextAsset = getAssetNameByAssetId(poolId[0].bits === previousAssetId ? poolId[1].bits : poolId[0].bits);
      const nextAssetDecimals = coinsConfig.get(nextAsset)?.decimals;
      const nextAssetNormalized = nextAssetReserve.toNumber() / 10 ** nextAssetDecimals!;

      rates.push(previousAssetNormalized / nextAssetNormalized);
    });

    return rates.reduce((acc, rate) => acc * rate, 1);
  }, [poolsMetadata, swapState.sell.coin]);

  const previewPrice = useMemo(() => {
    const sellNumericValue = parseFloat(swapState.sell.amount);
    const buyNumericValue = parseFloat(swapState.buy.amount);

    if (!isNaN(sellNumericValue) && !isNaN(buyNumericValue)) {
      return sellNumericValue / buyNumericValue;
    }

    return null;
  }, [swapState.buy.amount, swapState.sell.amount]);

  const { ratesData } = useUSDRate(swapState.sell.coin, swapState.buy.coin);
  const firstAssetRate = ratesData?.find((item) => item.asset === swapState.sell.coin)?.rate;
  const secondAssetRate = ratesData?.find((item) => item.asset === swapState.buy.coin)?.rate;
  const swapUnavailable = previewError instanceof Error;

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
            loading={inputPreviewPending || swapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
            usdRate={firstAssetRate}
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
            loading={outputPreviewPending || swapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
            usdRate={secondAssetRate}
            swapUnavailable={swapUnavailable}
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
            <ActionButton variant="secondary" onClick={connect} loading={isConnecting}>
              Connect Wallet
            </ActionButton>
          )}
          {isConnected && (
            <ActionButton variant="primary" disabled={swapDisabled} onClick={handleSwapClick} loading={isPending}>
              {swapButtonTitle}
            </ActionButton>
          )}
        </div>
        <div className={styles.rates}>
          <PriceImpact reservedPrice={reservedPrice} previewPrice={previewPrice} />
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
    </>
  );
};

export default Swap;

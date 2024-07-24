import {useCallback, useRef, useState} from "react";
import {useAccount, useConnectUI, useIsConnected} from "@fuels/react";
import {useDebounceCallback} from "usehooks-ts";
import {clsx} from "clsx";

import CurrencyBox from "@/src/components/common/Swap/components/CurrencyBox/CurrencyBox";
import SettingsIcon from "@/src/components/icons/Settings/SettingsIcon";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import ConvertIcon from "@/src/components/icons/Convert/ConvertIcon";
import IconButton from "@/src/components/common/IconButton/IconButton";
import useModal from "@/src/hooks/useModal/useModal";
import useExactInputPreview from "@/src/hooks/useExactInputPreview/useExactInputPreview";
import useExactOutputPreview from "@/src/hooks/useExactOutputPreview/useExactOutputPreview";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import useSwap from "@/src/hooks/useSwap/useSwap";

import styles from "./Swap.module.css";
import ExchangeRate from "@/src/components/common/Swap/components/ExchangeRate/ExchangeRate";
import useExchangeRate from "@/src/hooks/useExchangeRate/useExchangeRate";
import {openNewTab} from "@/src/utils/common";
import useBalances from "@/src/hooks/useBalances/useBalances";
import CoinsListModal from "@/src/components/common/Swap/components/CoinsListModal/CoinsListModal";
import SwapSuccessModal from "@/src/components/common/Swap/components/SwapSuccessModal/SwapSuccessModal";
import TestnetLabel from "@/src/components/common/TestnetLabel/TestnetLabel";
import SettingsModalContent from "@/src/components/common/Swap/components/SettingsModalContent/SettingsModalContent";

export type CurrencyBoxMode = "buy" | "sell";
export type CurrencyBoxState = {
  coin: CoinName;
  amount: string;
};
type InputState = {
  amount: string;
}

export type SwapState = Record<CurrencyBoxMode, CurrencyBoxState>;
type InputsState = Record<CurrencyBoxMode, InputState>;

const initialSwapState: SwapState = {
  sell: {
    coin: 'USDC',
    amount: '',
  },
  buy: {
    coin: 'BTC',
    amount: '',
  },
};

const initialInputsState: InputsState = {
  sell: {
    amount: '',
  },
  buy: {
    amount: '',
  },
};

const Swap = () => {
  const [SettingsModal, openSettingsModal] = useModal();
  const [CoinsModal, openCoinsModal, closeCoinsModal] = useModal();
  const [SuccessModal, openSuccess] = useModal();

  const [swapState, setSwapState] = useState<SwapState>(initialSwapState);
  const [inputsState, setInputsState] = useState<InputsState>(initialInputsState);
  const [lastFocusedMode, setLastFocusedMode] = useState<CurrencyBoxMode>('sell');
  const [slippage, setSlippage] = useState<number>(1);

  const previousInputPreviewValue = useRef('');
  const previousOutputPreviewValue = useRef('');
  const swapStateForPreview = useRef(swapState);

  const {isConnected} = useIsConnected();
  const {connect, isConnecting} = useConnectUI();
  const {account} = useAccount();
  const {balances, isPending, refetch} = useBalances();

  const ethAssetId = coinsConfig.get('ETH')?.assetId!;
  const ethBalance = balances?.find(b => b.assetId === ethAssetId)?.amount.toNumber();
  const sellBalance = balances?.find(b => b.assetId === coinsConfig.get(swapState.sell.coin)?.assetId)?.amount.toNumber();
  const sellBalanceValue = sellBalance ? sellBalance / 10 ** coinsConfig.get(swapState.sell.coin)?.decimals! : 0;
  const buyBalance = balances?.find(b => b.assetId === coinsConfig.get(swapState.buy.coin)?.assetId)?.amount.toNumber();
  const buyBalanceValue = buyBalance ? buyBalance / 10 ** coinsConfig.get(swapState.buy.coin)?.decimals! : 0;

  const {data: inputPreviewData, isFetching: inputPreviewIsFetching} = useExactInputPreview({
    swapState,
    sellAmount: swapState.sell.amount ? parseFloat(swapState.sell.amount) : null,
    lastFocusedMode,
  });
  const buyDecimals = coinsConfig.get(swapState.buy.coin)?.decimals!;
  const inputPreviewValue = inputPreviewData && inputPreviewData.other_asset.amount.toNumber() / 10 ** buyDecimals;
  const inputPreviewValueString = inputPreviewValue ? inputPreviewValue.toString() : previousInputPreviewValue.current;
  previousInputPreviewValue.current = inputPreviewValueString;
  const buyValue = lastFocusedMode === 'sell' ? inputPreviewValueString : inputsState.buy.amount;
  if (buyValue !== swapState.buy.amount) {
    setSwapState(prevState => ({
      ...prevState,
      buy: {
        ...prevState.buy,
        amount: buyValue,
      },
    }));
  }

  const {data: outputPreviewData, isFetching: outputPreviewIsFetching} = useExactOutputPreview({
    swapState,
    buyAmount: swapState.buy.amount ? parseFloat(swapState.buy.amount) : null,
    lastFocusedMode,
  });
  const sellDecimals = coinsConfig.get(swapState.sell.coin)?.decimals!;
  const outputPreviewValue = outputPreviewData && outputPreviewData.other_asset.amount.toNumber() / 10 ** sellDecimals;
  const outputPreviewValueString = outputPreviewValue ? outputPreviewValue.toString() : previousOutputPreviewValue.current;
  previousOutputPreviewValue.current = outputPreviewValueString;
  const sellValue = lastFocusedMode === 'buy' ? outputPreviewValueString : inputsState.sell.amount;
  if (sellValue !== swapState.sell.amount) {
    setSwapState(prevState => ({
      ...prevState,
      sell: {
        ...prevState.sell,
        amount: sellValue,
      },
    }));
  }

  const changeCoins = () => {
    setSwapState(prevState => ({
      buy: {
        ...prevState.buy,
        coin: prevState.sell.coin,
      },
      sell: {
        ...prevState.sell,
        coin: prevState.buy.coin,
      },
    }));
  };

  const swapAssets = useCallback(() => {
    setSwapState(prevState => ({
      buy: {
        ...prevState.sell
      },
      sell: {
        ...prevState.buy
      },
    }));
    // setLastFocusedMode(lastFocusedMode === 'buy' ? 'sell' : 'buy');
  }, []);

  const selectCoin = useCallback((mode: "buy" | "sell") => {
    return (coin: string) => {
      if (
        (mode === "buy" && swapState.sell.coin === coin) ||
        (mode === "sell" && swapState.buy.coin === coin)
      ) {
        changeCoins();
      } else {
        setSwapState(prevState => ({
          ...prevState,
          [mode]: {
            ...prevState[mode],
            coin
          }
        }));
      }
      setLastFocusedMode(mode);
    };
  }, [swapState]);

  const debouncedSetState = useDebounceCallback(setSwapState, 500);
  const setAmount = useCallback((mode: "buy" | "sell") => {
    return (amount: string) => {
      debouncedSetState(prevState => ({
        ...prevState,
        [mode]: {
          ...prevState[mode],
          amount
        }
      }));
      setInputsState(prevState => ({
        ...prevState,
        [mode]: {
          amount
        }
      }));
      setLastFocusedMode(mode);
    };
  }, [debouncedSetState]);

  const handleCoinSelectorClick = useCallback((mode: CurrencyBoxMode) => {
    openCoinsModal();
    setLastFocusedMode(mode);
  }, [openCoinsModal]);

  const handleCoinSelection = (coin: string) => {
    selectCoin(lastFocusedMode)(coin);
    closeCoinsModal();
  };

  const {mutateAsync, data: swapData, isPending: isSwapPending} = useSwap({swapState, mode: lastFocusedMode, slippage});

  // @ts-ignore
  const coinMissing = swapState.buy.coin === '' || swapState.sell.coin === '';
  const amountMissing = swapState.buy.amount === '' || swapState.sell.amount === '';
  const insufficientEthBalance = !ethBalance || ethBalance === 0;
  const handleSwapClick = useCallback(async () => {
    if (insufficientEthBalance) {
      openNewTab(`https://faucet-testnet.fuel.network/?address=${account}`);
      return;
    }

    if (coinMissing || amountMissing || isSwapPending) {
      return;
    }

    swapStateForPreview.current = swapState;
    const data = await mutateAsync();

    if (data) {
      openSuccess();
      await refetch();
    }
  }, [
    insufficientEthBalance,
    coinMissing,
    amountMissing,
    isSwapPending,
    swapState,
    mutateAsync,
    account,
    openSuccess,
    refetch,
  ]);

  const insufficientSellBalance = parseFloat(sellValue) > sellBalanceValue;

  let swapButtonTitle = 'Swap';
  if (isSwapPending) {
    swapButtonTitle = 'Waiting for approval in wallet';
  } else if (insufficientEthBalance) {
    swapButtonTitle = 'Claim some ETH to pay for gas';
  } else if (insufficientSellBalance) {
    swapButtonTitle = 'Insufficient balance';
  }

  const exchangeRate = useExchangeRate(swapState);

  return (
    <>
      <div className={styles.swapAndRate}>
        <div className={clsx(styles.swapContainer, isSwapPending && styles.swapContainerLoading)}>
          <div className={styles.heading}>
            <p className={styles.title}>Swap</p>
            <IconButton onClick={openSettingsModal} className={styles.settingsButton}>
              <SettingsIcon/>
            </IconButton>
          </div>
          <CurrencyBox
            value={sellValue}
            coin={swapState.sell.coin}
            mode="sell"
            balance={sellBalanceValue}
            setAmount={setAmount('sell')}
            loading={outputPreviewIsFetching || isSwapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
          />
          <div className={styles.splitter}>
            <IconButton onClick={swapAssets} className={styles.convertButton}>
              <ConvertIcon/>
            </IconButton>
          </div>
          <CurrencyBox
            value={buyValue}
            coin={swapState.buy.coin}
            mode="buy"
            balance={buyBalanceValue}
            setAmount={setAmount('buy')}
            loading={inputPreviewIsFetching || isSwapPending}
            onCoinSelectorClick={handleCoinSelectorClick}
          />
          {isSwapPending && (
            <div className={styles.summary}>
              <div className={styles.summaryEntry}>
                <p>Rate</p>
                <p>{exchangeRate}</p>
              </div>
              <div className={styles.summaryEntry}>
                <p>Fee (0.25%)</p>
                <p>&lt;0.01$</p>
              </div>
              <div className={styles.summaryEntry}>
                <p>Network cost</p>
                <p>&lt;0.01$</p>
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
              disabled={insufficientSellBalance}
              onClick={handleSwapClick}
              loading={isPending}
            >
              {swapButtonTitle}
            </ActionButton>
          )}
        </div>
        <ExchangeRate swapState={swapState} />
      </div>
      {isSwapPending && <div className={styles.loadingOverlay}/>}
      <SettingsModal title="Settings">
        <SettingsModalContent slippage={slippage} setSlippage={setSlippage}/>
      </SettingsModal>
      <CoinsModal title="Choose token">
        <CoinsListModal selectCoin={handleCoinSelection} balances={balances}/>
      </CoinsModal>
      <SuccessModal title={<TestnetLabel/>}>
        <SwapSuccessModal swapState={swapStateForPreview.current} transactionHash={swapData?.id}/>
      </SuccessModal>
    </>
  );
};

export default Swap;

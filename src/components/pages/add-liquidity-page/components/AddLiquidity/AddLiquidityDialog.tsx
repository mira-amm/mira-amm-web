import styles from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidity.module.css";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import CoinInput from "@/src/components/pages/add-liquidity-page/components/CoinInput/CoinInput";
import {clsx} from "clsx";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import useBalances from "@/src/hooks/useBalances/useBalances";
import useCoinBalance from "@/src/hooks/useCoinBalance";
import {useConnectUI, useIsConnected} from "@fuels/react";
import usePreviewAddLiquidity from "@/src/hooks/usePreviewAddLiquidity";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useDebounceCallback} from "usehooks-ts";

type Props = {
  firstCoin: CoinName;
  secondCoin: CoinName;
  setPreviewData: any;
}

const AddLiquidityDialog = ({ firstCoin, secondCoin, setPreviewData }: Props) => {
  const { isConnected, isPending: isConnecting } = useIsConnected();
  const { connect } = useConnectUI();
  const { balances } = useBalances();

  const { coinBalanceValue: firstCoinBalanceValue } = useCoinBalance(balances, firstCoin);
  const { coinBalanceValue: secondCoinBalanceValue } = useCoinBalance(balances, secondCoin);

  const [firstAmount, setFirstAmount] = useState('');
  const [firstAmountInput, setFirstAmountInput] = useState('');
  const [secondAmount, setSecondAmount] = useState('');
  const [secondAmountInput, setSecondAmountInput] = useState('');
  const [activeCoin, setActiveCoin] = useState<CoinName | null>(null);

  const isFirstToken = activeCoin === firstCoin;

  const { data, isFetching } = usePreviewAddLiquidity({
    firstCoin,
    secondCoin,
    amount: isFirstToken ? parseFloat(firstAmount) : parseFloat(secondAmount),
    isFirstToken
  });

  const debouncedSetFirstAmount = useDebounceCallback(setFirstAmount, 500);
  const debouncedSetSecondAmount = useDebounceCallback(setSecondAmount, 500);

  useEffect(() => {
    if (data) {
      const anotherToken = isFirstToken ? secondCoin : firstCoin;
      const anotherTokenDecimals = coinsConfig.get(anotherToken)?.decimals!;
      const anotherTokenValue = data[1].toNumber() / 10 ** anotherTokenDecimals;

      if (isFirstToken) {
        setSecondAmount(anotherTokenValue.toFixed(anotherTokenDecimals));
        setSecondAmountInput(anotherTokenValue.toFixed(anotherTokenDecimals));
      } else {
        setFirstAmount(anotherTokenValue.toFixed(anotherTokenDecimals));
        setFirstAmountInput(anotherTokenValue.toFixed(anotherTokenDecimals));
      }
    }
  }, [data]);

  const setAmount = useCallback((coin: CoinName) => {
    return (value: string) => {
      if (value === '') {
        debouncedSetFirstAmount('');
        debouncedSetSecondAmount('');
        setFirstAmountInput('');
        setSecondAmountInput('');
        setActiveCoin(coin);
        return;
      }

      if (coin === firstCoin) {
        debouncedSetFirstAmount(value);
        setFirstAmountInput(value);
      } else {
        debouncedSetSecondAmount(value);
        setSecondAmountInput(value);
      }
      setActiveCoin(coin);
    };
  }, [debouncedSetFirstAmount, debouncedSetSecondAmount, firstCoin]);

  const handleButtonClick = useCallback(() => {
    setPreviewData({
      assets: [
        {
          coin: firstCoin,
          amount: firstAmount,
        },
        {
          coin: secondCoin,
          amount: secondAmount,
        }
      ],
    });
  }, [firstCoin, firstAmount, secondCoin, secondAmount, setPreviewData]);

  const insufficientFirstBalance = parseFloat(firstAmount) > firstCoinBalanceValue;
  const insufficientSecondBalance = parseFloat(secondAmount) > secondCoinBalanceValue;
  const insufficientBalance = insufficientFirstBalance || insufficientSecondBalance;

  const buttonTitle = useMemo(() => {
    if (insufficientBalance) {
      return 'Insufficient balance';
    }

    return 'Preview';
  }, [insufficientBalance]);

  const oneOfAmountsEmpty = !firstAmount || !secondAmount;

  const buttonDisabled = insufficientBalance || oneOfAmountsEmpty;

  return (
    <>
      <div className={styles.section}>
        <p>Selected pair</p>
        <div className={styles.sectionContent}>
          <div className={styles.coinPair}>
            <CoinPair firstCoin={firstCoin} secondCoin={secondCoin} />
            <p className={styles.APR}>
              Estimated APR
              <span className={clsx(styles.highlight, 'blurredText')}>+58,78%</span>
            </p>
          </div>
          <div className={styles.fee}>
            0.30% fee tier
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <p>Deposit amount</p>
        <div className={styles.sectionContent}>
          <CoinInput
            coin={firstCoin}
            value={firstAmountInput}
            loading={false}
            setAmount={setAmount(firstCoin)}
            balance={firstCoinBalanceValue}
            key={firstCoin}
          />
          <CoinInput
            coin={secondCoin}
            value={secondAmountInput}
            loading={isFetching}
            setAmount={setAmount(secondCoin)}
            balance={secondCoinBalanceValue}
            key={secondCoin}
          />
        </div>
      </div>
      <div className={clsx(styles.section, styles.prices)}>
        <p>Selected Price</p>
        <div className={clsx(styles.sectionContent, styles.priceBlocks)}>
          <div className={styles.priceBlock}>
            <p>Low price</p>
            <p>0</p>
          </div>
          <div className={styles.priceBlock}>
            <p>High price</p>
            <p>∞</p>
          </div>
        </div>
      </div>
      {!isConnected ? (
        <ActionButton
          variant="secondary"
          onClick={connect}
          loading={isConnecting}
        >
          Connect Wallet
        </ActionButton>
      ) : (
        <ActionButton disabled={buttonDisabled} onClick={handleButtonClick}>
          {buttonTitle}
        </ActionButton>
      )}
    </>
  );
};

export default AddLiquidityDialog;

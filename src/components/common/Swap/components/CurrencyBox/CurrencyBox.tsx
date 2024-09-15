import {ChangeEvent, memo, useCallback} from "react";
import {clsx} from "clsx";

import Coin from "@/src/components/common/Coin/Coin";
import ChevronDownIcon from "@/src/components/icons/ChevronDown/ChevronDownIcon";
import {CurrencyBoxMode} from "@/src/components/common/Swap/Swap";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from './CurrencyBox.module.css';
import TextButton from "@/src/components/common/TextButton/TextButton";
import {MinEthValue} from "@/src/utils/constants";

type Props = {
  value: string;
  coin: CoinName;
  mode: CurrencyBoxMode;
  balance: number;
  setAmount: (amount: string) => void;
  loading: boolean;
  onCoinSelectorClick: (mode: CurrencyBoxMode) => void;
};

const CurrencyBox = ({ value, coin, mode, balance, setAmount, loading, onCoinSelectorClick }: Props) => {
  const decimals = coinsConfig.get(coin)?.decimals!;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(',', '.');
    const re = new RegExp(`^[0-9]*[.]?[0-9]{0,${decimals}}$`);

    if (re.test(inputValue)) {
      setAmount(inputValue);
    }
  };

  const handleCoinSelectorClick = () => {
    if (!loading) {
      onCoinSelectorClick(mode);
    }
  };

  const handleMaxClick = useCallback(() => {
    const balanceToUse = coin === 'ETH' && mode === 'sell' ? balance - MinEthValue : balance;
    setAmount(balanceToUse.toString());
  }, [coin, mode, balance, setAmount]);

  const coinNotSelected = coin === null;

  const balanceValue = parseFloat(balance.toFixed(decimals));

  return (
    <>
      <div className={styles.currencyBox}>
        <p className={styles.title}>{mode === 'buy' ? 'Buy' : 'Sell'}</p>
        <div className={styles.content}>
          <input
            className={styles.input}
            type="text"
            inputMode="decimal"
            pattern="^[0-9]*[.,]?[0-9]*$"
            placeholder="0"
            minLength={1}
            value={value}
            disabled={coinNotSelected || loading}
            onChange={handleChange}
          />
          <button
            className={clsx(styles.selector, coinNotSelected && styles.selectorHighlighted)}
            onClick={handleCoinSelectorClick}
            disabled={loading}
          >
            {coinNotSelected ? (
              <p className={styles.chooseCoin}>Choose coin</p>
            ) : (
              <Coin name={coin} />
            )}
            <ChevronDownIcon />
          </button>
        </div>
        <div className={styles.estimateAndBalance}>
          <p className={styles.estimate}>
            {/*{!noValue && '$41 626.62'}*/}
          </p>
          {balanceValue > 0 && (
            <span>
              Balance: {balanceValue}
              &nbsp;
              <TextButton onClick={handleMaxClick}>
                Max
              </TextButton>
            </span>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(CurrencyBox);

import {ChangeEvent, memo} from "react";
import {clsx} from "clsx";

import Coin from "@/src/components/common/Coin/Coin";
import ChevronDownIcon from "@/src/components/icons/ChevronDown/ChevronDownIcon";
import {CurrencyBoxMode} from "@/src/components/common/Swap/Swap";

import styles from './CurrencyBox.module.css';

type Props = {
  value: string;
  coin: string;
  mode: CurrencyBoxMode;
  balance: number;
  setAmount: (amount: string) => void;
  loading: boolean;
  onCoinSelectorClick: (mode: CurrencyBoxMode) => void;
};

const CurrencyBox = ({ value, coin, mode, balance, setAmount, loading, onCoinSelectorClick }: Props) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const re = /^[0-9]*[.,]?[0-9]*$/;

    if (re.test(inputValue)) {
      setAmount(inputValue);
    }
  };

  const handleCoinSelectorClick = () => {
    if (!loading) {
      onCoinSelectorClick(mode);
    }
  };

  const coinNotSelected = coin === '';

  const balanceValue = parseFloat(balance.toFixed(6));

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
            <p>
              Balance:
              &nbsp;
              {balanceValue}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(CurrencyBox);

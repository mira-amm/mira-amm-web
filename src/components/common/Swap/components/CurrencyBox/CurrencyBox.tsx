import {ChangeEvent, memo, useCallback} from "react";
import {clsx} from "clsx";

import Coin from "@/src/components/common/Coin/Coin";
import ChevronDownIcon from "@/src/components/icons/ChevronDown/ChevronDownIcon";
import {CurrencyBoxMode} from "@/src/components/common/Swap/Swap";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from "./CurrencyBox.module.css";
import TextButton from "@/src/components/common/TextButton/TextButton";
import {DefaultLocale, MinEthValue} from "@/src/utils/constants";

type Props = {
  value: string;
  coin: CoinName;
  mode: CurrencyBoxMode;
  balance: number;
  setAmount: (amount: string) => void;
  loading: boolean;
  onCoinSelectorClick: (mode: CurrencyBoxMode) => void;
  usdRate: string | undefined;
  swapUnavailable?: boolean;
};

const CurrencyBox = ({value, coin, mode, balance, setAmount, loading, onCoinSelectorClick, usdRate, swapUnavailable}: Props) => {
  const decimals = coinsConfig.get(coin)?.decimals!;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(",", ".");
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
    const amount = coin === "ETH" && mode === "sell" ? (balance - MinEthValue).toFixed(9) : balance.toString();
    setAmount(amount);
  }, [coin, mode, balance, setAmount]);

  const coinNotSelected = coin === null;

  const balanceValue = balance.toLocaleString(DefaultLocale, {minimumFractionDigits: decimals});

  const numericValue = parseFloat(value);
  const usdValue = !isNaN(numericValue) && Boolean(usdRate) ?
    (numericValue * parseFloat(usdRate!)).toLocaleString(DefaultLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) :
    null;

  return (
    <div className={styles.currencyBox}>
      <p className={styles.title}>{mode === "buy" ? "Buy" : "Sell"}</p>
      <div className={styles.content}>
        {swapUnavailable ? (
          <div className={styles.warningBox}>
            <p className={styles.warningLabel}>
              This swap is currently unavailable
            </p>
          </div>
        ) : (
          <input className={styles.input}
                 type="text"
                 inputMode="decimal"
                 pattern="^[0-9]*[.,]?[0-9]*$"
                 placeholder="0"
                 minLength={1}
                 value={value}
                 disabled={coinNotSelected || loading}
                 onChange={handleChange}
          />
        )}

        <button
          className={clsx(styles.selector, coinNotSelected && styles.selectorHighlighted)}
          onClick={handleCoinSelectorClick}
          disabled={loading}
        >
          {coinNotSelected ? <p className={styles.chooseCoin}>Choose coin</p> : <Coin name={coin}/>}
          <ChevronDownIcon/>
        </button>
      </div>
      <div className={styles.estimateAndBalance}>
        <p className={styles.estimate}>{usdValue !== null && `$${usdValue}`}</p>
        {balance > 0 && (
          <span className={styles.balance}>
                Balance: {balanceValue}
            &nbsp;
            <TextButton onClick={handleMaxClick}>Max</TextButton>
          </span>
        )}
      </div>
    </div>
  );
};

export default memo(CurrencyBox);

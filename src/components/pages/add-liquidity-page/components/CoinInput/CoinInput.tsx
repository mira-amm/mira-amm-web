import Coin from "@/src/components/common/Coin/Coin";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from './CoinInput.module.css';
import {clsx} from "clsx";
import {ChangeEvent, memo, useCallback} from "react";
import TextButton from "@/src/components/common/TextButton/TextButton";
import {DefaultLocale, MinEthValue} from "@/src/utils/constants";

type Props = {
  coin: CoinName;
  value: string;
  loading: boolean;
  setAmount: (amount: string) => void;
  balance: number;
}

const CoinInput = ({ coin, value, loading, setAmount, balance }: Props) => {
  const decimals = coinsConfig.get(coin)?.decimals!;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(',', '.');
    const re = new RegExp(`^[0-9]*[.]?[0-9]{0,${decimals}}$`);

    if (re.test(inputValue)) {
      setAmount(inputValue);
    }
  };

  const handleMaxClick = useCallback(() => {
    const amount = coin === 'ETH' ?
      (balance - MinEthValue).toFixed(9) :
      balance.toString();
    setAmount(amount);
  }, [coin, balance, setAmount]);

  const balanceValue = balance.toLocaleString(DefaultLocale, { minimumFractionDigits: decimals })

  return (
    <div className={styles.coinInput}>
      <div className={clsx(styles.coinInputLine, styles.leftColumn)}>
        <input className={styles.input}
               type="text"
               inputMode="decimal"
               pattern="^[0-9]*[.,]?[0-9]*$"
               placeholder="0"
               minLength={1}
               value={value}
               disabled={loading}
               onChange={handleChange}
        />
        {/*<p className={clsx(styles.balance, styles.rate)}>*/}
        {/*  /!*$94.1*!/*/}
        {/*</p>*/}
      </div>
      <div className={clsx(styles.coinInputLine, styles.rightColumn)}>
        <Coin name={coin} className={styles.coinName} />
        {balance > 0 && (
          <span className={styles.balance}>
            Balance: {balanceValue}
            &nbsp;
            <TextButton onClick={handleMaxClick}>
              Max
            </TextButton>
          </span>
        )}
      </div>
    </div>
  );
};

export default memo(CoinInput);

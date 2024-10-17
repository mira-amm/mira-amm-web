import Coin from "@/src/components/common/Coin/Coin";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from './CoinInput.module.css';
import {clsx} from "clsx";
import {ChangeEvent, memo, useCallback} from "react";
import TextButton from "@/src/components/common/TextButton/TextButton";
import {DefaultLocale, MinEthValueBN} from "@/src/utils/constants";
import {BN} from "fuels";

type Props = {
  coin: CoinName;
  value: string;
  loading: boolean;
  setAmount: (amount: string) => void;
  balance: BN;
  usdRate: string | undefined;
  newPool?: boolean;
  onAssetClick?: VoidFunction;
}

const CoinInput = ({ coin, value, loading, setAmount, balance, usdRate, newPool, onAssetClick }: Props) => {
  const decimals = coinsConfig.get(coin)?.decimals!;
  const balanceValue = balance.formatUnits(decimals);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(',', '.');
    const re = new RegExp(`^[0-9]*[.]?[0-9]{0,${decimals}}$`);

    if (re.test(inputValue)) {
      setAmount(inputValue);
    }
  };

  const handleMaxClick = useCallback(() => {
    let amountStringToSet;
    if (coin === "ETH") {
      const amountWithoutGasFee = balance.sub(MinEthValueBN);
      amountStringToSet = amountWithoutGasFee.gt(0)
        ? amountWithoutGasFee.formatUnits(decimals)
        : balanceValue;
    } else {
      amountStringToSet = balanceValue;
    }

    setAmount(amountStringToSet);
  }, [coin, balance, setAmount]);

  const numericValue = parseFloat(value);
  const usdValue = !isNaN(numericValue) && Boolean(usdRate) ?
    (numericValue * parseFloat(usdRate!)).toLocaleString(DefaultLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) :
    null;

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
        {usdValue !== null && (
          <p className={clsx(styles.balance, styles.rate)}>
            {`$${usdValue}`}
          </p>
        )}
      </div>
      <div className={clsx(styles.coinInputLine, styles.rightColumn)}>
        <Coin name={coin} className={styles.coinName} newPool={newPool} onClick={onAssetClick} />
        {balance.gt(0) && (
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

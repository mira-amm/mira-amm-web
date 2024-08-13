import Coin from "@/src/components/common/Coin/Coin";
import {CoinName} from "@/src/utils/coinsConfig";

import styles from './CoinInput.module.css';
import {clsx} from "clsx";

type Props = {
  coin: CoinName;
}

const CoinInput = ({ coin }: Props) => {
  return (
    <div className={styles.coinInput}>
      <div className={clsx(styles.coinInputLine, styles.topline)}>
        <input className={styles.input}/>
        <Coin name={coin} />
      </div>
      <div className={clsx(styles.coinInputLine, styles.underline)}>
        <p>$94.1</p>
        <p>Balance: 0</p>
      </div>
    </div>
  );
};

export default CoinInput;

import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from './CoinWithAmount.module.css';
import {clsx} from "clsx";

type Props = {
  amount: string;
  coin: CoinName;
  hiddenAmount?: boolean;
}

const CoinWithAmount = ({amount, coin, hiddenAmount}: Props) => {
  const Icon = coinsConfig.get(coin)?.icon;

  return (
    <div className={styles.coinWithAmount}>
      {Icon && <Icon />}
      <div className={styles.info}>
        <p className={clsx(styles.amount, hiddenAmount && 'blurredText')}>{amount}</p>
        <p className={styles.name}>{coin}</p>
      </div>
    </div>
  );
};

export default CoinWithAmount;

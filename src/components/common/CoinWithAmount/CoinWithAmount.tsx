import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from './CoinWithAmount.module.css';

type Props = {
  amount: string;
  coin: CoinName;
}

const CoinWithAmount = ({amount, coin}: Props) => {
  const Icon = coinsConfig.get(coin)?.icon;

  return (
    <div className={styles.coinWithAmount}>
      {Icon && <Icon />}
      <div className={styles.info}>
        <p className={styles.amount}>{amount}</p>
        <p className={styles.name}>{coin}</p>
      </div>
    </div>
  );
};

export default CoinWithAmount;

import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from './CoinPair.module.css';

type Props = {
  firstCoin: CoinName;
  secondCoin: CoinName;
}

const CoinPair = ({ firstCoin, secondCoin }: Props) => {
  const FirstCoinIcon = coinsConfig.get(firstCoin)?.icon;
  const SecondCoinIcon = coinsConfig.get(secondCoin)?.icon;

  return (
    <div className={styles.coinPair}>
      <div className={styles.coinPairIcons}>
        {FirstCoinIcon && <FirstCoinIcon />}
        {SecondCoinIcon && <SecondCoinIcon />}
      </div>
      <p className={styles.coinPairText}>
        {firstCoin}/{secondCoin}
      </p>
    </div>
  );
};

export default CoinPair;

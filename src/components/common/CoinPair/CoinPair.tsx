import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from './CoinPair.module.css';
import {clsx} from "clsx";

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
      <p data-identifier="coin-pair">
        {firstCoin}/{secondCoin}
      </p>
    </div>
  );
};

export default CoinPair;

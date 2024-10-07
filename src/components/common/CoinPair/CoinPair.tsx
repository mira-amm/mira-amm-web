import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from './CoinPair.module.css';
import {clsx} from "clsx";

type Props = {
  firstCoin: CoinName;
  secondCoin: CoinName;
  withFee?: boolean;
  withFeeBelow?: boolean;
}

const CoinPair = ({ firstCoin, secondCoin, withFee, withFeeBelow }: Props) => {
  const firstCoinIcon = coinsConfig.get(firstCoin)?.icon;
  const secondCoinIcon = coinsConfig.get(secondCoin)?.icon;

  return (
    <div className={clsx(styles.coinPair, withFeeBelow && styles.coinPairAlignStart)}>
      <div className={styles.coinPairIcons}>
        {firstCoinIcon && <img src={firstCoinIcon} alt={`${firstCoin} icon`} />}
        {secondCoinIcon && <img src={secondCoinIcon} alt={`${secondCoin} icon`} />}
      </div>
      <div className={styles.namesAndFee}>
        <p className={styles.coinNames} data-identifier="coin-pair">
          {firstCoin}/{secondCoin}
        </p>
        {withFeeBelow && (
          <p className={styles.coinPairFee}>
            0.3%
          </p>
        )}
      </div>
      {withFee && (
        <p className={styles.coinPairFee}>
          0.3%
        </p>
      )}
    </div>
  );
};

export default CoinPair;

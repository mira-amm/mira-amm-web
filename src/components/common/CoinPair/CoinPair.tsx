import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from './CoinPair.module.css';
import {clsx} from "clsx";
import {memo} from "react";

type Props = {
  firstCoin: CoinName;
  secondCoin: CoinName;
  isStablePool: boolean;
  withFee?: boolean;
  withFeeBelow?: boolean;
  withPoolDescription?: boolean;
}

const CoinPair = ({ firstCoin, secondCoin, isStablePool, withFee, withFeeBelow, withPoolDescription }: Props) => {
  const firstCoinIcon = coinsConfig.get(firstCoin)?.icon;
  const secondCoinIcon = coinsConfig.get(secondCoin)?.icon;

  const feeText = isStablePool ? '0.05%' : '0.3%';
  const poolDescription = `${isStablePool ? 'Stable' : 'Volatile'}: ${feeText}`;

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
            {feeText}
          </p>
        )}
        {withPoolDescription && (
          <p className={styles.poolDescription}>
            {poolDescription}
          </p>
        )}
      </div>
      {withFee && (
        <p className={styles.coinPairFee}>
          {feeText}
        </p>
      )}
    </div>
  );
};

export default memo(CoinPair);

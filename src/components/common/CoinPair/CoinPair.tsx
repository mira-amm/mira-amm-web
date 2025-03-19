import styles from "./CoinPair.module.css";
import {clsx} from "clsx";
import {memo} from "react";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import {B256Address} from "fuels";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import Image from "next/image";

type Props = {
  firstCoin: B256Address;
  secondCoin: B256Address;
  isStablePool: boolean;
  withFee?: boolean;
  withFeeBelow?: boolean;
  withPoolDescription?: boolean;
};

const CoinPair = ({
  firstCoin,
  secondCoin,
  isStablePool,
  withFee,
  withFeeBelow,
  withPoolDescription,
}: Props) => {
  const firstCoinIcon = useAssetImage(firstCoin);
  const secondCoinIcon = useAssetImage(secondCoin);
  const {symbol: firstSymbol} = useAssetMetadata(firstCoin);
  const {symbol: secondSymbol} = useAssetMetadata(secondCoin);

  const feeText = isStablePool ? "0.05%" : "0.3%";
  const poolDescription = `${isStablePool ? "Stable" : "Volatile"}: ${feeText}`;

  return (
    <div
      className={clsx(
        styles.coinPair,
        withFeeBelow && styles.coinPairAlignStart,
      )}
    >
      <div className={styles.coinPairIcons}>
        {firstCoinIcon && (
          <Image
            src={firstCoinIcon}
            alt={`${firstSymbol} icon`}
            width={34}
            height={34}
            priority
          />
        )}
        {secondCoinIcon && (
          <Image
            src={secondCoinIcon}
            alt={`${secondSymbol} icon`}
            width={34}
            height={34}
            priority
          />
        )}
      </div>
      <div className={styles.namesAndFee}>
        {firstSymbol && secondSymbol ? (
          <p className={styles.coinNames} data-identifier="coin-pair">
            {firstSymbol}/{secondSymbol}
          </p>
        ) : (
          <p className={styles.loadingText}>loading...</p>
        )}
        {withFeeBelow && <p className={styles.coinPairFee}>{feeText}</p>}
        {withPoolDescription && (
          <p className={styles.poolDescription}>{poolDescription} fee</p>
        )}
      </div>
      {withFee && <p className={styles.coinPairFee}>{feeText}</p>}
    </div>
  );
};

export default memo(CoinPair);

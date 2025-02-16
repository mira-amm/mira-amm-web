import styles from "./CoinPair.module.css";
import {clsx} from "clsx";
import {memo} from "react";
import {B256Address} from "fuels";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";

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
  const {asset: assetA} = useAssetMetadata(firstCoin);
  const {asset: assetB} = useAssetMetadata(secondCoin);

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
        {assetA?.icon && (
          <img src={assetA.icon} alt={`${assetA?.symbol} icon`} />
        )}
        {assetB?.icon && (
          <img src={assetB.icon} alt={`${assetB.symbol} icon`} />
        )}
      </div>
      <div className={styles.namesAndFee}>
        <p className={styles.coinNames} data-identifier="coin-pair">
          {assetA?.symbol}/{assetB?.symbol}
        </p>
        {withFeeBelow && <p className={styles.coinPairFee}>{feeText}</p>}
        {withPoolDescription && (
          <p className={styles.poolDescription}>{poolDescription}</p>
        )}
      </div>
      {withFee && <p className={styles.coinPairFee}>{feeText}</p>}
    </div>
  );
};

export default memo(CoinPair);

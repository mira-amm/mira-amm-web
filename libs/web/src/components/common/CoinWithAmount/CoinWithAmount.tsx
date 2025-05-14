import styles from "./CoinWithAmount.module.css";
import {B256Address} from "fuels";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import clsx from "clsx";
import {FallbackImage} from "../FallbackImage/FallbackImage";

type Props = {
  amount: string;
  assetId: B256Address;
  withName?: boolean;
};

const CoinWithAmount = ({amount, assetId, withName}: Props) => {
  const icon = useAssetImage(assetId);
  const metadata = useAssetMetadata(assetId);

  return (
    <div className={styles.coinWithAmount}>
      {icon && (
        <FallbackImage
          src={icon}
          alt={`${metadata.symbol} icon`}
          width={40}
          height={40}
          priority
          onChangeParam={assetId}
        />
      )}
      {!withName ? (
        <div className={styles.info}>
          <p className={clsx(styles.amount, "mc-mono-l")}>{amount}</p>
          <p className={clsx(styles.name, "mc-type-l")}>{metadata.symbol}</p>
        </div>
      ) : (
        <div className={styles.info}>
          <p className={clsx(styles.amount, "mc-type-l")}>{metadata.symbol}</p>
          <p className={clsx(styles.name, "mc-type-l")}>{metadata.name}</p>
        </div>
      )}
    </div>
  );
};

export default CoinWithAmount;

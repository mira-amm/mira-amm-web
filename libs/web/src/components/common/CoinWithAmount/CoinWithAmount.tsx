import styles from "./CoinWithAmount.module.css";
import {B256Address} from "fuels";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import Image from "next/image";
import clsx from "clsx";
import {formatTokenAmount} from "@/src/utils/formatTokenAmount";

type Props = {
  amount: string;
  assetId: B256Address;
  withName?: boolean;
  maxDecimals?: number;
  minDecimals?: number;
};

const CoinWithAmount = ({
  amount,
  assetId,
  withName,
  maxDecimals = 5,
  minDecimals = 2,
}: Props): JSX.Element => {
  const icon = useAssetImage(assetId);
  const metadata = useAssetMetadata(assetId);
  const formattedAmount = formatTokenAmount(amount, maxDecimals, minDecimals);

  return (
    <div className={styles.coinWithAmount}>
      {icon && (
        <Image
          src={icon}
          alt={`${metadata.symbol} icon`}
          width={40}
          height={40}
          priority
        />
      )}
      {!withName ? (
        <div className={styles.info}>
          <p className={clsx(styles.amount, "mc-mono-l")}>{formattedAmount}</p>
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

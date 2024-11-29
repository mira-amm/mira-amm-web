import {memo} from "react";
import {clsx} from "clsx";
import {BN, CoinQuantity} from "fuels";

import styles from './CoinListItem.module.css';
import { useAssetImage } from "@/src/hooks/useAssetImage";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";

type Props = {
  assetId: string;
  balance?: CoinQuantity | undefined;
};

const CoinListItem = ({ assetId, balance }: Props) => {
  const metadata = useAssetMetadata(assetId);
  const balanceValue = balance?.amount ?? new BN(0);
  const icon = useAssetImage(assetId);

  return (
    <span className={clsx(styles.coin, !metadata.name && styles.centered)}>
      {icon && <img src={icon} alt={`${metadata.name} icon`} />}
      <div className={styles.names}>
        <p className={styles.name}>{metadata.symbol}</p>
        <p className={styles.fullName}>{metadata.name}</p>
      </div>
      {balanceValue.gt(0) && (
        <p className={styles.balance}>{balanceValue.formatUnits(metadata.decimals || 0)}</p>
      )}
    </span>
  )
};

export default memo(CoinListItem);

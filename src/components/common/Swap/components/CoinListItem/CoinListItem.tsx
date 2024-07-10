import {memo} from "react";
import {clsx} from "clsx";

import styles from './CoinListItem.module.css';
import {coinsConfig} from "@/src/utils/coinsConfig";

type Props = {
  name: string;
};

const CoinListItem = ({ name }: Props) => {
  const coinData = coinsConfig.get(name);
  const fullName = coinData?.fullName;
  const Icon = coinData?.icon;

  return (
    <span className={clsx(styles.coin, !fullName && styles.centered)}>
      {Icon && <Icon />}
      <div className={styles.names}>
        <p className={styles.name}>{name}</p>
        {fullName && (
          <p className={styles.fullName}>{fullName}</p>
        )}
      </div>
    </span>
  )
};

export default memo(CoinListItem);

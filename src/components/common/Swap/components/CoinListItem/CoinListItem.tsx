import {memo} from "react";
import {clsx} from "clsx";

import styles from './CoinListItem.module.css';
import {coinsConfig} from "@/src/utils/coinsConfig";
import {CoinQuantity} from "fuels";

type Props = {
  name: string;
  balance?: CoinQuantity | undefined;
};

const CoinListItem = ({ name, balance }: Props) => {
  const coinData = coinsConfig.get(name);
  const fullName = coinData?.fullName;
  const Icon = coinData?.icon;
  const decimals = coinData?.decimals ?? 0;
  const balanceValue = balance ? balance.amount.toNumber() / 10 ** decimals : 0;

  return (
    <span className={clsx(styles.coin, !fullName && styles.centered)}>
      {Icon && <Icon />}
      <div className={styles.names}>
        <p className={styles.name}>{name}</p>
        {fullName && (
          <p className={styles.fullName}>{fullName}</p>
        )}
      </div>
      {balanceValue > 0 && (
        <p className={styles.balance}>{balanceValue}</p>
      )}
    </span>
  )
};

export default memo(CoinListItem);

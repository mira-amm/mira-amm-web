import {memo} from "react";
import {clsx} from "clsx";
import {BN, CoinQuantity} from "fuels";

import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from './CoinListItem.module.css';

type Props = {
  name: CoinName;
  balance?: CoinQuantity | undefined;
};

const CoinListItem = ({ name, balance }: Props) => {
  const coinData = coinsConfig.get(name);
  const fullName = coinData?.fullName;
  const icon = coinData?.icon;
  const decimals = coinData?.decimals ?? 0;
  const balanceValue = balance?.amount ?? new BN(0);

  return (
    <span className={clsx(styles.coin, !fullName && styles.centered)}>
      {icon && <img src={icon} alt={`${name} icon`} />}
      <div className={styles.names}>
        <p className={styles.name}>{name}</p>
        {fullName && (
          <p className={styles.fullName}>{fullName}</p>
        )}
      </div>
      {balanceValue.gt(0) && (
        <p className={styles.balance}>{balanceValue.formatUnits(decimals)}</p>
      )}
    </span>
  )
};

export default memo(CoinListItem);

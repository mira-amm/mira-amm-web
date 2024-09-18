import {memo} from "react";

import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from './Coin.module.css';
import {clsx} from "clsx";

type Props = {
  name: CoinName;
  className?: string;
};

const Coin = ({ name, className }: Props) => {
  const Icon = coinsConfig.get(name)?.icon;

  return (
    <div className={styles.coin}>
      {Icon && <Icon />}
      <p className={clsx(styles.name, className)}>{name}</p>
    </div>
  )
};

export default memo(Coin);

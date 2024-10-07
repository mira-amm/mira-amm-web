import {memo} from "react";

import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from './Coin.module.css';
import {clsx} from "clsx";

type Props = {
  name: CoinName;
  className?: string;
};

const Coin = ({ name, className }: Props) => {
  const icon = coinsConfig.get(name)?.icon;

  return (
    <div className={styles.coin}>
      {icon && <img src={icon} alt={`${name} icon`}/>}
      <p className={clsx(styles.name, className)}>{name}</p>
    </div>
  )
};

export default memo(Coin);

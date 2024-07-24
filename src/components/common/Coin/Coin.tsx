import {memo} from "react";

import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from './Coin.module.css';

type Props = {
  name: CoinName;
};

const Coin = ({ name }: Props) => {
  const Icon = coinsConfig.get(name)?.icon;

  return (
    <div className={styles.coin}>
      {Icon && <Icon />}
      <p className={styles.name}>{name}</p>
    </div>
  )
};

export default memo(Coin);

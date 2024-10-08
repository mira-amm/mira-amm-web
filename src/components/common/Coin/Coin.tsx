import {memo} from "react";

import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from './Coin.module.css';
import {clsx} from "clsx";
import ChevronDownIcon from "@/src/components/icons/ChevronDown/ChevronDownIcon";

type Props = {
  name: CoinName;
  className?: string;
  newPool?: boolean;
  onClick?: VoidFunction;
};

const Coin = ({ name, className, newPool, onClick }: Props) => {
  const icon = coinsConfig.get(name)?.icon;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className={clsx(styles.coin, newPool && styles.clickable)} onClick={handleClick}>
      {icon && <img src={icon} alt={`${name} icon`}/>}
      <p className={clsx(styles.name, className)}>{name}</p>
      {newPool && <ChevronDownIcon />}
    </div>
  )
};

export default memo(Coin);

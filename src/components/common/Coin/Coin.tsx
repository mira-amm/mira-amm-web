import {memo, useMemo} from "react";

import USDTIcon from "@/src/components/icons/coins/Tether/USDTIcon";

import styles from './Coin.module.css';
import BTCIcon from "@/src/components/icons/coins/Bitcoin/BTCIcon";
import USDCIcon from "@/src/components/icons/coins/USDCoin/USDCIcon";
import UNIIcon from "@/src/components/icons/coins/Uniswap/UNIIcon";
import DAIIcon from "@/src/components/icons/coins/DAI/DAIIcon";
import ETHIcon from "@/src/components/icons/coins/Ethereum/ETHIcon";

type Props = {
  name: string;
};

const Coin = ({ name }: Props) => {
  const IconComponent = useMemo(() => {
    switch (name) {
      case 'USDT':
        return USDTIcon;
      case 'BTC':
        return BTCIcon;
      case 'USDC':
        return USDCIcon;
      case 'UNI':
        return UNIIcon;
      case 'DAI':
        return DAIIcon;
      case 'ETH':
        return ETHIcon;
      default:
        return null;
    }
  }, [name]);

  return (
    <span className={styles.coin}>
      {/* TODO: Select icon from dictionary */}
      {IconComponent && <div className={styles.icon}><IconComponent /></div>}
      {name}
    </span>
  )
};

export default memo(Coin);

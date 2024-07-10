import {memo, useMemo} from "react";

import USDTIcon from "@/src/components/icons/coins/Tether/USDTIcon";

import styles from './CoinListItem.module.css';
import BTCIcon from "@/src/components/icons/coins/Bitcoin/BTCIcon";
import USDCIcon from "@/src/components/icons/coins/USDCoin/USDCIcon";
import UNIIcon from "@/src/components/icons/coins/Uniswap/UNIIcon";
import DAIIcon from "@/src/components/icons/coins/DAI/DAIIcon";
import ETHIcon from "@/src/components/icons/coins/Ethereum/ETHIcon";
import {clsx} from "clsx";

type Props = {
  name: string;
  fullName?: string;
};

const CoinListItem = ({ name, fullName }: Props) => {
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
    <span className={clsx(styles.coin, !fullName && styles.centered)}>
      {/* TODO: Select icon from dictionary */}
      {IconComponent && <IconComponent />}
      <div className={styles.names}>
        <p className={styles.name}>{name}</p>
        {fullName && <p className={styles.fullName}>{fullName}</p>}
      </div>
    </span>
  )
};

export default memo(CoinListItem);

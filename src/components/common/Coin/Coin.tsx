import {memo} from "react";

import styles from './Coin.module.css';
import {clsx} from "clsx";
import ChevronDownIcon from "@/src/components/icons/ChevronDown/ChevronDownIcon";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import { useAssetImage } from "@/src/hooks/useAssetImage";

type Props = {
  assetId: string;
  className?: string;
  newPool?: boolean;
  onClick?: VoidFunction;
};

const Coin = ({ assetId, className, newPool, onClick }: Props) => {
  const metadata = useAssetMetadata(assetId);
  const icon = useAssetImage(assetId);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className={clsx(styles.coin, newPool && styles.clickable)} onClick={handleClick}>
      {icon && <img src={icon} alt={`${metadata.symbol} icon`}/>}
      <p className={clsx(styles.name, className)}>{metadata.symbol}</p>
      {newPool && <ChevronDownIcon />}
    </div>
  )
};

export default memo(Coin);

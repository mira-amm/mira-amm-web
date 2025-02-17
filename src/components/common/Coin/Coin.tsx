import styles from "./Coin.module.css";
import {clsx} from "clsx";
import ChevronDownIcon from "@/src/components/icons/ChevronDown/ChevronDownIcon";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";

type Props = {
  assetId: string | null;
  className?: string;
  onClick?: VoidFunction;
};

const Coin = ({assetId, className, onClick}: Props) => {
  const {asset: metadata} = useAssetMetadata(assetId);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const newPool = Boolean(onClick);

  return (
    <div
      className={clsx(styles.coin, newPool && styles.clickable)}
      onClick={handleClick}
    >
      {metadata?.icon && (
        <img src={metadata?.icon} alt={`${metadata?.symbol} icon`} />
      )}
      <p className={clsx(styles.name, className)}>
        {metadata?.symbol ?? "Choose Asset"}
      </p>
      {newPool && <ChevronDownIcon />}
    </div>
  );
};

export default Coin;

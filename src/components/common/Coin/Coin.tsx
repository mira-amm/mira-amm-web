import styles from "./Coin.module.css";
import {clsx} from "clsx";
import ChevronDownIcon from "@/src/components/icons/ChevronDown/ChevronDownIcon";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import Image from "next/image";

type Props = {
  assetId: string | null;
  className?: string;
  onClick?: VoidFunction;
};

const Coin = ({assetId, className, onClick}: Props) => {
  const metadata = useAssetMetadata(assetId);
  const icon = useAssetImage(assetId);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const newPool = Boolean(onClick);

  return (
    <div
      className={clsx(
        styles.coin,
        newPool && styles.clickable,
        (!assetId || !metadata.symbol) && styles.selectable,
      )}
      onClick={handleClick}
    >
      {!!assetId && !!icon && !!metadata.symbol ? (
        <Image
          src={icon}
          alt={`${metadata.symbol} icon`}
          width={24}
          height={24}
          priority
        />
      ) : null}
      <p
        className={clsx(styles.name, className, {
          [styles.chooseCoin]: !metadata.symbol,
        })}
      >
        {metadata.symbol ?? "Choose Coin"}
      </p>
      {newPool && <ChevronDownIcon />}
    </div>
  );
};

export default Coin;

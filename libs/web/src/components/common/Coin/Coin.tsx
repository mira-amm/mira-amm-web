import styles from "./Coin.module.css";
import {clsx} from "clsx";
import ChevronDownIcon from "@/src/components/icons/ChevronDown/ChevronDownIcon";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import {FallbackImage} from "../FallbackImage/FallbackImage";

type Props = {
  assetId: string | null;
  className?: string;
  onClick?: VoidFunction;
  coinSelectionDisabled?: boolean;
};

const Coin = ({assetId, className, onClick, coinSelectionDisabled}: Props) => {
  const metadata = useAssetMetadata(assetId);
  const icon = useAssetImage(assetId);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={clsx(
        styles.coin,
        !coinSelectionDisabled && styles.clickable,
        (!assetId || !metadata.symbol) && styles.selectable,
      )}
      onClick={handleClick}
    >
      {!!assetId && !!icon && !!metadata.symbol ? (
        <FallbackImage
          onChangeParam={assetId}
          src={icon}
          alt={`${metadata.symbol} icon`}
          width={24}
          height={24}
          priority
        />
      ) : null}
      <p
        className={clsx(metadata.symbol ? "mc-type-l" : "mc-type-m", className)}
      >
        {metadata.symbol ?? "Choose Coin"}
      </p>
      {!coinSelectionDisabled ? <ChevronDownIcon /> : null}
    </div>
  );
};

export default Coin;

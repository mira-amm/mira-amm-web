import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import CoinListItem from "./CoinListItem/CoinListItem";
import {CoinQuantity} from "fuels";
import styles from "./CoinsListModal/CoinsListModal.module.css";
import SkeletonLoader from "./SkeletonLoader/SkeletonLoader";

interface Props {
  assetId: string;
  balance: CoinQuantity | undefined;
  onClick: () => void;
}

export default function UnknownCoinListItem({
  assetId,
  balance,
  onClick,
}: Props) {
  const metadata = useAssetMetadata(assetId);

  if (metadata.symbol) {
    return (
      <div className={styles.tokenListItem} onClick={onClick}>
        <CoinListItem assetId={assetId} balance={balance} />
      </div>
    );
  }

  if (metadata.isLoading) {
    return <SkeletonLoader isLoading={true} count={1} textLines={1} />;
  }

  return <div style={{padding: "8px 16px"}}>Asset not found</div>;
}

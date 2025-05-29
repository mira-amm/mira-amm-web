import { useAssetMetadata } from "@/src/hooks";
import {CoinQuantity} from "fuels";
import styles from "./CoinsListModal/CoinsListModal.module.css";
import { SkeletonLoader, CoinListItem } from "@/web/src/components/common";
import useAsset from "@/src/hooks/useAsset";

export function UnknownCoinListItem({
  assetId,
  balance,
  onClick,
}: {
  assetId: string;
  balance: CoinQuantity | undefined;
  onClick: () => void;
}) {
  const {asset: metadata, isLoading} = useAsset(assetId);

  const assetData = metadata && {
    ...metadata,
    userBalance: balance,
    isVerified: false, // setting is verified to false as the asset is imported by address
  };

  if (assetData) {
    return (
      <div className={styles.tokenListItem} onClick={onClick}>
        <CoinListItem assetData={assetData} />
      </div>
    );
  }

  if (isLoading) {
    return <SkeletonLoader isLoading={true} count={1} textLines={1} />;
  }

  return <div style={{padding: "8px 16px"}}>Asset not found</div>;
}

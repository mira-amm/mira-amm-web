import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import CoinListItem from "./CoinListItem/CoinListItem";
import {CoinQuantity} from "fuels";
import styles from "./CoinsListModal/CoinsListModal.module.css";
import {useAssetList} from "@/src/hooks/useAssetList";

interface Props {
  assetId: string;
  balance: CoinQuantity | undefined;
  coinsLoaded: boolean;
  onLoad?: (assetId: string) => void;
  onClick: () => void;
}

export default function UnknownCoinListItem({
  assetId,
  balance,
  coinsLoaded,
  onLoad,
  onClick,
}: Props): JSX.Element {
  const metadata = useAssetMetadata(assetId);
  const {assets} = useAssetList();
  if (metadata.symbol) {
    return (
      <div className={styles.tokenListItem} onClick={onClick}>
        <CoinListItem
          assetId={assetId}
          balance={balance}
          coinsLoaded={coinsLoaded}
          onLoad={onLoad}
          icon={assets?.find((asset) => asset.assetId === assetId)?.icon}
        />
      </div>
    );
  }

  if (metadata.isLoading) {
    return <div style={{padding: "8px 16px"}}>Loading...</div>;
  }

  return <div style={{padding: "8px 16px"}}>Asset not found</div>;
}

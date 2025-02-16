import styles from "./CoinWithAmount.module.css";
import {B256Address} from "fuels";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";

type Props = {
  amount: string;
  assetId: B256Address;
};

const CoinWithAmount = ({amount, assetId}: Props) => {
  const {asset: metadata} = useAssetMetadata(assetId);

  return (
    <div className={styles.coinWithAmount}>
      {metadata?.icon && <img src={icon} alt={`${metadata?.symbol} icon`} />}
      <div className={styles.info}>
        <p className={styles.amount}>{amount}</p>
        <p className={styles.name}>{metadata?.symbol}</p>
      </div>
    </div>
  );
};

export default CoinWithAmount;

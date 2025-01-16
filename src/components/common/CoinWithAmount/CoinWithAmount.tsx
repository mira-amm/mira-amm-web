import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

import styles from "./CoinWithAmount.module.css";
import {B256Address} from "fuels";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";

type Props = {
  amount: string;
  assetId: B256Address;
};

const CoinWithAmount = ({amount, assetId}: Props) => {
  const icon = useAssetImage(assetId);
  const metadata = useAssetMetadata(assetId);

  return (
    <div className={styles.coinWithAmount}>
      {icon && <img src={icon} alt={`${metadata.symbol} icon`} />}
      <div className={styles.info}>
        <p className={styles.amount}>{amount}</p>
        <p className={styles.name}>{metadata.symbol}</p>
      </div>
    </div>
  );
};

export default CoinWithAmount;

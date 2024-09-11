import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import PositionLabel from "@/src/components/pages/liquidity-page/components/Positions/PositionLabel/PositionLabel";

import styles from "./MobilePositionItem.module.css";
import { PoolId } from "mira-dex-ts";
import {AssetId, CoinQuantity} from "fuels";
import {getCoinByAssetId} from "@/src/utils/common";

type Props = {
  position: { poolId: PoolId; lpAssetId: AssetId; lpBalance: CoinQuantity | undefined };
  onClick: VoidFunction;
}

const MobilePositionItem = ({ position, onClick }: Props) => {
  const { bits: coinAAssetId } = position.poolId[0];
  const { bits: coinBAssetId } = position.poolId[1];

  const coinA = getCoinByAssetId(coinAAssetId);
  const coinB = getCoinByAssetId(coinBAssetId);

  return (
    <div className={styles.mobilePositionItem} onClick={onClick}>
      <div className={styles.infoSection}>
        <CoinPair firstCoin={coinA} secondCoin={coinB} />
        <PositionLabel />
      </div>
      <p className={styles.positionPrice}>{`Selected Price: 0 ${coinA} <> ∞ ${coinB}`}</p>
    </div>
  );
};

export default MobilePositionItem;

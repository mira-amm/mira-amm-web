import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import PositionLabel from "@/src/components/pages/liquidity-page/components/Positions/PositionLabel/PositionLabel";

import styles from "./MobilePositionItem.module.css";
import { PoolId } from "mira-dex-ts";
import {AssetId, CoinQuantity} from "fuels";
import {getCoinByAssetId} from "@/src/utils/common";
import {coinsConfig} from "@/src/utils/coinsConfig";

type Props = {
  position: any;
  onClick: VoidFunction;
}

const MobilePositionItem = ({ position, onClick }: Props) => {
  const { bits: coinAAssetId } = position[0][0];
  const coinA = getCoinByAssetId(coinAAssetId);
  const coinADecimals = coinsConfig.get(coinA)?.decimals!;
  const coinAAmount = (position[0][1].toNumber() / 10 ** coinADecimals).toFixed(coinADecimals);
  const { bits: coinBAssetId } = position[1][0];
  const coinB = getCoinByAssetId(coinBAssetId);
  const coinBDecimals = coinsConfig.get(coinB)?.decimals!;
  const coinBAmount = (position[1][1].toNumber() / 10 ** coinBDecimals).toFixed(coinBDecimals);

  return (
    <div className={styles.mobilePositionItem} onClick={onClick}>
      <div className={styles.infoSection}>
        <CoinPair firstCoin={coinA} secondCoin={coinB} />
        <PositionLabel />
      </div>
      <p className={styles.positionPrice}>{`Size: ${coinAAmount} ${coinA} <> ${coinBAmount} ${coinB}`}</p>
    </div>
  );
};

export default MobilePositionItem;

import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import PositionLabel from "@/src/components/pages/liquidity-page/components/Positions/PositionLabel/PositionLabel";

import styles from "./MobilePositionItem.module.css";
import { PoolId } from "mira-dex-ts";
import {AssetId, CoinQuantity, formatUnits} from "fuels";
import {getAssetNameByAssetId} from "@/src/utils/common";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {DefaultLocale} from "@/src/utils/constants";

type Props = {
  position: any;
  onClick: VoidFunction;
}

const MobilePositionItem = ({ position, onClick }: Props) => {
  const { bits: coinAAssetId } = position[0][0];
  const coinA = getAssetNameByAssetId(coinAAssetId);
  const coinADecimals = coinsConfig.get(coinA)?.decimals!;
  const coinAAmount = formatUnits(position[0][1], coinADecimals);
  const { bits: coinBAssetId } = position[1][0];
  const coinB = getAssetNameByAssetId(coinBAssetId);
  const coinBDecimals = coinsConfig.get(coinB)?.decimals!;
  const coinBAmount = formatUnits(position[1][1], coinBDecimals);

  const isStablePool = position.isStablePool;
  const feeText = isStablePool ? '0.05%' : '0.3%';
  const poolDescription = `${isStablePool ? 'Stable' : 'Volatile'}: ${feeText}`;

  return (
    <div className={styles.mobilePositionItem} onClick={onClick}>
      <div className={styles.infoSection}>
        <CoinPair firstCoin={coinA} secondCoin={coinB} isStablePool={isStablePool}/>
        <PositionLabel />
      </div>
      <p className={styles.positionPrice}>{`Size: ${coinAAmount} ${coinA} <> ${coinBAmount} ${coinB}`}</p>
      <p className={styles.poolDescription}>{poolDescription}</p>
    </div>
  );
};

export default MobilePositionItem;

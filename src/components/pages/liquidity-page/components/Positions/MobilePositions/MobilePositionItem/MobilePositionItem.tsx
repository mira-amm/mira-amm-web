import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import PositionLabel from "@/src/components/pages/liquidity-page/components/Positions/PositionLabel/PositionLabel";

import styles from "./MobilePositionItem.module.css";
import {formatUnits} from "fuels";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import {Position} from "@/src/hooks/usePositions";

type Props = {
  position: Position;
  onClick: VoidFunction;
};

const MobilePositionItem = ({position, onClick}: Props) => {
  const coinAMetadata = useAssetMetadata(position.token0Position[0].bits);
  const coinBMetadata = useAssetMetadata(position.token1Position[0].bits);

  const coinAAmount = formatUnits(
    position.token0Position[1],
    coinAMetadata.decimals,
  );
  const coinBAmount = formatUnits(
    position.token1Position[1],
    coinBMetadata.decimals,
  );

  const feeText = position.isStable ? "0.05%" : "0.3%";
  const poolDescription = `${position.isStable ? "Stable" : "Volatile"}: ${feeText}`;

  return (
    <div className={styles.mobilePositionItem} onClick={onClick}>
      <div className={styles.infoSection}>
        <CoinPair
          firstCoin={position.token0Position[0].bits}
          secondCoin={position.token1Position[0].bits}
          isStablePool={position.isStable}
        />
        <PositionLabel />
      </div>
      <p
        className={styles.positionPrice}
      >{`Size: ${coinAAmount} ${coinAMetadata.symbol} <> ${coinBAmount} ${coinBMetadata.symbol}`}</p>
      <p className={styles.poolDescription}>{poolDescription}</p>
    </div>
  );
};

export default MobilePositionItem;

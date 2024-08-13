import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import PositionLabel from "@/src/components/pages/liquidity-page/components/Positions/PositionLabel/PositionLabel";

import styles from "./MobilePositionItem.module.css";

const MobilePositionItem = () => {
  return (
    <div className={styles.mobilePositionItem}>
      <div className={styles.infoSection}>
        <CoinPair firstCoin="ETH" secondCoin="USDT" />
        <PositionLabel />
      </div>
      <p className={styles.positionPrice}>{`Selected Price: 0 UNI <> ∞ UNI`}</p>
    </div>
  );
};

export default MobilePositionItem;

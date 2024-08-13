import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import InfoBlock from "@/src/components/common/InfoBlock/InfoBlock";

import styles from './MobilePoolItem.module.css';

const MobilePoolItem = () => {
  return (
    <div className={styles.mobilePoolItem}>
      <div className={styles.infoSection}>
        <CoinPair firstCoin="ETH" secondCoin="USDT" />
        <div className={styles.infoBlocks}>
          <InfoBlock title="APR" value="67,78%" type="positive" />
          <InfoBlock title="24H Volume" value="$456,567" />
          <InfoBlock title="TVL" value="$1,307,567" />
        </div>
      </div>
      <ActionButton className={styles.addButton}>
        Add Liquidity
      </ActionButton>
    </div>
  );
};

export default MobilePoolItem;

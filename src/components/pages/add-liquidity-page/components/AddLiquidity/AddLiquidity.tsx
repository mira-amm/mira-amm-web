import CoinPair from "@/src/components/common/CoinPair/CoinPair";

import styles from './AddLiquidity.module.css';
import {clsx} from "clsx";
import CurrencyBox from "@/src/components/common/Swap/components/CurrencyBox/CurrencyBox";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import CoinInput from "@/src/components/pages/add-liquidity-page/components/CoinInput/CoinInput";

const AddLiquidity = () => {
  return (
    <section className={styles.addLiquidity}>
      <p className={styles.title}>
        Add Liquidity
      </p>
      <div className={styles.section}>
        <p>Selected pair</p>
        <div className={styles.sectionContent}>
          <div className={styles.coinPair}>
            <CoinPair firstCoin="ETH" secondCoin="USDT" />
            <p className={styles.APR}>
              Estimated APR
              <span className={styles.highlight}>+58,78%</span>
            </p>
          </div>
          <div className={styles.fee}>
            0.30% fee tier
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <p>Deposit amount</p>
        <div className={styles.sectionContent}>
          <CoinInput coin="ETH"/>
          <CoinInput coin="USDT"/>
        </div>
      </div>
      <div className={clsx(styles.section, styles.prices)}>
        <p>Selected Price</p>
        <div className={clsx(styles.sectionContent, styles.priceBlocks)}>
          <div className={styles.priceBlock}>
            <p>Low price</p>
            <p>0</p>
          </div>
          <div className={styles.priceBlock}>
            <p>High price</p>
            <p>∞</p>
          </div>
        </div>
      </div>
      <ActionButton>
        Preview
      </ActionButton>
    </section>
  );
};

export default AddLiquidity;

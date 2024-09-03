import styles from './RemoveLiquidityModalContent.module.css';
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import InfoIcon from "@/src/components/icons/Info/InfoIcon";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";

type Props = {
  closeModal: VoidFunction;
}

const RemoveLiquidityModalContent = ({ closeModal }: Props) => {
  return (
    <div className={styles.removeLiquidityContent}>
      <CoinPair firstCoin="ETH" secondCoin="USDT" />
      <div className={styles.valueAndMax}>
        <p className={styles.value}>25%</p>
        <button className={styles.maxButton}>Max</button>
      </div>
      <input type="range" className={styles.slider} />
      <div className={styles.someText}>
        <p className={styles.dimmed}>Withdraw fees only</p>
        <p className={styles.highlight}>Fees only</p>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.liquidityTable}>
          <thead>
          <tr>
            <th />
            <th>ETH</th>
            <th>USDT</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>Deposited</td>
            <td>2.145.49</td>
            <td>0</td>
          </tr>
          <tr>
            <td>Withdrawal fees</td>
            <td>31.1495</td>
            <td>0</td>
          </tr>
          <tr>
            <td>Earned fees</td>
            <td>6.0390</td>
            <td>9.34905</td>
          </tr>
          <tr className={styles.lastRow}>
            <td>
              Total
            </td>
            <td>
              3.0541
            </td>
            <td>
              4.40557
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      <div className={styles.textBlock}>
        <p className={styles.infoBlockTitle}>
          <InfoIcon/>
          Pay attention
        </p>
        <p className={styles.infoBlockText}>
          This based on the current price of the pool. Your fees earned will always increase,
          but the principal amount may change with the price of the pool
        </p>
      </div>
      <div className={styles.buttons}>
        <ActionButton>Confirm</ActionButton>
        <ActionButton variant="secondary" onClick={closeModal}>Cancel</ActionButton>
      </div>
    </div>
  );
};

export default RemoveLiquidityModalContent;

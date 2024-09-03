import CoinWithAmount from "@/src/components/common/CoinWithAmount/CoinWithAmount";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import styles from './WithdrawFeesModalContent.module.css';

const WithdrawFeesModalContent = () => {
  return (
    <div className={styles.withdrawFeesContent}>
      <p>Collecting fees will withdraw currently available fees for you</p>
      <div className={styles.coins}>
        <CoinWithAmount coin="USDT" amount="0"/>
        <CoinWithAmount coin="ETH" amount="<0.002"/>
      </div>
      <ActionButton onClick={() => {}} fullWidth>
        Collect
      </ActionButton>
    </div>
  )
};

export default WithdrawFeesModalContent;

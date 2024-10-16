import styles from './TransactionFailureModal.module.css';
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import FailureIcon from "@/src/components/icons/Failure/FailureIcon";

type Props = {
  closeModal: VoidFunction;
}

const TransactionFailureModal = ({ closeModal }: Props) => {
  return (
    <div className={styles.claimFailureModal}>
      <FailureIcon />
      <p className={styles.mainText}>Transaction failed</p>
      <p className={styles.subText}>
        This may be due to high slippage. Please try again.
      </p>
      <ActionButton onClick={closeModal} className={styles.viewButton}>
        Try again
      </ActionButton>
    </div>
  );
};

export default TransactionFailureModal;

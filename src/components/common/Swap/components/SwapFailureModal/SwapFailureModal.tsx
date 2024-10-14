import styles from './SwapFailureModal.module.css';
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import FailureIcon from "@/src/components/icons/Failure/FailureIcon";
import {FuelError} from "fuels";

type Props = {
  error: Error | null;
  closeModal: VoidFunction;
}

const SwapFailureModal = ({ error, closeModal }: Props) => {
  let subText = 'An error occurred. Please try again.';
  if (error instanceof FuelError && (error.message.includes('Insufficient output amount') || error.message.includes('Exceeding input amount'))) {
    subText = 'Slippage exceeds limit. Adjust settings and try again.';
  }

  return (
    <div className={styles.claimFailureModal}>
      <FailureIcon />
      <p className={styles.mainText}>Swap failed</p>
      <p className={styles.subText}>
        {subText}
      </p>
      <ActionButton onClick={closeModal} className={styles.viewButton}>
        Try again
      </ActionButton>
    </div>
  );
};

export default SwapFailureModal;

import styles from './SwapFailureModal.module.css';
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import FailureIcon from "@/src/components/icons/Failure/FailureIcon";
import {ErrorCode, FuelError} from "fuels";

type Props = {
  error: Error | null;
  closeModal: VoidFunction;
}

const SwapFailureModal = ({ error, closeModal }: Props) => {
  let message = 'An error occurred. Please try again.';
  let title = 'Swap failed';

  if (error instanceof FuelError) {
    message = error.message;
    if (
      error.code === ErrorCode.SCRIPT_REVERTED && (
        error.message.includes('Insufficient output amount') || error.message.includes('Exceeding input amount')
      )
    ) {
      message = 'Slippage exceeds limit. Adjust settings and try again.';
    }
  } else if (error?.message === 'User rejected the transaction!') {
    message = 'You closed your wallet before sending the transaction. Try again?';
    title = 'Swap canceled';
  }

  return (
    <div className={styles.claimFailureModal}>
      <FailureIcon />
      <p className={styles.mainText}>{title}</p>
      <p className={styles.subText}>
        {message}
      </p>
      <ActionButton onClick={closeModal} className={styles.viewButton}>
        Try again
      </ActionButton>
    </div>
  );
};

export default SwapFailureModal;

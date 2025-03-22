import styles from "./TransactionFailureModal.module.css";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import FailureIcon from "@/src/components/icons/Failure/FailureIcon";
import {FuelError} from "fuels";

type Props = {
  error: Error | null;
  closeModal: VoidFunction;
};

const TransactionFailureModal = ({closeModal, error}: Props) => {
  const title = error instanceof FuelError ? "Transaction failed" : "Failure";
  let message: string;
  if (error instanceof FuelError) {
    message = error.message;
  } else {
    message =
      "An error occurred while processing your request. Please try again or contact support if the issue persists.";
  }

  return (
    <div className={styles.claimFailureModal}>
      <FailureIcon />
      <p className={styles.mainText}>{title}</p>
      <p className={styles.subText}>{message}</p>
      <ActionButton onClick={closeModal} className={styles.viewButton}>
        Try again
      </ActionButton>
    </div>
  );
};

export default TransactionFailureModal;

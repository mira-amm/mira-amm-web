import styles from "./SwapFailureModal.module.css";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import FailureIcon from "@/src/components/icons/Failure/FailureIcon";
import clsx from "clsx";
import {ErrorCode, FuelError} from "fuels";

type Props = {
  error: Error | null;
  closeModal: VoidFunction;
  customTitle?: string;
};

const SwapFailureModal = ({error, closeModal, customTitle}: Props) => {
  let message = "An error occurred. Please try again.";
  let title = "Swap failed";

  if (error instanceof FuelError) {
    message = error.message;
    if (
      error.code === ErrorCode.SCRIPT_REVERTED &&
      (error.message.includes("Insufficient output amount") ||
        error.message.includes("Exceeding input amount"))
    ) {
      message = "Slippage exceeds limit. Adjust settings and try again.";
    }
  } else if (error?.message === "User rejected the transaction!") {
    message =
      "You closed your wallet before sending the transaction. Try again?";
    title = "Swap canceled";
  }

  return (
    <div className={styles.claimFailureModal}>
      <FailureIcon />
      <p className={clsx(styles.mainText, "mc-type-xxl")}>
        {customTitle && customTitle.length > 0 ? customTitle : title}
      </p>
      <p className={clsx(styles.subText, "mc-type-b")}>{message}</p>
      <ActionButton onClick={closeModal} fullWidth>
        Try again
      </ActionButton>
    </div>
  );
};

export default SwapFailureModal;

import styles from "./SwapFailureModal.module.css";
import {ErrorCode, FuelError} from "fuels";
import {CircleX} from "lucide-react";
import {Button} from "@/meshwave-ui/Button";

export default function SwapFailureModal({
  error,
  closeModal,
  customTitle,
}: {
  error: Error | null;
  closeModal: VoidFunction;
  customTitle?: string;
}) {
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
      <CircleX />
      <p className={styles.mainText}>
        {customTitle && customTitle.length > 0 ? customTitle : title}
      </p>
      <p className={styles.subText}>{message}</p>
      <Button
        onClick={closeModal}
        clasName="w-full bg-accent-primary text-old-mira-text border border-accent-primary shadow-[1px_1px_20px_0_#a1db0b4d] hover:shadow-[1px_1px_30px_0_#a1db0b4d] hover:bg-old-mira-active-btn cursor-pointer"
      >
        Try again
      </Button>
    </div>
  );
}

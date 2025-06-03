import {ActionButton} from "@/src/components/common";
import {FailureIcon} from "@/meshwave-ui/icons";
import {FuelError} from "fuels";

export function TransactionFailureModal({
  closeModal,
  error,
}: {
  error: Error | null;
  closeModal: VoidFunction;
}) {
  const title = error instanceof FuelError ? "Transaction failed" : "Failure";
  const message =
    error instanceof FuelError
      ? error.message
      : "An error occurred while processing your request. Please try again or contact support if the issue persists.";

  return (
    <div className="flex flex-col items-center gap-3 lg:gap-6">
      <FailureIcon className="w-[40px] h-[40px] lg:w-[80px] lg:h-[80px]" />
      <p className="font-medium text-[22px] leading-[26px] text-center">
        {title}
      </p>
      <p className="text-[14px] leading-[16px] text-content-dimmed-dark text-center">
        {message}
      </p>
      <ActionButton onClick={closeModal} className="w-full">
        Try again
      </ActionButton>
    </div>
  );
}

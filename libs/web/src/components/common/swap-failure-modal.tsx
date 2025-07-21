"use client";

import {ErrorCode, FuelError} from "fuels";
import {CircleX} from "lucide-react";
import {Button} from "@/meshwave-ui/Button";

export function SwapFailureModal({
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
    <div className="flex flex-col items-center gap-3 lg:gap-6 pb-3">
      <CircleX className="w-6 h-6 lg:w-20 lg:h-20 text-red-400" />
      <p className="font-medium text-[22px] leading-[26px] text-center">
        {customTitle?.length ? customTitle : title}
      </p>
      <p className="text-sm leading-4 text-content-primary dark:text-content-dimmed-dark text-center">
        {message}
      </p>
      <Button onClick={closeModal} block>
        Try again
      </Button>
    </div>
  );
}

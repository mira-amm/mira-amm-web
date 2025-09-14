import Link from "next/link";
import {SwapState} from "@/src/components/common/Swap/Swap";
import {FuelAppUrl} from "@/src/utils/constants";
import {useAssetMetadata} from "@/src/hooks";
import {Button} from "@/meshwave-ui/Button";
import {CircleCheck} from "lucide-react";

export function SwapSuccessModal({
  swapState,
  transactionHash,
}: {
  swapState: SwapState;
  transactionHash: string | undefined;
}) {
  return (
    <div className="flex flex-col items-center gap-3 pb-3">
      <CircleCheck className="w-12 h-12 text-green-500" />
      <p className="text-[22px] leading-[26px] text-center text-content-primary">
        Swap success
      </p>
      <Link
        href={`${FuelAppUrl}/tx/${transactionHash}/simple`}
        target="_blank"
        className="w-full"
      >
        <Button block size="2xl">
          View transaction
        </Button>
      </Link>
    </div>
  );
}

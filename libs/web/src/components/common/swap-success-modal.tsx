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
  const sellMetadata = useAssetMetadata(swapState.sell.assetId);
  const buyMetadata = useAssetMetadata(swapState.buy.assetId);

  const subText = `${swapState.sell.amount} ${sellMetadata.symbol} for ${swapState.buy.amount} ${buyMetadata.symbol}`;

  return (
    <div className="flex flex-col items-center gap-3 pb-3">
      <CircleCheck className="w-12 h-12 text-green-500" />
      <p className="font-medium text-[22px] leading-[26px] text-center">
        Swap success
      </p>
      <p className="text-[14px] leading-[16px] text-content-dimmed-dark text-center">
        {subText}
      </p>
      <Link
        href={`${FuelAppUrl}/tx/${transactionHash}/simple`}
        target="_blank"
        className="w-full"
      >
        <Button block>View transaction</Button>
      </Link>
    </div>
  );
}

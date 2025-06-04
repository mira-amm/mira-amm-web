import Link from "next/link";
import {SuccessIcon} from "@/meshwave-ui/icons";
import {SwapState} from "@/src/components/common/Swap/Swap";
import {FuelAppUrl} from "@/src/utils/constants";
import {useAssetMetadata} from "@/src/hooks";
import {Button} from "@/meshwave-ui/Button";

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
    <div className="flex flex-col items-center gap-3 lg:gap-6">
      <SuccessIcon className="lg:w-20 lg:h-20" />
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

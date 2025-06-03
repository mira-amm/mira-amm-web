import {SuccessIcon} from "@/meshwave-ui/icons";
import {useCallback} from "react";
import {openNewTab} from "@/src/utils/common";
import {CoinName} from "@/src/utils/coinsConfig";
import {FuelAppUrl} from "@/src/utils/constants";
import {Button} from "@/meshwave-ui/Button";

export default function CreatePoolSuccessModal({
  coinA,
  coinB,
  firstCoinAmount,
  secondCoinAmount,
  transactionHash,
}: {
  coinA: CoinName;
  coinB: CoinName;
  firstCoinAmount: string;
  secondCoinAmount: string;
  transactionHash: string | undefined;
}) {
  const handleViewTransactionClick = useCallback(() => {
    if (!transactionHash) return;
    openNewTab(`${FuelAppUrl}/tx/${transactionHash}/simple`);
  }, [transactionHash]);

  const subText = `Added ${firstCoinAmount} ${coinA} and ${secondCoinAmount} ${coinB}`;

  return (
    <div className="flex flex-col items-center gap-[12px] lg:gap-[24px]">
      <div className="lg:w-[80px] lg:h-[80px]">
        <SuccessIcon />
      </div>
      <p className="text-[22px] leading-[26px] font-medium text-center">
        Success
      </p>
      <p className="text-[14px] leading-[16px] text-content-dimmed-dark text-center">
        {subText}
      </p>
      <Button
        onClick={handleViewTransactionClick}
        className="w-full bg-accent-primary text-old-mira-text border border-accent-primary shadow-[1px_1px_20px_0_#a1db0b4d] hover:shadow-[1px_1px_30px_0_#a1db0b4d] hover:bg-old-mira-active-btn cursor-pointer"
      >
        View transaction
      </Button>
    </div>
  );
}

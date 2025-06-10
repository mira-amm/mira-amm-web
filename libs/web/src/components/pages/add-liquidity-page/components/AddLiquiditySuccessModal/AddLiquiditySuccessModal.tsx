import {useCallback} from "react";
import {openNewTab} from "@/src/utils/common";
import {CoinName} from "@/src/utils/coinsConfig";
import {FuelAppUrl} from "@/src/utils/constants";
import {Button} from "@/meshwave-ui/Button";
import {CircleCheck} from "lucide-react";

export default function AddLiquiditySuccessModal({
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
    <div className="flex flex-col items-center gap-3 pb-3">
      <CircleCheck className="w-12 h-12 text-green-500" />
      <p className="text-[22px] leading-[26px] font-medium text-center">
        Success
      </p>
      <p className="text-[14px] leading-[16px] text-content-dimmed-dark text-center">
        {subText}
      </p>
      <Button onClick={handleViewTransactionClick} block>
        View transaction
      </Button>
    </div>
  );
}

import SuccessIcon from "@/src/components/icons/SuccessIcon";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import { useCallback } from "react";
import { openNewTab } from "@/src/utils/common";
import { CoinName } from "@/src/utils/coinsConfig";
import { FuelAppUrl } from "@/src/utils/constants";

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
}){
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
      <p className="text-[14px] leading-[16px] text-[var(--content-dimmed-dark)] text-center">
        {subText}
      </p>
      <ActionButton onClick={handleViewTransactionClick} className="w-full">
        View transaction
      </ActionButton>
    </div>
  );
};

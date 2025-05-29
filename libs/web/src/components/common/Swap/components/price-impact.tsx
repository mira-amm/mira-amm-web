import { FC } from "react";
import { clsx } from "clsx";

const getPriceImpact = (
  reservesPrice?: number,
  previewPrice?: number
): number => {
  if (!reservesPrice || previewPrice === undefined) return -1;
  if (reservesPrice <= previewPrice) return 0;
  return Math.min(((reservesPrice - previewPrice) / reservesPrice) * 100, 99.99);
};

export const PriceImpact: FC<{
  reservesPrice?: number;
  previewPrice?: number;
}> = ({ reservesPrice, previewPrice }) => {
  const impact = getPriceImpact(reservesPrice, previewPrice);
  const isHidden = impact === -1;

  return (
    <p
      className={clsx(
        "w-fit flex items-center gap-[10px] text-xs leading-[18px] bg-transparent border-none cursor-pointer",
        "lg:text-[13px]",
        impact > 5 && "text-[#e43d4b]",
        impact > 2 && impact <= 5 && "text-[#d4b226]",
        isHidden && "opacity-0"
      )}
    >
      Price impact: {impact.toFixed(2)}%
    </p>
  );
};

import {FC} from "react";
import {clsx} from "clsx";

const getPriceImpact = (
  reservesPrice?: number,
  previewPrice?: number,
): number => {
  if (!reservesPrice || previewPrice === undefined) return -1;
  if (reservesPrice <= previewPrice) return 0;
  return Math.min(
    ((reservesPrice - previewPrice) / reservesPrice) * 100,
    99.99,
  );
};

export const PriceImpact: FC<{
  reservesPrice?: number;
  previewPrice?: number;
}> = ({reservesPrice, previewPrice}) => {
  const impact = getPriceImpact(reservesPrice, previewPrice);
  const isHidden = impact === -1;
  const highPriceImpact = impact > 5;
  const mediumPriceImpact = impact > 2 && impact <= 5;

  return (
    <>
      <p
        className={clsx(
          "flex justify-between items-center text-xs leading-[18px] bg-transparent border-none cursor-pointer",
          "lg:text-[13px]",
          highPriceImpact && "text-accent-warning",
          mediumPriceImpact && "text-accent-alert",
          isHidden && "opacity-0",
        )}
      >
        <span>Price impact:</span> <span>{impact.toFixed(2)}%</span>
      </p>

      {(highPriceImpact || mediumPriceImpact) && (
        <p
          className={clsx(
            "leading-[18px] bg-transparent border-none cursor-pointer lg:text-[13px]",
            highPriceImpact ? "text-accent-warning" : "text-accent-alert",
          )}
        >
          WARNING: {highPriceImpact ? "Large" : "Medium"} Price impact detected
        </p>
      )}
    </>
  );
};

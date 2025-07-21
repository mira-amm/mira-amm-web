import {FC} from "react";
import {cn} from "@/src/utils/cn";

const getPriceImpact = (
  reservesPrice?: number,
  previewPrice?: number
): number => {
  if (!reservesPrice || previewPrice === undefined) return -1;
  if (reservesPrice <= previewPrice) return 0;
  return Math.min(
    ((reservesPrice - previewPrice) / reservesPrice) * 100,
    99.99
  );
};

export const PriceImpact: FC<{
  reservesPrice?: number;
  previewPrice?: number;
  showWarning?: boolean;
}> = ({reservesPrice, previewPrice, showWarning = false}) => {
  const impact = getPriceImpact(reservesPrice, previewPrice);
  const isHidden = impact === -1;
  const highPriceImpact = impact > 5;
  const mediumPriceImpact = impact > 2 && impact <= 5;

  return (
    <>
      <p
        className={cn(
          "flex justify-between items-center leading-[18px] bg-transparent border-none cursor-pointer",
          highPriceImpact && "text-accent-warning",
          mediumPriceImpact && "text-accent-alert",
          isHidden && "opacity-0"
        )}
      >
        <span className="mr-1 text-xs lg:text-[13px]">Price impact: </span>
        <span className="text-xs lg:text-[13px]">{impact.toFixed(2)}%</span>
      </p>

      {showWarning && (highPriceImpact || mediumPriceImpact) && (
        <p
          className={cn(
            "leading-[18px] bg-transparent border-none cursor-pointer text-xs lg:text-[13px]",
            highPriceImpact ? "text-accent-warning" : "text-accent-alert"
          )}
        >
          WARNING: {highPriceImpact ? "Large" : "Medium"} Price impact detected
        </p>
      )}
    </>
  );
};

export const PriceImpactNew: FC<{
  reservesPrice?: number;
  previewPrice?: number;
}> = (props) => <PriceImpact {...props} showWarning={true} />;

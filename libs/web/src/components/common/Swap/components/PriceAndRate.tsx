import {memo} from "react";
import {PriceImpact, ExchangeRate} from "@/src/components/common";
import type {SwapState} from "@/src/hooks";

export const PriceAndRate = memo(function PriceAndRate({
 swapState,
 reservesPrice,
 previewPrice,
}: {
  swapState: SwapState;
  reservesPrice: number | undefined;
  previewPrice: number | undefined;
}) {
  return (
    <div className="flex justify-between">
      <PriceImpact reservesPrice={reservesPrice} previewPrice={previewPrice} />
      <div className="flex justify-end">
        <ExchangeRate swapState={swapState} />
      </div>
    </div>
  );
});

PriceAndRate.displayName = "PriceAndRate";

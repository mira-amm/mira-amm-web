import {memo} from "react";
import {SwapState} from "@/src/hooks";
import {ExchangeRate} from "@/src/components/common";

export const Rate = memo(function Rate({swapState}: {swapState: SwapState}) {
  return (
    <div className="flex justify-end">
      <ExchangeRate swapState={swapState} />
    </div>
  );
});

Rate.displayName = "Rate";

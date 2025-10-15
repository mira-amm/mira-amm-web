import {useState} from "react";

export type SlippageMode = "auto" | "custom";

export function useSwapSettings() {
  const [slippage, setSlippage] = useState<number>(100);
  const [slippageMode, setSlippageMode] = useState<SlippageMode>("auto");

  return {
    slippage,
    setSlippage,
    slippageMode,
    setSlippageMode,
  };
}

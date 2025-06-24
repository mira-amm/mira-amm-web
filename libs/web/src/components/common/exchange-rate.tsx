"use client"

import {useState} from "react";
import {ExchangeIcon} from "@/meshwave-ui/icons";
import {
  CurrencyBoxMode,
  SwapState
} from "@/src/components/common/Swap/Swap";
import { useExchangeRate } from "@/src/hooks/useExchangeRate";
import { useAnimationStore } from "@/src/stores/useGlitchScavengerHunt";

export function ExchangeRate({swapState}: {swapState: SwapState}) {
  const [mode, setMode] = useState<CurrencyBoxMode>("sell");

  const handleClick = () => {
    setMode((prev) => (prev === "sell" ? "buy" : "sell"));
    useAnimationStore.getState().handleMagicTripleClickCurrency();
  };

  const rate = useExchangeRate(swapState, mode);

  if (!rate) return null;

  return (
    <button
      onClick={handleClick}
      className="w-fit flex items-center gap-[10px] text-xs leading-[18px] text-content-dimmed-light bg-transparent border-none cursor-pointer lg:text-[13px]"
    >
      {rate}
      <ExchangeIcon />
    </button>
  );
}

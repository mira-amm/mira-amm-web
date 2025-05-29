import { useState } from "react";
import { CurrencyBoxMode, SwapState } from "@/src/components/common/Swap/Swap";
import { ExchangeIcon } from "@/meshwave-ui/icons";
import useExchangeRate from "@/src/hooks/useExchangeRate/useExchangeRate";
import { useAnimationStore } from "@/src/stores/useGlitchScavengerHunt";

function ExchangeRate({ swapState }: { swapState: SwapState }) {
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
      className="w-fit flex items-center gap-[10px] text-xs leading-[18px] text-[var(--content-dimmed-light)] bg-transparent border-none cursor-pointer lg:text-[13px]"
    >
      {rate}
      <ExchangeIcon />
    </button>
  );
}

export default ExchangeRate;

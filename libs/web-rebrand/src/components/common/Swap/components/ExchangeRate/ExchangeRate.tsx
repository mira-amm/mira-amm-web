import {memo, useState} from "react";
import {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import ExchangeIcon from "@/src/components/icons/Exchange/ExchangeIcon";
import useExchangeRate from "@/src/hooks/useExchangeRate/useExchangeRate";

import styles from "./ExchangeRate.module.css";
import clsx from "clsx";

type Props = {
  swapState: SwapState;
  className?: string;
};

const ExchangeRate = ({swapState, className}: Props) => {
  const [mode, setMode] = useState<CurrencyBoxMode>("sell");

  const handleClick = () => {
    setMode((prevMode) => (prevMode === "sell" ? "buy" : "sell"));
  };

  const rate = useExchangeRate(swapState, mode);

  if (!rate) {
    return null;
  }

  return (
    <div className={className}>
      <button
        className={clsx(styles.exchangeRate, "mc-mono-b")}
        onClick={handleClick}
      >
        {rate}
        <ExchangeIcon />
      </button>
    </div>
  );
};

export default memo(ExchangeRate);

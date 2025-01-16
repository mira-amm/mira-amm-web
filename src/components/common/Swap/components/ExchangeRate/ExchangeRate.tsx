import {memo, useState} from "react";
import {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import ExchangeIcon from "@/src/components/icons/Exchange/ExchangeIcon";
import useExchangeRate from "@/src/hooks/useExchangeRate/useExchangeRate";

import styles from "./ExchangeRate.module.css";

type Props = {
  swapState: SwapState;
};

const ExchangeRate = ({swapState}: Props) => {
  const [mode, setMode] = useState<CurrencyBoxMode>("sell");

  const handleClick = () => {
    setMode((prevMode) => (prevMode === "sell" ? "buy" : "sell"));
  };

  const rate = useExchangeRate(swapState, mode);

  if (!rate) {
    return null;
  }

  return (
    <button className={styles.exchangeRate} onClick={handleClick}>
      {rate}
      <ExchangeIcon />
    </button>
  );
};

export default memo(ExchangeRate);

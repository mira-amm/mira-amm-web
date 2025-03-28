// import WarningIcon from "@/src/components/icons/Warning/WarningIcon";
import buttonstyles from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/AddLiquidity.module.css";

import styles from "./SettingsModalContent.module.css";
import React, {
  ChangeEvent,
  Dispatch,
  memo,
  SetStateAction,
  useState,
  KeyboardEvent,
  FocusEvent,
  useRef,
} from "react";
import {clsx} from "clsx";
import {DefaultSlippageValue} from "@/src/components/common/Swap/Swap";

type Props = {
  slippage: number;
  setSlippage: Dispatch<SetStateAction<number>>;
};

const AutoSlippageValues = [10, 50, 100];

const getInitialSelectedSlippage = (value: number) => {
  if (AutoSlippageValues.includes(value)) return value;
  return null;
};

const SettingsModalContent = ({slippage, setSlippage}: Props) => {
  const [inputValue, setInputValue] = useState(`${slippage / 100}`);

  const [selectedSlippageValue, setSelectedSlippageValue] = useState<
    number | null
  >(getInitialSelectedSlippage(slippage));

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSlippageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
  };

  const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const numericValue = parseFloat(value.replace(",", "."));
    if (isNaN(numericValue) || numericValue <= 0 || numericValue >= 100) {
      setSlippage(DefaultSlippageValue);
      return;
    }
    const formattedValue = numericValue * 100;
    const fixedToTwo = formattedValue.toFixed(2);
    const flooredValue = Math.floor(Number(fixedToTwo));
    setSlippage(flooredValue);
    if (flooredValue !== selectedSlippageValue) setSelectedSlippageValue(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      let value = inputValue;
      value = value.slice(0, -1);
      setInputValue(value);
      event.preventDefault();
    }

    if (event.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  const onSelectSlippageValue = (value: number) => {
    setSelectedSlippageValue(value);
    setInputValue(`${value / 100}`);
    setSlippage(value);
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsSection}>
        <p className={clsx(styles.settingsText, "mc-type-m")}>
          The amount the price can change unfavorably before the trade reverts
        </p>
      </div>
      <div className={styles.inputWrapper}>
        <div className={buttonstyles.poolStability}>
          {AutoSlippageValues.map((value) => (
            <React.Fragment key={value}>
              <div
                className={clsx(
                  buttonstyles.poolStabilityButton,
                  (selectedSlippageValue === value ||
                    Number(inputValue) === value) &&
                    buttonstyles.poolStabilityButtonActive,
                )}
                onClick={() => onSelectSlippageValue(value)}
                role="button"
              >
                <div className={buttonstyles.poolStabilityButtonContent}>
                  <span
                    className={
                      (buttonstyles.poolStabilityButtonText,
                      styles.inputContent,
                      "mc-mono-m")
                    }
                  >
                    {value / 100}%
                  </span>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <p className={clsx(styles.inputContent, "mc-type-m")}>or</p>
        <div>
          <input
            type="number"
            className={clsx(styles.slippageInput, "mc-mono-m")}
            inputMode="decimal"
            min="0.1"
            step="0.1"
            value={inputValue}
            onChange={handleSlippageChange}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            ref={inputRef}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(SettingsModalContent);

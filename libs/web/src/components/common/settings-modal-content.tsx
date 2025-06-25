"use client"

import {
  ChangeEvent,
  Dispatch,
  memo,
  SetStateAction,
  useState,
  KeyboardEvent,
  FocusEvent,
  useRef,
} from "react";

import {Info} from "lucide-react";
import {clsx} from "clsx";

import {SlippageMode} from "@/src/components/common/Swap/Swap";

import {useAnimationStore} from "@/src/stores/useGlitchScavengerHunt";

const AutoSlippageValues = [10, 50, 100];

export function SettingsModalContent({
  slippage,
  slippageMode,
  setSlippage,
  setSlippageMode,
  closeModal,
}: {
  slippage: number;
  slippageMode: SlippageMode;
  setSlippage: Dispatch<SetStateAction<number>>;
  setSlippageMode: Dispatch<SetStateAction<SlippageMode>>;
  closeModal: VoidFunction;
}) {
  const [inputValue, setInputValue] = useState(`${slippage / 100}%`);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSlippageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace("%", "");
    setInputValue(value + "%");
    useAnimationStore.getState().handleMagicInput(value);
  };

  const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    const value = event.target.value.replace("%", "");
    const numericValue = parseFloat(value.replace(",", "."));
    if (isNaN(numericValue) || numericValue <= 0 || numericValue >= 100) {
      setSlippage(100);
      return;
    }
    setSlippage(Math.floor(Number((numericValue * 100).toFixed(2))));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      let value = inputValue.replace("%", "");
      value = value.slice(0, -1);
      setInputValue(value + "%");
      event.preventDefault();
    }
    if (event.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  const handleSlippageButtonClick = (value: number) => {
    setSlippage(value);
    closeModal();
  };

  const handleSlippageModeChange = (mode: SlippageMode) => {
    setSlippageMode(mode);
    if (mode === "auto" && !AutoSlippageValues.includes(slippage)) {
      setSlippage(100);
    }
  };

  const isAutoMode = slippageMode === "auto";
  const isCustomMode = slippageMode === "custom";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-content-tertiary dark:text-white">
          Slippage Tolerance
        </p>
        <p className="text-content-tertiary dark:text-content-dimmed-light">
          The amount the price can change unfavorably before the trade reverts
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            className={clsx(
              "w-full px-3 py-[14px] rounded-lg text-content-dimmed-light bg-background-grey-dark hover:border dark:hover:border-accent-primary hover:border-black",
              isAutoMode &&
                "dark:border-accent-primary border border-content-tertiary bg-black dark:bg-background-grey-dark text-white",
            )}
            onClick={() => handleSlippageModeChange("auto")}
          >
            Auto
          </button>
          <button
            className={clsx(
              "w-full px-3 py-[14px] rounded-lg text-content-dimmed-light bg-background-grey-dark hover:border dark:hover:border-accent-primary hover:border-black",
              isCustomMode &&
                "dark:border-accent-primary border border-content-tertiary bg-black dark:bg-background-grey-dark text-white",
            )}
            onClick={() => handleSlippageModeChange("custom")}
          >
            Custom
          </button>
        </div>

        {isCustomMode && (
          <input
            type="text"
            inputMode="decimal"
            pattern="^[0-9]*[.,]?[0-9]*$"
            className="w-full px-3 py-[14px] rounded-lg text-content-dimmed-light bg-background-grey-dark focus:border-accent-primary focus:text-content-primary"
            value={inputValue}
            onChange={handleSlippageChange}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            ref={inputRef}
          />
        )}

        {isAutoMode && (
          <div className="flex gap-2">
            {AutoSlippageValues.map((value) => (
              <button
                key={value}
                className={clsx(
                  "w-full px-3 py-[14px] rounded-lg text-content-dimmed-light bg-background-grey-dark hover:border dark:hover:text-content-primary hover:border-accent-primary dark:hover:border-accent-primary hover:border-black",
                  slippage === value &&
                    "dark:border-accent-primary border border-content-tertiary bg-black dark:bg-background-grey-dark text-white",
                )}
                onClick={() => handleSlippageButtonClick(value)}
              >
                {value / 100}%
              </button>
            ))}
          </div>
        )}
      </div>

      {isCustomMode && (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2 text-content-tertiary dark:text-white">
            <Info /> Pay attention
          </p>
          <p className="text-content-tertiary dark:text-content-dimmed-light">
            Customized price impact limit may lead to loss of funds. Use it at
            your own risk
          </p>
        </div>
      )}
    </div>
  );
}

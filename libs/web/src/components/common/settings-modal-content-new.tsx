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
import {clsx} from "clsx";
import {useAnimationStore} from "@/src/stores/useGlitchScavengerHunt";

const AutoSlippageValues = [10, 50, 100];

function SettingsModalContentNew({
  slippage,
  setSlippage,
  closeModal,
}: {
  slippage: number;
  setSlippage: Dispatch<SetStateAction<number>>;
  closeModal: VoidFunction;
}) {
  const [inputValue, setInputValue] = useState(`${slippage / 100}`);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSlippageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    useAnimationStore.getState().handleMagicInput(value);
  };

  const DEFAULT_SLIPPAGE = 100;
  const MAX_SLIPPAGE = 99.99;

  const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const numericValue = parseFloat(value.replace(",", ".").trim());
    if (
      isNaN(numericValue) ||
      numericValue <= 0 ||
      numericValue > MAX_SLIPPAGE ||
      !Number.isFinite(numericValue)
    ) {
      setSlippage(DEFAULT_SLIPPAGE);
      setInputValue(`${DEFAULT_SLIPPAGE / 100}`);
      return;
    }
    setSlippage(Math.floor(Number((numericValue * 100).toFixed(2))));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      let value = inputValue;
      if (value.length === 0) return;
      value = value.slice(0, -1);
      setInputValue(value);
      if (value.length > 0) {
        useAnimationStore.getState().handleMagicInput(value);
      }
      event.preventDefault();
    }
    if (event.key === "Enter") {
      inputRef.current?.blur();
      closeModal();
    }
  };

  const handleSlippageButtonClick = (value: number) => {
    setSlippage(value);
    closeModal();
  };

  const numericSlippage = parseFloat(inputValue.replace(",", ".").trim());
  const showSlippageWarning =
    Number.isFinite(numericSlippage) && numericSlippage >= 20;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-content-tertiary dark:text-content-dimmed-light">
          The amount the price can change unfavorably before the trade reverts
        </p>
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex flex-1">
          {AutoSlippageValues.map((value) => (
            <button
              key={value}
              className={clsx(
                "w-full px-3 py-[14px] first:rounded-l-lg last:rounded-r-lg text-content-dimmed-light border bg-background-grey-dark hover:border dark:hover:text-content-primary hover:border-accent-primary dark:hover:border-accent-primary hover:border-black",
                slippage === value &&
                  "dark:border-accent-primary border border-content-tertiary bg-black dark:bg-background-grey-dark text-white"
              )}
              onClick={() => handleSlippageButtonClick(value)}
            >
              {value / 100}%
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center">
          <div className="flex justify-center items-center px-3">or</div>
          <p
            id="slippage-description"
            className="text-content-tertiary dark:text-content-dimmed-light"
          >
            {/* existing description text */}
          </p>
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            pattern="^[0-9]*[.,]?[0-9]*$"
            aria-label="Custom slippage percentage"
            aria-describedby="slippage-description"
            className="w-22 px-3 py-[14px] rounded-lg text-content-dimmed-light bg-background-grey-dark focus:border-accent-primary focus:text-content-primary"
            value={inputValue}
            onChange={handleSlippageChange}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            ref={inputRef}
          />
        </div>
      </div>
      {showSlippageWarning && (
        <div className="text-accent-warning font-medium text-sm">
          Slippage high, your transaction might be front run.
        </div>
      )}
    </div>
  );
}

export default memo(SettingsModalContentNew);

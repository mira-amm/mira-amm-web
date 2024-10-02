import WarningIcon from "@/src/components/icons/Warning/WarningIcon";
import styles from './SettingsModalContent.module.css';
import {ChangeEvent, Dispatch, memo, SetStateAction, useState, KeyboardEvent, FocusEvent, useRef} from "react";
import {clsx} from "clsx";
import {DefaultSlippageValue, SlippageMode} from "@/src/components/common/Swap/Swap";

type Props = {
  slippage: number;
  slippageMode: SlippageMode;
  setSlippage: Dispatch<SetStateAction<number>>
  setSlippageMode: Dispatch<SetStateAction<SlippageMode>>;
  closeModal: VoidFunction;
}

const AutoSlippageValues = [0.1, 0.5, 1];

const SettingsModalContent = ({ slippage, slippageMode, setSlippage, setSlippageMode, closeModal }: Props) => {
  const [inputValue, setInputValue] = useState(`${slippage}%`);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSlippageChange = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value.replace('%', '');
    setInputValue(value + '%');
  }

  const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    let value = event.target.value.replace('%', '');
    const numericValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numericValue) || numericValue <= 0 || numericValue >= 100) {
      setSlippage(DefaultSlippageValue);
      return;
    }
    setSlippage(numericValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      let value = inputValue.replace('%', '');
      value = value.slice(0, -1);
      setInputValue(value + '%');
      event.preventDefault();
    }

    if (event.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  const handleSlippageButtonClick = (value: number) => {
    setSlippage(value);
    closeModal();
  };

  const handleSlippageModeChange = (mode: SlippageMode) => {
    setSlippageMode(mode);
    if (mode === 'auto' && !AutoSlippageValues.includes(slippage)) {
      setSlippage(DefaultSlippageValue);
    }
  };

  const isAutoMode = slippageMode === 'auto';
  const isCustomMode = slippageMode === 'custom';

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsSection}>
        <p>Slippage Tolerance</p>
        <p className={styles.settingsText}>
          The amount the price can change unfavorably before the trade
          reverts
        </p>
      </div>
      <div className={styles.settingsSection}>
        <div className={styles.slippageButtons}>
          <button
            className={clsx(styles.slippageButton, isAutoMode && styles.slippageButtonActive)}
            onClick={() => handleSlippageModeChange('auto')}
          >
            Auto
          </button>
          <button
            className={clsx(styles.slippageButton, isCustomMode && styles.slippageButtonActive)}
            onClick={() => handleSlippageModeChange('custom')}
          >
            Custom
          </button>
        </div>
        {isCustomMode && (
          <input
            type="text"
            className={styles.slippageInput}
            inputMode="decimal"
            pattern="^[0-9]*[.,]?[0-9]*$"
            value={inputValue}
            onChange={handleSlippageChange}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            key="input"
            ref={inputRef}
          />
        )}
        {isAutoMode && (
          <div className={styles.slippageButtons}>
            {AutoSlippageValues.map((value) => (
              <button
                className={clsx(styles.slippageButton, slippage === value && styles.slippageButtonActive)}
                onClick={() => handleSlippageButtonClick(value)}
                key={value}
              >
                {value}%
              </button>
            ))}
          </div>
        )}
      </div>
      {isCustomMode && (
        <div className={styles.settingsSection}>
          <p className={styles.infoHeading}>
            <WarningIcon/>
            Pay attention
          </p>
          <p className={styles.settingsText}>
            Customized price impact limit may lead to loss of funds. Use it at
            your own risk
          </p>
        </div>
      )}
    </div>
  );
};

export default memo(SettingsModalContent);

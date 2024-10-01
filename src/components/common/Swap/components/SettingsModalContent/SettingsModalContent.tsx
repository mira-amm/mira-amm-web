import WarningIcon from "@/src/components/icons/Warning/WarningIcon";
import styles from './SettingsModalContent.module.css';
import {ChangeEvent, memo, useState} from "react";
import {clsx} from "clsx";

type Props = {
  slippage: number;
  setSlippage: (slippage: number) => void;
}

const SettingsModalContent = ({ slippage, setSlippage }: Props) => {
  const [mode, setMode] = useState<'auto' | 'custom'>('auto');

  const handleSlippageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    const re = /^(100|[1-9]?[0-9])([.,][0-9]+)?%$/;
    if (!re.test(value)) {
      return;
    }

    const numericValue = parseFloat(value.replace('%', ''));
    setSlippage(numericValue);
  }

  const inputValue = `${slippage}%`;

  const isAutoMode = mode === 'auto';
  const isCustomMode = mode === 'custom';

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
            onClick={() => setMode('auto')}
          >
            Auto
          </button>
          <button
            className={clsx(styles.slippageButton, isCustomMode && styles.slippageButtonActive)}
            onClick={() => setMode('custom')}
            disabled
          >
            Custom
          </button>
        </div>
        <input
          type="text"
          className={styles.slippageInput}
          inputMode="decimal"
          pattern="^[0-9]*[.,]?[0-9]*$"
          value={inputValue}
          onChange={handleSlippageChange}
          disabled={mode === 'auto'}
        />
        {isAutoMode && (
          <div className={styles.slippageButtons}>
            <button
              className={clsx(styles.slippageButton, slippage === 0.1 && styles.slippageButtonActive)}
              onClick={() => setSlippage(0.1)}
            >
              0.1%
            </button>
            <button
              className={clsx(styles.slippageButton, slippage === 0.5 && styles.slippageButtonActive)}
              onClick={() => setSlippage(0.5)}
            >
              0.5%
            </button>
            <button
              className={clsx(styles.slippageButton, slippage === 1 && styles.slippageButtonActive)}
              onClick={() => setSlippage(1)}
            >
              1%
            </button>
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

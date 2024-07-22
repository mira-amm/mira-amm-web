import {ChangeEvent, memo} from "react";
import {clsx} from "clsx";

import Coin from "@/src/components/common/Coin/Coin";
import ChevronDownIcon from "@/src/components/icons/ChevronDown/ChevronDownIcon";
import useModal from "@/src/hooks/useModal/useModal";
import SearchIcon from "@/src/components/icons/Search/SearchIcon";
import CoinListItem from "@/src/components/common/Swap/components/CoinListItem/CoinListItem";
import {coinsConfig} from "@/src/utils/coinsConfig";
import type {CurrencyBoxMode} from "@/src/components/common/Swap/Swap";

import styles from './CurrencyBox.module.css';

type Props = {
  value: string;
  coin: string;
  mode: CurrencyBoxMode;
  selectCoin: (coin: string) => void;
  setAmount: (amount: string) => void;
  loading: boolean;
};

const CurrencyBox = ({ value, coin, mode, selectCoin, setAmount, loading }: Props) => {
  const [Modal, openModal, closeModal] = useModal();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const re = /^[0-9]*[.,]?[0-9]*$/;

    if (re.test(inputValue)) {
      setAmount(inputValue);
    }
  };

  const handleCoinSelectorClick = () => {
    if (!loading) {
      openModal();
    }
  };

  const handleCoinSelection = (coin: string) => {
    selectCoin(coin);
    closeModal();
  };

  // const noValue = state.amount === '' || state.amount === '0';
  const coinNotSelected = coin === '';

  return (
    <>
      <div className={styles.currencyBox}>
        <p className={styles.title}>{mode === 'buy' ? 'Buy' : 'Sell'}</p>
        <div className={styles.content}>
          <input
            className={styles.input}
            type="text"
            inputMode="decimal"
            pattern="^[0-9]*[.,]?[0-9]*$"
            placeholder="0"
            minLength={1}
            value={value}
            disabled={coinNotSelected || loading}
            onChange={handleChange}
          />
          <button
            className={clsx(styles.selector, coinNotSelected && styles.selectorHighlighted)}
            onClick={handleCoinSelectorClick}
            disabled={loading}
          >
            {coinNotSelected ? (
              <p className={styles.chooseCoin}>Choose coin</p>
            ) : (
              <Coin name={coin} />
            )}
            <ChevronDownIcon />
          </button>
        </div>
        <p className={styles.estimate}>
          {/*{!noValue && '$41 626.62'}*/}
        </p>
      </div>
      {/* TODO: Create modal content component */}
      <Modal title="Choose token">
        <div className={styles.tokenSearch}>
          <SearchIcon />
          <input className={styles.tokenSearchInput} type="text" placeholder="Search by token or paste address"/>
        </div>
        <div className={styles.tokenList}>
          {Array.from(coinsConfig.keys()).map((coinName) => (
            <div className={styles.tokenListItem} onClick={() => handleCoinSelection(coinName)} key={coinName} >
              <CoinListItem name={coinName} />
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default memo(CurrencyBox);

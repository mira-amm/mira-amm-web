import styles from './CurrencyBox.module.css';
import Coin from "@/src/components/common/Coin/Coin";
import ChevronDownIcon from "@/src/components/icons/ChevronDown/ChevronDownIcon";
import useModal from "@/src/hooks/useModal/useModal";
import SearchIcon from "@/src/components/icons/Search/SearchIcon";
import {ChangeEvent, useState} from "react";
import {clsx} from "clsx";
import CoinListItem from "@/src/components/common/Swap/components/CoinListItem/CoinListItem";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {CurrencyBoxMode} from "@/src/components/common/Swap/Swap";

type Props = {
  mode: CurrencyBoxMode;
  selectedCoin: string;
  selectCoin: (coin: string) => void;
};

const CurrencyBox = ({ mode, selectedCoin, selectCoin }: Props) => {
  const [Modal, openModal, closeModal] = useModal();
  const [value, setValue] = useState('0');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    // Allow numbers, a single period for decimal numbers, or nothing at all for an empty string
    const re = /^-?\d*[.]?\d*$/;

    // If value is empty or matches regular expression, update the state
    if (inputValue === '' || re.test(inputValue)) {
      setValue(e.target.value);
    }
    // If input is empty or no 0's followed by non-zero number
    // if (inputValue === '' || /^0[^.][0-9]*$/.test(inputValue)) {
    //   setValue('0');
    // }
    // If input starts with 0 and not followed by dot
    // if (inputValue[0] === '0' && inputValue[1] !== '.') {
    //   setValue(inputValue.slice(1));
    // } else {
    //   setValue(inputValue)
    // }
  };

  const handleCoinSelection = (coin: string) => {
    selectCoin(coin);
    closeModal();
  }

  const noValue = value === '0' || value === '';

  const coinNotSelected = selectedCoin === '';

  return (
    <>
      <div className={styles.currencyBox}>
        <p className={styles.title}>{mode === 'buy' ? 'Buy' : 'Sell'}</p>
        <div className={styles.content}>
          <input className={styles.input} type="text" value={value} onChange={handleChange}/>
          <button className={clsx(styles.selector, coinNotSelected && styles.selectorHighlighted)} onClick={openModal}>
            {coinNotSelected ? (
              <p className={styles.chooseCoin}>Choose coin</p>
            ) : (
              <Coin name={selectedCoin} />
            )}
            <ChevronDownIcon />
          </button>
        </div>
        <p className={styles.estimate}>
          {!noValue && '$41 626.62'}
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
            <div className={styles.tokenListItem} onClick={() => handleCoinSelection(coinName)}>
              <CoinListItem name={coinName} key={coinName} />
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default CurrencyBox;

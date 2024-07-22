import SearchIcon from "@/src/components/icons/Search/SearchIcon";
import {coinsConfig} from "@/src/utils/coinsConfig";
import CoinListItem from "@/src/components/common/Swap/components/CoinListItem/CoinListItem";
import {ChangeEvent, useEffect, useRef, useState} from "react";
import styles from "./CoinsListModal.module.css";

type Props = {
  selectCoin: (coin: string) => void;
};

const CoinsListModal = ({ selectCoin }: Props) => {
  const [value, setValue] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const coinsList = Array.from(coinsConfig.keys());
  // TODO: Filter by fullname too
  const filteredCoinsList = coinsList.filter((coin) => coin.toLowerCase().includes(value.toLowerCase()));

  return (
    <>
      <div className={styles.tokenSearch}>
        <SearchIcon/>
        <input
          className={styles.tokenSearchInput}
          type="text"
          placeholder="Search by token or paste address"
          onChange={handleChange}
          ref={inputRef}
        />
      </div>
      <div className={styles.tokenList}>
        {filteredCoinsList.map((coinName) => (
          <div
            className={styles.tokenListItem}
            onClick={() => selectCoin(coinName)}
            key={coinName}
          >
            <CoinListItem name={coinName} />
          </div>
        ))}
      </div>
    </>
  );
};

export default CoinsListModal;

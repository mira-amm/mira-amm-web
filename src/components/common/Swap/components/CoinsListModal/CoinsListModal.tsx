import SearchIcon from "@/src/components/icons/Search/SearchIcon";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import CoinListItem from "@/src/components/common/Swap/components/CoinListItem/CoinListItem";
import {ChangeEvent, memo, useEffect, useMemo, useRef, useState} from "react";
import styles from "./CoinsListModal.module.css";
import {CoinQuantity} from "fuels";

type Props = {
  selectCoin: (coin: CoinName | null) => void;
  balances: CoinQuantity[] | undefined;
};

const coinsList = Array.from(coinsConfig.values());

const CoinsListModal = ({ selectCoin, balances }: Props) => {
  console.log('Balances in component', balances);
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

  const filteredCoinsList = useMemo(() => {
    return coinsList.filter((coin) => {
      return (
        coin.name?.toLowerCase().includes(value.toLowerCase()) ||
        coin.fullName?.toLowerCase().includes(value.toLowerCase())
      );
    });
  }, [value]);

  const sortedCoinsList = useMemo(() => {
    console.log('Balances in memo', balances);
    if (!balances) {
      return filteredCoinsList;
    }

    return filteredCoinsList.toSorted((coinA, coinB) => {
      const aDecimals = coinsConfig.get(coinA.name)?.decimals!;
      const aBalance = balances.find((b) => b.assetId === coinA.assetId)?.amount.toNumber();
      const aBalanceValue = aBalance ? aBalance / 10 ** aDecimals : 0;
      const bDecimals = coinsConfig.get(coinB.name)?.decimals!;
      const bBalance = balances.find((b) => b.assetId === coinB.assetId)?.amount.toNumber();
      const bBalanceValue = bBalance ? bBalance / 10 ** bDecimals : 0;

      if (aBalanceValue && bBalanceValue) {
        return bBalanceValue - aBalanceValue;
      }

      return 0;
    });
  }, [filteredCoinsList, balances]);

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
        {sortedCoinsList.map(({ name }) => (
          <div
            className={styles.tokenListItem}
            onClick={() => selectCoin(name)}
            key={name}
          >
            <CoinListItem
              name={name}
              balance={balances?.find((b) => b.assetId === coinsConfig.get(name)?.assetId)}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default memo(CoinsListModal);

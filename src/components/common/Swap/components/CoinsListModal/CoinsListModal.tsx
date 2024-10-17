import SearchIcon from "@/src/components/icons/Search/SearchIcon";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import CoinListItem from "@/src/components/common/Swap/components/CoinListItem/CoinListItem";
import {ChangeEvent, memo, useEffect, useMemo, useRef, useState} from "react";
import styles from "./CoinsListModal.module.css";
import {BN, CoinQuantity} from "fuels";
import {assetsList} from "@/src/utils/common";

type Props = {
  selectCoin: (coin: CoinName | null) => void;
  balances: CoinQuantity[] | undefined;
};

const priorityOrder: CoinName[] = ['ETH', 'USDC', 'USDT'];

const CoinsListModal = ({ selectCoin, balances }: Props) => {
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
    return assetsList.filter((coin) => {
      return (
        coin.name?.toLowerCase().includes(value.toLowerCase()) ||
        coin.fullName?.toLowerCase().includes(value.toLowerCase()) ||
        coin.assetId?.toLowerCase() === value.toLowerCase()
      );
    });
  }, [value]);

  // TODO: Pre-sort the list by priorityOrder and alphabet to avoid sorting each time
  const sortedCoinsList = useMemo(() => {
    return filteredCoinsList.toSorted((coinA, coinB) => {
      const firstAssetPriority = priorityOrder.indexOf(coinA.name);
      const secondAssetPriority = priorityOrder.indexOf(coinB.name);
      const bothAssetsHavePriority = firstAssetPriority !== -1 && secondAssetPriority !== -1;
      const eitherAssetHasPriority = firstAssetPriority !== -1 || secondAssetPriority !== -1;

      if (bothAssetsHavePriority) {
        return firstAssetPriority - secondAssetPriority;
      } else if (eitherAssetHasPriority) {
        return firstAssetPriority !== -1 ? -1 : 1;
      }

      if (balances) {
        const aBalance = balances.find((b) => b.assetId === coinA.assetId)?.amount ?? new BN(0);
        const aDecimals = coinsConfig.get(coinA.name)?.decimals ?? 0;
        const aDecimalsMultiplier = new BN(10).pow(aDecimals);
        const aBalanceNormalized = aBalance.mul(aDecimalsMultiplier);
        const bBalance = balances.find((b) => b.assetId === coinB.assetId)?.amount ?? new BN(0);
        const bDecimals = coinsConfig.get(coinB.name)?.decimals ?? 0;
        const bDecimalsMultiplier = new BN(10).pow(bDecimals);
        const bBalanceNormalized = bBalance.mul(bDecimalsMultiplier);

        if (!aBalanceNormalized.eq(bBalanceNormalized)) {
          return aBalanceNormalized.gt(bBalanceNormalized) ? -1 : 1;
        }
      }

      if (coinA.name && coinB.name) {
        return coinA.name.localeCompare(coinB.name);
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

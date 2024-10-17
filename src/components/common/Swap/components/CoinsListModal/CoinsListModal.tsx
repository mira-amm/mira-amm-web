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
    return filteredCoinsList.toSorted((firstAsset, secondAsset) => {
      const firstAssetPriority = priorityOrder.indexOf(firstAsset.name);
      const secondAssetPriority = priorityOrder.indexOf(secondAsset.name);
      const bothAssetsHavePriority = firstAssetPriority !== -1 && secondAssetPriority !== -1;
      const eitherAssetHasPriority = firstAssetPriority !== -1 || secondAssetPriority !== -1;

      if (bothAssetsHavePriority) {
        return firstAssetPriority - secondAssetPriority;
      } else if (eitherAssetHasPriority) {
        return firstAssetPriority !== -1 ? -1 : 1;
      }

      if (balances) {
        const firstAssetBalance = balances.find((b) => b.assetId === firstAsset.assetId)?.amount ?? new BN(0);
        const secondAssetBalance = balances.find((b) => b.assetId === secondAsset.assetId)?.amount ?? new BN(0);
        const firstAssetDecimals = coinsConfig.get(firstAsset.name)?.decimals ?? 0;
        const secondAssetDecimals = coinsConfig.get(secondAsset.name)?.decimals ?? 0;
        const firstAssetDivisor = new BN(10).pow(firstAssetDecimals);
        const secondAssetDivisor = new BN(10).pow(secondAssetDecimals);
        // Dividing BN to a large value can lead to zero, we use proportion rule here: a/b = c/d => a*d = b*c
        const firstAssetBalanceMultiplied = firstAssetBalance.mul(secondAssetDivisor);
        const secondAssetBalanceMultiplied = secondAssetBalance.mul(firstAssetDivisor);

        if (!firstAssetBalanceMultiplied.eq(secondAssetBalanceMultiplied)) {
          return firstAssetBalanceMultiplied.gt(secondAssetBalanceMultiplied) ? -1 : 1;
        }
      }

      if (firstAsset.name && secondAsset.name) {
        return firstAsset.name.localeCompare(secondAsset.name);
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

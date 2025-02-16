"use client";
import SearchIcon from "@/src/components/icons/Search/SearchIcon";
import CoinListItem from "@/src/components/common/Swap/components/CoinListItem/CoinListItem";
import {ChangeEvent, memo, useEffect, useMemo, useRef, useState} from "react";
import styles from "./CoinsListModal.module.css";
import {BN, CoinQuantity} from "fuels";
import {useAssetList} from "@/src/hooks/useAssetList";
import UnknownCoinListItem from "../UnknownCoinListItem";
import EmptySearchResults from "../EmptySearchResults";
import {CoinDataWithPrice} from "@/src/utils/coinsConfig";
import SkeletonLoader from "../SkeletonLoader/SkeletonLoader";
import {useVerifiedAssets} from "@/src/hooks/useVerifiedAssets";
import {checkIfCoinVerified} from "../CoinListItem/checkIfCoinVerified";

type Props = {
  balances: CoinQuantity[] | undefined;
  selectCoin: (assetId: string | null) => void;
  verifiedAssetsOnly?: boolean;
};

const priorityOrder: string[] = ["ETH", "USDC", "USDT", "FUEL"];
const lowPriorityOrder: string[] = ["DUCKY"];

const assetIdRegex = /^0x[0-9a-fA-F]{64}$/;

const CoinsListModal = ({selectCoin, verifiedAssetsOnly, balances}: Props) => {
  // const {balances} = useBalances();
  const {assets, isLoading} = useAssetList();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const {verifiedAssetData, isLoading: isVerifiedAssetsLoading} =
    useVerifiedAssets();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const filterByVerification = (
    coin: CoinDataWithPrice,
    verifiedAssetsOnly?: boolean,
  ) => {
    return !verifiedAssetsOnly || coin.isVerified;
  };

  const filterBySearchValue = (coin: CoinDataWithPrice, value: string) => {
    const lowerCaseValue = value.toLowerCase();
    return (
      coin.name?.toLowerCase().includes(lowerCaseValue) ||
      coin.symbol?.toLowerCase().includes(lowerCaseValue) ||
      coin.assetId?.toLowerCase() === lowerCaseValue ||
      coin.l1Address?.toLowerCase() === lowerCaseValue
    );
  };

  // TODO: Pre-sort the list by priorityOrder and alphabet to avoid sorting each time and optimise this filtering
  const sortedCoinsList = useMemo(() => {
    if (!assets?.length) return [];
    return assets
      .toSorted((firstAsset, secondAsset) => {
        const firstAssetPriority = priorityOrder.indexOf(firstAsset.symbol!);
        const secondAssetPriority = priorityOrder.indexOf(secondAsset.symbol!);
        const bothAssetsHavePriority =
          firstAssetPriority !== -1 && secondAssetPriority !== -1;
        const eitherAssetHasPriority =
          firstAssetPriority !== -1 || secondAssetPriority !== -1;

        if (bothAssetsHavePriority) {
          return firstAssetPriority - secondAssetPriority;
        } else if (eitherAssetHasPriority) {
          return firstAssetPriority !== -1 ? -1 : 1;
        }

        const firstAssetLowPriority = lowPriorityOrder.indexOf(
          firstAsset.name!,
        );
        const secondAssetLowPriority = lowPriorityOrder.indexOf(
          secondAsset.name!,
        );
        const bothAssetsHaveLowPriority =
          firstAssetLowPriority !== -1 && secondAssetLowPriority !== -1;
        const eitherAssetHasLowPriority =
          firstAssetLowPriority !== -1 || secondAssetLowPriority !== -1;

        if (bothAssetsHaveLowPriority) {
          return firstAssetLowPriority - secondAssetLowPriority;
        } else if (eitherAssetHasLowPriority) {
          return firstAssetLowPriority !== -1 ? 1 : -1;
        }

        if (balances) {
          const firstAssetBalance =
            balances.find((b) => b.assetId === firstAsset.assetId)?.amount ??
            new BN(0);
          const secondAssetBalance =
            balances.find((b) => b.assetId === secondAsset.assetId)?.amount ??
            new BN(0);
          const firstAssetDivisor = new BN(10).pow(firstAsset.decimals);
          const secondAssetDivisor = new BN(10).pow(secondAsset.decimals);
          // Dividing BN to a large value can lead to zero, we use proportion rule here: a/b = c/d => a*d = b*c
          const firstAssetBalanceMultiplied =
            firstAssetBalance.mul(secondAssetDivisor);
          const secondAssetBalanceMultiplied =
            secondAssetBalance.mul(firstAssetDivisor);

          if (!firstAssetBalanceMultiplied.eq(secondAssetBalanceMultiplied)) {
            return firstAssetBalanceMultiplied.gt(secondAssetBalanceMultiplied)
              ? -1
              : 1;
          }
        }

        if (firstAsset.name && secondAsset.name) {
          return firstAsset.name.localeCompare(secondAsset.name);
        }

        return 0;
      })
      .reduce<(CoinDataWithPrice & {userBalance: CoinQuantity | undefined})[]>(
        (acc, eachAsset) => {
          const coinBalance = balances?.find(
            (balance) => balance.assetId === eachAsset.assetId,
          );

          const isVerified =
            verifiedAssetData &&
            checkIfCoinVerified({
              symbol: eachAsset.symbol,
              assetId: eachAsset.assetId,
              verifiedAssetData,
            });

          const updatedAsset = {
            ...eachAsset,
            isVerified,
            userBalance: coinBalance,
          };

          if (
            filterByVerification(updatedAsset, verifiedAssetsOnly) &&
            filterBySearchValue(updatedAsset, value)
          ) {
            acc.push(updatedAsset);
          }

          return acc;
        },
        [],
      );
  }, [assets, balances, value, verifiedAssetData, verifiedAssetsOnly]);

  return (
    <>
      <div className={styles.tokenSearch}>
        <SearchIcon />
        <input
          className={styles.tokenSearchInput}
          type="text"
          placeholder="Search by token or paste address"
          onChange={handleChange}
          ref={inputRef}
        />
      </div>
      <SkeletonLoader
        isLoading={isLoading || isVerifiedAssetsLoading}
        count={8}
        textLines={2}
      >
        <div className={styles.tokenList}>
          {!sortedCoinsList?.length && !!value && (
            <>
              {assetIdRegex.test(value) ? (
                <UnknownCoinListItem
                  assetId={value}
                  balance={balances?.find((b) => b.assetId === value)}
                  onClick={() => selectCoin(value)}
                />
              ) : (
                <EmptySearchResults value={value} />
              )}
            </>
          )}
          {sortedCoinsList.map((asset) => (
            <div
              className={styles.tokenListItem}
              onClick={() => selectCoin(asset.assetId)}
              key={asset.assetId}
            >
              <CoinListItem assetData={asset} />
            </div>
          ))}
        </div>
      </SkeletonLoader>
    </>
  );
};

export default memo(CoinsListModal);

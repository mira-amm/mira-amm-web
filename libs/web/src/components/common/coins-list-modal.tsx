"use client";

import {useEffect, useMemo, useCallback, useRef} from "react";
import {SearchIcon} from "@/meshwave-ui/icons";
import useCoinListModalData from "@/src/hooks/useCoinListModal";
import {CoinQuantity} from "fuels";
import {SkeletonLoader, CoinListItem} from "@/web/src/components/common";
import {UnknownCoinListItem} from "@/web/src/components/common/Swap/components/UnknownCoinListItem";

const assetIdRegex = /^0x[0-9a-fA-F]{64}$/;

export function CoinsListModal({
  selectCoin,
  verifiedAssetsOnly,
  balances,
}: {
  balances: CoinQuantity[] | undefined;
  selectCoin: (assetId: string | null) => void;
  verifiedAssetsOnly?: boolean;
}) {
  const {allCoins, handleFilterChange, isLoading, searchValue} =
    useCoinListModalData(balances, verifiedAssetsOnly);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isValidAssetId = assetIdRegex.test(searchValue);
  const showEmptySearch = !!searchValue && allCoins.length === 0;

  const matchingBalance = useMemo(() => {
    if (!isValidAssetId || !balances) return undefined;
    return balances.find((b) => b.assetId === searchValue);
  }, [searchValue, balances, isValidAssetId]);

  const handleSelect = useCallback(
    (assetId: string) => () => selectCoin(assetId),
    [selectCoin],
  );

  return (
    <>
      <div className="flex gap-[10px] p-[14px_12px] rounded-lg text-content-grey bg-background-grey-dark">
        <SearchIcon />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by token or paste address"
          onChange={handleFilterChange}
          className="flex-1 bg-transparent border-none text-content-primary text-base outline-none"
        />
      </div>

      <SkeletonLoader isLoading={isLoading} count={8} textLines={2}>
        <div>
          {showEmptySearch &&
            (isValidAssetId ? (
              <UnknownCoinListItem
                assetId={searchValue}
                balance={matchingBalance}
                onClick={() => selectCoin(searchValue)}
              />
            ) : (
              <EmptySearchResults value={searchValue} />
            ))}

          {allCoins.map((asset) => (
            <div
              key={asset.assetId}
              onClick={handleSelect(asset.assetId)}
              className="p-2 px-4 rounded-lg hover:bg-background-grey-dark cursor-pointer"
            >
              <CoinListItem assetData={asset} />
            </div>
          ))}
        </div>
      </SkeletonLoader>
    </>
  );
}

function EmptySearchResults({value}: {value: string}) {
  return (
    <div className="px-4 py-2 text-content-dimmed-light">
      {value && (
        <span>
          No results found for{" "}
          <span className="text-content-primary">"{value}"</span>
        </span>
      )}
    </div>
  );
}

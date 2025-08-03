"use client";

import {useEffect, useState} from "react";
import {useIsConnected} from "@fuels/react";

import Link from "next/link";

import {Button} from "@/meshwave-ui/Button";
import clsx from "clsx";

import {ResponsivePools as MobilePools} from "@/src/components/pages/liquidity-page/components/Pools/ResponsivePools";
import {DesktopPools} from "@/src/components/pages/liquidity-page/components/Pools/DesktopPools/DesktopPools";
import {SearchBar} from "@/src/components/common";
import Pagination from "@/src/components/common/Pagination/Pagination";
import {DEFAULT_PAGE} from "@/src/hooks/usePoolsData";
import {useDebounce, usePoolsData} from "@/src/hooks";
import {LoaderCircle} from "lucide-react";
import {getIsRebrandEnabled} from "@/src/utils/isRebrandEnabled";
import LoaderBar from "@/src/components/common/loader-bar";

export function Pools() {
  const {isConnected} = useIsConnected();
  const {data, isLoading, moreInfo} = usePoolsData();

  const {
    totalCount,
    totalPages,
    queryVariables: {search, page, orderBy},
    setQueryVariables,
  } = moreInfo;

  const [searchInput, setSearchInput] = useState(search || "");
  const debouncedSearchTerm = useDebounce(searchInput, 300);

  useEffect(() => {
    setQueryVariables({page: page || DEFAULT_PAGE});
  }, [page, setQueryVariables]);

  useEffect(() => {
    if (search !== debouncedSearchTerm) {
      setQueryVariables({search: debouncedSearchTerm, page: DEFAULT_PAGE});
    }
  }, [debouncedSearchTerm, setQueryVariables, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSort = (key: string) => {
    setQueryVariables(() => {
      const [prevKey, prevDirection] = orderBy.split("_");
      const newDirection =
        prevKey === key && prevDirection === "ASC" ? "DESC" : "ASC";
      return {orderBy: `${key}_${newDirection}`};
    });
  };

  const handlePageChange = (page: number) => setQueryVariables({page: page});

  const isRebrandingEnabled = getIsRebrandEnabled();

  return (
    <section className="flex flex-col gap-[14px]">
      {/* Mobile: Title and Button same line, search bar below full width*/}
      {/* Desktop: Title and search bar same line space between mobile search bar hidden*/}

      <div className="flex flex-col md:flex-row justify-between items-center gap-5">
        <div className="flex flex-row justify-between items-center w-full">
          <p className="text-xl leading-[24px] self-start">All Pools</p>
          <div className="flex justify-end md:hidden">
            {isConnected && (
              <Link href="/liquidity/create-pool">
                <Button className="mobileOnly w-[177px]">Create Pool</Button>
              </Link>
            )}
          </div>
        </div>
        <SearchBar
          className="w-full md:w-auto"
          placeholder="Search"
          value={searchInput}
          onChange={handleSearchChange}
        />
      </div>

      <MobilePools
        className="md:hidden"
        poolsData={data}
        orderBy={orderBy}
        handleSort={handleSort}
      />
      <DesktopPools
        className="hidden md:block"
        poolsData={data}
        orderBy={orderBy}
        handleSort={handleSort}
      />

      {isLoading && (
        <div className="flex flex-col items-center gap-4 py-7 px-4 lg:p-8 rounded-ten bg-background-grey-dark">
          {isRebrandingEnabled ? (
            <LoaderBar />
          ) : (
            <LoaderCircle className="animate-spin size-7" />
          )}
          <p>Loading pools...</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="flex justify-center items-center lg:justify-between lg:items-center">
          <p
            className={clsx("desktopOnly", "text-sm", "text-content-tertiary")}
          >
            Showing {data.length} out of {totalCount} pools...
          </p>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </section>
  );
}

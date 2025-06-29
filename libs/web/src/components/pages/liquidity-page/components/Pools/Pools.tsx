"use client";

import {useEffect, useState} from "react";

import {MobilePools} from "@/src/components/pages/liquidity-page/components/Pools/MobilePools/MobilePools";
import {DesktopPools} from "@/src/components/pages/liquidity-page/components/Pools/DesktopPools/DesktopPools";
import Link from "next/link";
import LoaderV2 from "@/src/components/common/LoaderV2/LoaderV2";
import {SearchBar} from "@/src/components/common";
import Pagination from "@/src/components/common/Pagination/Pagination";
import usePoolsData, {DEFAULT_PAGE} from "@/src/hooks/usePoolsData";
import useDebounce from "@/src/hooks/useDebounce";
import {Button} from "@/meshwave-ui/Button";

import clsx from "clsx";
import { LoaderCircle } from "lucide-react";

export function Pools() {
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

  return (
    <section className="flex flex-col gap-[14px]">
      <div className="flex justify-end">
        <Link href="/liquidity/create-pool">
          <Button className="mobileOnly">Create Pool</Button>
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-[20px] leading-[24px]">All Pools</p>
        <SearchBar
          placeholder="Symbol or address..."
          className=""
          value={searchInput}
          onChange={handleSearchChange}
        />
      </div>

      <MobilePools poolsData={data} orderBy={orderBy} handleSort={handleSort} />
      <DesktopPools
        poolsData={data}
        orderBy={orderBy}
        handleSort={handleSort}
      />

      {isLoading && (
        <div className="flex flex-col items-center gap-4 py-7 px-4 lg:p-8 rounded-2xl bg-background-grey-dark">
          <LoaderCircle className="animate-spin size-7" />
          <p>Loading pools...</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="flex justify-center items-center lg:justify-between lg:items-center">
          <p className={clsx("desktopOnly", "text-sm")}>
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

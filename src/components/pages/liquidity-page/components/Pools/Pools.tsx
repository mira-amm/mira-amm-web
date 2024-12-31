import {useCallback, useEffect, useState} from "react";
import {useRouter} from "next/navigation";

import MobilePools from "@/src/components/pages/liquidity-page/components/Pools/MobilePools/MobilePools";
import DesktopPools from "@/src/components/pages/liquidity-page/components/Pools/DesktopPools/DesktopPools";
import LoaderV2 from "@/src/components/common/LoaderV2/LoaderV2";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import Pagination from "@/src/components/common/Pagination/Pagination";
import {SearchBar} from "@/src/components/common/SearchBar/SearchBar";
import usePoolsData, {DEFAULT_PAGE} from "@/src/hooks/usePoolsData";
import {useDebounce} from "@/src/hooks/useDebounce";

import clsx from "clsx";
import styles from "./Pools.module.css";

const Pools = () => {
  const router = useRouter();
  const {data, isLoading, moreInfo} = usePoolsData();

  const {
    totalCount,
    totalPages,
    queryVariables: {search, page, orderBy},
    setQueryVariables,
  } = moreInfo;

  const [searchInput, setSearchInput] = useState(search || "");
  const debouncedSearchTerm = useDebounce(searchInput, 300);

  // Navigate to "Create Pool" page
  const handleCreatePoolClick = useCallback(() => {
    router.push("/liquidity/create-pool");
  }, [router]);

  // Update search query when debounced value changes
  useEffect(() => {
    setQueryVariables({search: debouncedSearchTerm, page: DEFAULT_PAGE});
    // reset page when search text changes
  }, [debouncedSearchTerm, setQueryVariables]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Handle sorting by toggling ASC/DESC
  const handleSort = (key: string) => {
    setQueryVariables(() => {
      const [prevKey, prevDirection] = orderBy.split("_");
      const newDirection =
        prevKey === key && prevDirection === "ASC" ? "DESC" : "ASC";
      return {orderBy: `${key}_${newDirection}`};
    });
  };

  // Render pagination
  const handlePageChange = (page: number) => setQueryVariables({page: page});

  return (
    <section className={styles.pools}>
      {/* Action Button */}
      <div className={styles.actionButtonDiv}>
        <ActionButton
          className={clsx("mobileOnly", styles.createButton)}
          onClick={handleCreatePoolClick}
        >
          Create Pool
        </ActionButton>
      </div>

      {/* Header with Search Bar */}
      <div className={styles.poolsHeader}>
        <p className={styles.poolsTitle}>All Pools</p>
        <SearchBar
          placeholder="Symbol or address..."
          className={styles.poolsSearchBar}
          value={searchInput}
          onChange={handleSearchChange}
        />
      </div>

      {/* Pools List (Mobile and Desktop) */}
      <MobilePools poolsData={data} orderBy={orderBy} handleSort={handleSort} />
      <DesktopPools
        poolsData={data}
        orderBy={orderBy}
        handleSort={handleSort}
      />

      {/* Loading State */}
      {isLoading && (
        <div className={styles.loadingFallback}>
          <LoaderV2 />
          <p>Loading pools...</p>
        </div>
      )}

      {/* Pagination */}
      {data && data.length > 0 && (
        <div className={styles.pagination}>
          <p className={clsx("desktopOnly")}>
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
};

export default Pools;

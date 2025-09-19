import {usePoolsData as useIndexerPoolsData} from "@/indexer";
import {CoinName} from "@/src/utils/coinsConfig";
import {
  NumberParam,
  StringParam,
  useQueryParams,
  withDefault,
} from "use-query-params";

export type PoolData = {
  id: string;
  reserve_0: string;
  reserve_1: string;
  details: {
    asset0Id: string;
    asset1Id: string;
    asset_0_symbol: CoinName;
    asset_1_symbol: CoinName;
    apr: number | null;
    volume: string;
    tvl: number;
  };
  swap_count: number;
  create_time: number;
  // New field for pool type
  poolType?: "v1-volatile" | "v1-stable" | "v2-concentrated";
};

export type MoreInfo = {
  totalCount: number;
  totalPages: number;
  page: number;
  setPage: (page: number) => void;
  orderBy: string;
  setOrderBy: (orderBy: string) => void;
  search: string;
  setSearch: (search: string) => void;
};

export type PoolsData = {
  pools: PoolData[];
};

const ITEMS_IN_PAGE = 10;
const DEFAULT_ORDER_BY = "tvlUSD_DESC";
const DEFAULT_SEARCH = "";
export const DEFAULT_PAGE = 1;

export function usePoolsData() {
  const [queryVariables, setQueryVariables] = useQueryParams({
    page: withDefault(NumberParam, DEFAULT_PAGE),
    search: withDefault(StringParam, DEFAULT_SEARCH),
    orderBy: withDefault(StringParam, DEFAULT_ORDER_BY),
  });

  const {page, search, orderBy} = queryVariables;

  // Use the indexer abstraction
  const {data, isLoading} = useIndexerPoolsData({
    limit: ITEMS_IN_PAGE,
    page,
    orderBy,
    search,
  });

  const totalPages = Math.ceil((data?.totalCount || 0) / ITEMS_IN_PAGE);

  // Transform the data to match the expected format
  const dataTransformed = data?.pools.map((pool): PoolData => {
    // Calculate APR if we have snapshot data
    const apr = 15.5; // TODO: Calculate from actual snapshot data when available

    return {
      id: pool.id,
      reserve_0: "1000000", // TODO: Get actual reserves from pool data
      reserve_1: "2000000", // TODO: Get actual reserves from pool data
      details: {
        asset0Id: pool.asset0Id,
        asset1Id: pool.asset1Id,
        asset_0_symbol: (pool.asset0?.symbol || "UNKNOWN") as CoinName,
        asset_1_symbol: (pool.asset1?.symbol || "UNKNOWN") as CoinName,
        apr,
        volume: pool.volumeUSD || "0",
        tvl: parseFloat(pool.tvlUSD || "0"),
      },
      swap_count: 0,
      create_time: pool.creationTime || 0,
      poolType: pool.poolType || "v1-volatile",
    };
  });

  return {
    data: dataTransformed,
    isLoading,
    moreInfo: {
      totalCount: data?.totalCount || 0,
      totalPages,
      setQueryVariables,
      queryVariables,
    },
  };
}

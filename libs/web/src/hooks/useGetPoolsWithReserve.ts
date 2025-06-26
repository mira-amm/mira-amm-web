import {useQuery} from "@tanstack/react-query";
import {fetchPoolsWithReserve, type Pool} from "./get-pools-with-reserve";
import type {CoinData} from "../utils/coinsConfig";
import type {PoolId} from "mira-dex-ts";

export type Route = {
  pools: Pool[];
  assetIn: CoinData;
  assetOut: CoinData;
};

export function useGetPoolsWithReserve(
  poolKeys: Array<[CoinData, CoinData, PoolId, boolean]>,
  assetIn?: CoinData,
  assetOut?: CoinData,
  shouldFetchPools = false,
) {
  const stringifiedKeys = poolKeys.map(
    ([a, b, poolId, stable]) => `${poolId.join("-")}-${stable}`,
  );

  const query = useQuery<Pool[], Error>({
    queryKey: [
      "pools-with-reserve",
      stringifiedKeys,
      assetIn?.assetId,
      assetOut?.assetId,
    ],
    queryFn: () => fetchPoolsWithReserve(poolKeys),
    enabled: shouldFetchPools,
    refetchInterval: 10_000,
    staleTime: 0,
  });

  return {
    pools: query.data ?? ([] as Pool[]),
    isLoading: query.isLoading,
    isRefetching: query.isFetching,
    refetch: query.refetch,
  };
}

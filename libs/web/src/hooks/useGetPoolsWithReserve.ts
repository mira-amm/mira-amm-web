import {PoolId} from "mira-dex-ts";
import {CoinData} from "../utils/coinsConfig";
import {skipToken, useQueries} from "@tanstack/react-query";
import request, {gql} from "graphql-request";
import {SQDIndexerUrl} from "../utils/constants";
import {useMemo} from "react";

type PoolReserveData = {
  reserve0: string;
  reserve1: string;
};

export type Pool = {
  assetA: CoinData;
  assetB: CoinData;
  poolId: PoolId;
} & PoolReserveData;

export type Route = {
  pools: Pool[];
  assetIn: CoinData;
  assetOut: CoinData;
};

const chunk = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

export function useGetPoolsWithReserve(
  poolKeys: [CoinData, CoinData, PoolId, boolean][],
  assetIn?: CoinData,
  assetOut?: CoinData,
  shouldFetchPools: boolean = false,
) {
  const chunkedKeys = useMemo(() => chunk(poolKeys, 10), [poolKeys]);

  const queries = useMemo(() => {
    if (!shouldFetchPools || !chunkedKeys.length) return [];

    return chunkedKeys.map((keysChunk, chunkIndex) => {
      const queryAliasMap = keysChunk.map(([, , [assetA, assetB], stable], idx) => {
        const alias = String.fromCharCode(97 + idx); // 'a', 'b', ...
        const poolId = `${assetA.bits}-${assetB.bits}-${stable}`;
        return {alias, poolId, stable};
      });

      const poolQueries = queryAliasMap
        .map(({alias, poolId}) => {
          return `${alias}: poolById(id: "${poolId}") {
            ...PoolFragment
          }`;
        })
        .join("\n");

      const gqlQuery = gql`
        query MultiPoolReserve {
          ${poolQueries}
        }

        fragment PoolFragment on Pool {
          reserve0
          reserve1
        }
      `;

      return {
        queryKey: [
          "pools-reserve-chunk",
          chunkIndex,
          assetIn?.assetId,
          assetOut?.assetId,
        ],
        queryFn: () =>
          request({
            url: SQDIndexerUrl,
            document: gqlQuery,
          }) as Promise<Record<string, PoolReserveData | null>>,
        enabled: shouldFetchPools,
        refetchInterval: 10_000,
      };
    });
  }, [chunkedKeys, shouldFetchPools, assetIn?.assetId, assetOut?.assetId]);

  const results = useQueries({queries});

  const isLoading = results.some((r) => r.isLoading);
  const isRefetching = results.some((r) => r.isRefetching);

  const combinedData: Record<string, PoolReserveData | null> = useMemo(() => {
    return results.reduce((acc, res) => {
      if (res.data) {
        Object.assign(acc, res.data);
      }
      return acc;
    }, {} as Record<string, PoolReserveData | null>);
  }, [results]);

  const poolsWithReserve = useMemo(() => {
    if (!combinedData || !poolKeys.length) return [];

    return poolKeys.reduce<Pool[]>((pools, [assetA, assetB, poolId], idx) => {
      const alias = String.fromCharCode(97 + (idx % 10));
      const data = combinedData[alias];
      return data
        ? pools.concat({
            assetA,
            assetB,
            poolId,
            ...data,
          })
        : pools;
    }, []);
  }, [poolKeys, combinedData]);

  return {
    pools: poolsWithReserve,
    isLoading,
    isRefetching,
    refetch: () => results.forEach((r) => r.refetch?.()),
  };
}

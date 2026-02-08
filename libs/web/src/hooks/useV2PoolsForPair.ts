"use client";

import {useQuery} from "@tanstack/react-query";
import {gql} from "graphql-request";
import {bn} from "fuels";
import request from "graphql-request";
import {SQDIndexerUrl} from "@/src/utils/constants";
import type {CoinData} from "../utils/coinsConfig";

export interface V2PoolInfo {
  id: string; // Numeric string ID from indexer (it's called 'id' not 'poolId')
  asset0: {
    id: string;
    symbol: string;
  };
  asset1: {
    id: string;
    symbol: string;
  };
  reserve0: string;
  reserve1: string;
  binStepBps: number;
}

/**
 * Queries the indexer for V2 concentrated liquidity pools
 * that involve the specified assets
 */
export function useV2PoolsForPair(
  assetIn?: CoinData,
  assetOut?: CoinData,
  shouldFetch = false
) {
  const query = gql`
    query V2Pools($asset0: String, $asset1: String) {
      pools(
        where: {
          AND: [
            {protocolVersion_eq: 2}
            {
              OR: [
                {AND: [{asset0: {id_eq: $asset0}}, {asset1: {id_eq: $asset1}}]}
                {AND: [{asset0: {id_eq: $asset1}}, {asset1: {id_eq: $asset0}}]}
              ]
            }
          ]
        }
      ) {
        id
        asset0 {
          id
          symbol
        }
        asset1 {
          id
          symbol
        }
        reserve0
        reserve1
        binStepBps
      }
    }
  `;

  const {data, isLoading, error} = useQuery({
    queryKey: ["v2-pools", assetIn?.assetId, assetOut?.assetId],
    queryFn: async () => {
      if (!assetIn || !assetOut) return [];

      try {
        const result = await request<{pools: V2PoolInfo[]}>({
          url: SQDIndexerUrl,
          document: query,
          variables: {
            asset0: assetIn.assetId,
            asset1: assetOut.assetId,
          },
        });

        if (!result.pools || result.pools.length === 0) {
          console.warn(
            `[useV2PoolsForPair] No V2 pools found for ${assetIn.symbol}/${assetOut.symbol}`
          );
        }

        return result.pools || [];
      } catch (err) {
        // 400 errors indicate schema mismatch (e.g., indexer doesn't support V2 fields yet)
        const is400 = err instanceof Error && err.message.includes("Code: 400");
        if (!is400) {
          console.error("[useV2PoolsForPair] Error fetching V2 pools:", err);
        }
        throw err;
      }
    },
    enabled: shouldFetch && !!assetIn && !!assetOut,
    staleTime: 10_000, // 10 seconds
    retry: (failureCount, err) => {
      // Don't retry 400 errors (schema mismatch)
      if (err instanceof Error && err.message.includes("Code: 400")) {
        return false;
      }
      return failureCount < 1;
    },
  });

  return {
    pools: data || [],
    isLoading,
    error,
  };
}

"use client";

import {useQuery} from "@tanstack/react-query";
import {gql} from "graphql-request";
import {bn} from "fuels";
import request from "graphql-request";
import {SQDIndexerUrl} from "@/src/utils/constants";
import type {CoinData} from "../utils/coinsConfig";

export interface V2PoolInfo {
  poolId: string; // Numeric string ID from indexer
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
  baseFactor: number;
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
          OR: [
            {AND: [{asset0: {id_eq: $asset0}}, {asset1: {id_eq: $asset1}}]}
            {AND: [{asset0: {id_eq: $asset1}}, {asset1: {id_eq: $asset0}}]}
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
        baseFactor
      }
    }
  `;

  const {data, isLoading, error} = useQuery({
    queryKey: ["v2-pools", assetIn?.assetId, assetOut?.assetId],
    queryFn: async () => {
      if (!assetIn || !assetOut) return [];

      const result = await request<{pools: V2PoolInfo[]}>({
        url: SQDIndexerUrl,
        document: query,
        variables: {
          asset0: assetIn.assetId,
          asset1: assetOut.assetId,
        },
      });

      return result.pools || [];
    },
    enabled: shouldFetch && !!assetIn && !!assetOut,
    staleTime: 10_000, // 10 seconds
  });

  return {
    pools: data || [],
    isLoading,
    error,
  };
}

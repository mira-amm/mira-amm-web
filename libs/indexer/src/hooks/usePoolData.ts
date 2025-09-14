"use client";

import {useQuery} from "@tanstack/react-query";
import {useIndexerData} from "./useIndexer";
import {PoolListParams, Pool, PoolWithReserves, PoolStats} from "../types";

export function usePoolData(poolId: string) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["pool", poolId],
    queryFn: () => indexer.pools.getById(poolId),
    enabled: !!poolId,
  });
}

export function usePoolsData(params?: PoolListParams) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["pools", params],
    queryFn: () => indexer.pools.list(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function usePoolsWithReserves(poolIds?: string[]) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["pools", "reserves", poolIds],
    queryFn: () => indexer.pools.getWithReserves(poolIds),
    enabled: !!poolIds && poolIds.length > 0,
    staleTime: 10 * 1000, // 10 seconds for more frequent updates
  });
}

export function usePoolAPR(poolId: string) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["pool", poolId, "apr"],
    queryFn: () => indexer.pools.getAPR(poolId),
    enabled: !!poolId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function usePoolStats(poolId: string) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["pool", poolId, "stats"],
    queryFn: () => indexer.pools.getStats(poolId),
    enabled: !!poolId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useUserPositions(userAddress: string) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["positions", userAddress],
    queryFn: () => indexer.pools.getUserPositions(userAddress),
    enabled: !!userAddress,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function usePoolReserves(poolId: string) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["pool", poolId, "reserves"],
    queryFn: () => indexer.pools.getReserves(poolId),
    enabled: !!poolId,
    staleTime: 5 * 1000, // 5 seconds for reserves
  });
}

export function usePoolSearch(searchQuery: string) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["pools", "search", searchQuery],
    queryFn: () => indexer.pools.search(searchQuery),
    enabled: !!searchQuery && searchQuery.length > 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}

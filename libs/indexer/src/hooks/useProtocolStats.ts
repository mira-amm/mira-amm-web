"use client";

import {useQuery} from "@tanstack/react-query";
import {useIndexerData} from "./useIndexer";
import {TimePeriod, HistoricalParams} from "../types";

export function useTVL() {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["protocol", "tvl"],
    queryFn: () => indexer.stats.getTVL(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useVolume(period: TimePeriod) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["protocol", "volume", period],
    queryFn: () => indexer.stats.getVolume(period),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useProtocolStats() {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["protocol", "stats"],
    queryFn: () => indexer.stats.getProtocolStats(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useHistoricalData(params: HistoricalParams) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["protocol", "historical", params],
    queryFn: () => indexer.stats.getHistoricalData(params),
    enabled: !!(params.from && params.to),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProtocolFees(period: TimePeriod) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["protocol", "fees", period],
    queryFn: () => indexer.stats.getFees(period),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function usePoolVolume(poolId: string, period: TimePeriod) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["pool", poolId, "volume", period],
    queryFn: () => indexer.stats.getPoolVolume(poolId, period),
    enabled: !!poolId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function usePoolTVL(poolId: string) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["pool", poolId, "tvl"],
    queryFn: () => indexer.stats.getPoolTVL(poolId),
    enabled: !!poolId,
    staleTime: 60 * 1000, // 1 minute
  });
}

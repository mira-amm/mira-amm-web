"use client";

import {useQuery} from "@tanstack/react-query";
import {useIndexerData} from "./useIndexer";
import {EventParams, Transaction, BlockInfo} from "../types";

export function useEventData(params: EventParams) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["events", params],
    queryFn: () => indexer.events.getEvents(params),
    enabled: !!(params.fromBlock || params.toBlock),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useWalletTransactions(address: string, limit?: number) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["transactions", address, limit],
    queryFn: () => indexer.events.getTransactions(address, limit),
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useLatestBlock() {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["block", "latest"],
    queryFn: () => indexer.events.getLatestBlock(),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
}

export function useBlockData(blockNumber: number) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["block", blockNumber],
    queryFn: () => indexer.events.getBlockByNumber(blockNumber),
    enabled: !!blockNumber,
    staleTime: 60 * 60 * 1000, // 1 hour (blocks don't change)
  });
}

export function useActions(fromBlock: number, toBlock: number) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["actions", fromBlock, toBlock],
    queryFn: () => indexer.events.getActions(fromBlock, toBlock),
    enabled: !!(fromBlock && toBlock && fromBlock < toBlock),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSwaps(poolId?: string, limit?: number) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["swaps", poolId, limit],
    queryFn: () => indexer.events.getSwaps(poolId, limit),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useLiquidityEvents(poolId?: string, limit?: number) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["liquidity-events", poolId, limit],
    queryFn: () => indexer.events.getLiquidityEvents(poolId, limit),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSquidStatus() {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["squid", "status"],
    queryFn: () => indexer.events.getSquidStatus(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

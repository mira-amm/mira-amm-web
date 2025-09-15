"use client";

import {useQuery} from "@tanstack/react-query";
import {useIndexerData} from "./useIndexer";
import {Asset, AssetPrice, AssetMetadata} from "../types";

export function useAssetData(assetId: string) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["asset", assetId],
    queryFn: () => indexer.assets.getById(assetId),
    enabled: !!assetId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useAssetPrice(assetId: string) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["asset", assetId, "price"],
    queryFn: () => indexer.assets.getPrice(assetId),
    enabled: !!assetId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useAssetPrices(assetIds: string[]) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["assets", "prices", assetIds],
    queryFn: () => indexer.assets.getPrices(assetIds),
    enabled: assetIds.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useAssetList() {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["assets"],
    queryFn: () => indexer.assets.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAssetListWithPools() {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["assets", "withPools"],
    queryFn: () => indexer.assets.listWithPools(),
    staleTime: 3 * 60 * 60 * 1000, // 3 hours
    meta: {persist: true},
  });
}

export function useAssetMetadata(assetId: string) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["asset", assetId, "metadata"],
    queryFn: () => indexer.assets.getMetadata(assetId),
    enabled: !!assetId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAssetImage(assetId: string) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["asset", assetId, "image"],
    queryFn: () => indexer.assets.getImage(assetId),
    enabled: !!assetId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useAssetBatch(assetIds: string[]) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["assets", "batch", assetIds],
    queryFn: () => indexer.assets.getBatch(assetIds),
    enabled: assetIds.length > 0,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useAssetSearch(query: string) {
  const indexer = useIndexerData();

  return useQuery({
    queryKey: ["assets", "search", query],
    queryFn: () => indexer.assets.search(query),
    enabled: !!query && query.length > 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}

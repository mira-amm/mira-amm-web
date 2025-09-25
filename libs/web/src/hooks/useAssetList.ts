import { useAssetListWithPools } from "@/indexer";
import { CoinDataWithPrice, coinsConfig } from "../utils/coinsConfig";
import request, { gql } from "graphql-request";
import { SQDIndexerUrl } from "../utils/constants";
import { useQuery } from "@tanstack/react-query";
import { CoinDataWithPrice } from "../utils/coinsConfig";
import { useVerifiedAssets } from "./useVerifiedAssets";
import { checkIfCoinVerified } from "../utils/checkIfCoinVerified";

export const useAssetList = (): {
  assets?: CoinDataWithPrice[];
  isLoading: boolean;
} => {
  const { data, isLoading } = useAssetListWithPools();

  const transformedAssets = data?.map((asset): CoinDataWithPrice => {
    const config = coinsConfig.get(asset.id);

    return {
      assetId: asset.id,
      name: config?.name || asset.name,
      symbol: config?.symbol || asset.symbol,
      decimals: asset.decimals,
      icon: config?.icon || asset.image,
      l1Address: asset.l1Address || "",
      contractId: asset.contractId || "",
      subId: asset.subId || "",
      price: parseFloat(asset.price || "0"),
      isVerified: config?.isVerified || false,
    };
  });

  return { assets: transformedAssets, isLoading };
};

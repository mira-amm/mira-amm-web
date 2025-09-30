import request, {gql} from "graphql-request";
import {SQDIndexerUrl} from "../utils/constants";
import {useQuery} from "@tanstack/react-query";
import {CoinDataWithPrice, coinsConfig} from "../utils/coinsConfig";
import {useVerifiedAssetsForChain} from "./useVerifiedAssetsForChain";
import {useMemo} from "react";

type Assets = {
  image: string;
  name: string;
  symbol: string;
  id: string;
  decimals: number;
  numPools: string | number;
  l1Address: string;
  price: number;
  contractId: string;
  subId: string;
}[];

export const useAssetList = (): {
  assets?: CoinDataWithPrice[];
  isLoading: boolean;
} => {
  const {verifiedAssetsForChain, isLoading: isVerifiedAssetsLoading} =
    useVerifiedAssetsForChain();

  const {data, isLoading} = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const query = gql`
        query MyQuery {
          assets(where: {numPools_gt: 0}) {
            image
            name
            symbol
            id
            decimals
            numPools
            l1Address
            price
            contractId
            subId
          }
        }
      `;

      const results = await request<{assets: Assets}>({
        url: SQDIndexerUrl,
        document: query,
      });

      const assets = results.assets.map((asset): CoinDataWithPrice => {
        const config = coinsConfig.get(asset.id);

        return {
          assetId: asset.id,
          name: config?.name || asset.name,
          symbol: config?.symbol || asset.symbol,
          decimals: asset.decimals,
          icon: config?.icon || asset.image,
          l1Address: asset.l1Address,
          contractId: asset.contractId,
          subId: asset.subId,
          price: asset.price,
          isVerified: config?.isVerified || false,
        };
      });

      return assets;
    },
    staleTime: 3 * 60 * 60 * 1000, // 3 hours
    meta: {persist: true},
  });

  // Merge assets from API with verified assets for current chain
  const mergedAssets = useMemo(() => {
    // If we don't have API data yet, return undefined (loading state)
    if (!data) {
      return undefined;
    }

    // If verified assets are still loading, just return API data for now
    if (isVerifiedAssetsLoading) {
      return data;
    }
    const assetMap = new Map<string, CoinDataWithPrice>();

    // First, add all assets from the API
    data.forEach((asset) => {
      assetMap.set(asset.assetId, asset);
    });

    // Then, overlay verified assets for the current chain
    verifiedAssetsForChain.forEach((verifiedAsset) => {
      const existingAsset = assetMap.get(verifiedAsset.assetId);

      if (existingAsset) {
        // Update existing asset with verified data
        assetMap.set(verifiedAsset.assetId, {
          ...existingAsset,
          name: verifiedAsset.name,
          symbol: verifiedAsset.symbol,
          icon: verifiedAsset.icon || existingAsset.icon,
          isVerified: true,
          contractId: verifiedAsset.contractId || existingAsset.contractId,
          subId: verifiedAsset.subId || existingAsset.subId,
          l1Address: verifiedAsset.l1Address || existingAsset.l1Address,
        });
      } else {
        // Add new verified asset (with price 0 if not in API)
        assetMap.set(verifiedAsset.assetId, {
          ...verifiedAsset,
          price: 0,
        });
      }
    });

    return Array.from(assetMap.values());
  }, [data, verifiedAssetsForChain, isVerifiedAssetsLoading]);

  return {
    assets: mergedAssets,
    isLoading: isLoading || isVerifiedAssetsLoading,
  };
};

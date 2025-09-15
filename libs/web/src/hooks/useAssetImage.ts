import {skipToken, useQuery} from "@tanstack/react-query";
import request, {gql} from "graphql-request";
import {SQDIndexerUrl} from "../utils/constants";
import defaultImage from "@/assets/unknown-asset.svg";
import {useAssetList} from "./useAssetList";
import {useAssetImage as useIndexerAssetImage} from "@/indexer";

export interface AssetImageData {
  l1Address: string;
  image: string;
}
export type AssetImageMap = Record<string, AssetImageData>;

export const useAssetImage = (assetId: string | null): string => {
  const {assets, isLoading: isLoadingAsset} = useAssetList();
  const {data: indexerImageData} = useIndexerAssetImage(assetId || "");

  const {data, isLoading, error} = useQuery<string | null>({
    queryKey: ["assetImage", assetId, assets?.length],
    queryFn: async () => {
      const asset = assets?.find(
        (asset) => asset.assetId.toLowerCase() === assetId?.toLowerCase()
      );
      if (asset?.icon) {
        return asset.icon;
      }

      // Try indexer first
      if (indexerImageData) {
        return indexerImageData;
      }

      // TODO: get images from L1 address
      return null;
    },
    staleTime: 3 * 60 * 60 * 1000, // 3 hours
    enabled: assetId !== null && !isLoadingAsset && assets !== undefined,
    meta: {persist: true},
  });

  return data || (defaultImage as any).src;
};

const buildDynamicAssetQuery = (assetIds: string[]) => {
  const queries = assetIds
    .map((id, index) => {
      return `a${index}: assetById(id: $id${index}) {
        l1Address
        image
      }`;
    })
    .join("\n");

  const variables: Record<string, string> = {};
  assetIds.forEach((id, index) => {
    variables[`id${index}`] = id;
  });

  const query = gql`
    query AssetImages(${assetIds.map((_, i) => `$id${i}: String!`).join(", ")}) {
      ${queries}
    }
  `;

  return {query, variables};
};

export const useFetchMultiAssetImages = (assetIds: string[] | undefined) => {
  return useQuery<AssetImageMap>({
    queryKey: ["asset-images", assetIds?.join("-")],
    enabled: !!assetIds && assetIds.length > 0,
    queryFn: assetIds
      ? async () => {
          const {query, variables} = buildDynamicAssetQuery(assetIds);
          const results = await request<Record<string, AssetImageData>>({
            document: query,
            url: SQDIndexerUrl,
            variables,
          });

          const assetMap: AssetImageMap = {};
          assetIds.forEach((id, index) => {
            assetMap[id] = results[`a${index}`];
          });

          return assetMap;
        }
      : skipToken,
    meta: {persist: true},
  });
};

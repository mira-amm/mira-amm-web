import {useQuery} from "@tanstack/react-query";
import request, {gql} from "graphql-request";
import {SQDIndexerUrl} from "../utils/constants";
import defaultImage from "@/assets/unknown-asset.svg";
import {useAssetList} from "./useAssetList";

export const useAssetImage = (assetId: string | null): string => {
  const {assets} = useAssetList();
  const {data} = useQuery<string | null>({
    queryKey: ["assetImage", assetId],
    queryFn: async () => {
      const asset = assets.find(
        (asset) => asset.assetId.toLowerCase() === assetId?.toLowerCase(),
      );
      if (asset?.icon) {
        return asset.icon;
      }

      const query = gql`
        query MyQuery {
            assetById(id: "${assetId}"){
              l1Address
              image
            }
        }`;

      const results = await request<{assetById: any}>({
        document: query,
        url: SQDIndexerUrl,
      });

      if (results.assetById.image) {
        return results.assetById.image;
      }

      // TODO: get images from L1 address
      return null;
    },
    staleTime: Infinity,
    enabled: assetId !== null,
  });

  return data || defaultImage.src;
};

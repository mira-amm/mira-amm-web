import {useQuery} from "@tanstack/react-query";
import {coinsConfig} from "../utils/coinsConfig";
import request, {gql} from "graphql-request";
import defaultImage from "@/assets/unknown-asset.svg";
import useSQDIndexerUrl from "./network/useSQDIndexerUrl";

export const useAssetImage = (assetId: string | null): string | null => {
  const sqdIndexerUrl = useSQDIndexerUrl();

  const {data} = useQuery<string | null>({
    queryKey: ["assetImage", assetId, sqdIndexerUrl],
    queryFn: async () => {
      const configImg = coinsConfig.get(assetId);
      if (configImg?.icon) {
        return configImg?.icon;
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
        url: sqdIndexerUrl,
      });

      if (results.assetById.image) {
        return results.assetById.image;
      }

      // TODO: get images from L1 address
      return null;
    },
    enabled: assetId !== null,
    staleTime: Infinity,
  });

  return data || defaultImage.src;
};

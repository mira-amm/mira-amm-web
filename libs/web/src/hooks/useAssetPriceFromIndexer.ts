import {useQuery} from "@tanstack/react-query";
import request, {gql} from "graphql-request";
import {SQDIndexerUrl} from "../utils/constants";

export const useAssetPriceFromIndexer = (
  assetId: string
): {price: number; isLoading: boolean} => {
  const {data, isLoading} = useQuery<{asset: {price: string} | null}>({
    queryKey: ["price", assetId],
    queryFn: async () => {
      const query = gql`
        query AssetPrice($id: String!) {
          asset: assetById(id: $id) {
            price
          }
        }
      `;
      const response = await request<{asset: {price: string} | null}>({
        document: query,
        url: SQDIndexerUrl,
        variables: {id: assetId},
      });
      return response;
    },
  });

  const parsedPrice = data?.asset?.price ? parseFloat(data.asset.price) : 0;

  return {
    price: parsedPrice,
    isLoading,
  };
};

import {useQuery} from "@tanstack/react-query";
import request, {gql} from "graphql-request";
import {SQDIndexerUrl} from "../utils/constants";

export const useAssetPriceFromIndexer = (
  assetId: string,
): {price: number; isLoading: boolean} => {
  const {data, isLoading} = useQuery<{asset: {price: string} | null}>({
    queryKey: ["price", assetId],
    queryFn: async () => {
      const query = gql`
        query {
          asset: assetById(
            id: "${assetId}"
          ) {
            price
          }
        }
      `;
      const response = await request<{asset: {price: string} | null}>({
        document: query,
        url: SQDIndexerUrl,
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

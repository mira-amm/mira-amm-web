import {useQuery} from "@tanstack/react-query";
import request, {gql} from "graphql-request";
import useSQDIndexerUrl from "./useSQDIndexerUrl";

export const useFuelPrice = (): {price: number; isLoading: boolean} => {
  const sqdIndexerUrl = useSQDIndexerUrl();

  const {data, isLoading} = useQuery<{fuel: {price: string} | null}>({
    queryKey: ["fuelPrice"],
    queryFn: async () => {
      const query = gql`
        query {
          fuel: assetById(
            id: "0x1d5d97005e41cae2187a895fd8eab0506111e0e2f3331cd3912c15c24e3c1d82"
          ) {
            price
          }
        }
      `;
      const response = await request<{fuel: {price: string} | null}>({
        document: query,
        url: sqdIndexerUrl,
      });
      return response;
    },
  });

  const parsedPrice = data?.fuel?.price ? parseFloat(data.fuel.price) : 0;

  return {
    price: parsedPrice,
    isLoading,
  };
};

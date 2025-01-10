import {useQuery} from "@tanstack/react-query";
import request, {gql} from "graphql-request";
import {SQDIndexerUrl} from "../utils/constants";

export const useFuelPrice = (): string | null => {
  const {data} = useQuery<string | null>({
    queryKey: ["fuelPrice"],
    queryFn: async () => {
      const query = gql`
        query GetFuelPrice {
          fuel: assetById(
            id: "0x1d5d97005e41cae2187a895fd8eab0506111e0e2f3331cd3912c15c24e3c1d82"
          ) {
            price
          }
        }
      `;

      const results = await request<{fuel: {price: string}}>({
        document: query,
        url: SQDIndexerUrl,
      });

      return results.fuel?.price || null;
    },
  });

  return data ?? null;
};

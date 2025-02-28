import request, {gql} from "graphql-request";
import {useQuery} from "@tanstack/react-query";
import {CoinDataWithPrice, coinsConfig} from "../utils/coinsConfig";
import useSQDIndexerUrl from "./network/useSQDIndexerUrl";

export const useAssetList = (): {
  assets: CoinDataWithPrice[];
  isLoading: boolean;
} => {
  const sqdIndexerUrl = useSQDIndexerUrl();

  const {data, isLoading} = useQuery<any>({
    queryKey: ["assets", sqdIndexerUrl],
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

      const results = await request<{assets: any}>({
        url: sqdIndexerUrl,
        document: query,
      });

      return results.assets.map((asset: any): CoinDataWithPrice => {
        const config = coinsConfig.get(asset.id);

        return {
          assetId: asset.id,
          name: config?.name || asset.name,
          symbol: config?.name || asset.symbol,
          decimals: asset.decimals,
          icon: config?.icon || asset.image,
          l1Address: asset.l1Address,
          contractId: asset.contractId,
          subId: asset.subId,
          price: asset.price,
          isVerified: config?.isVerified || false,
        };
      });
    },
    staleTime: 5000,
  });

  return {assets: data ?? [], isLoading};
};

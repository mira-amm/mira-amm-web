import {useQuery} from "@tanstack/react-query";
import {CoinDataWithPrice} from "../utils/coinsConfig";
import {assetListQueryOptions} from "./queries/assetQueries";

export const useAssetList = (): {
  assets?: CoinDataWithPrice[];
  isLoading: boolean;
} => {
  const {data, isLoading} = useQuery(assetListQueryOptions);

  return {assets: data, isLoading};
};

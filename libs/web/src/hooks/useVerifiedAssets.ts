import {useQuery} from "@tanstack/react-query";
import {verifiedAssetsQueryOptions} from "./queries/assetQueries";

export const useVerifiedAssets = () => {
  const {data: verifiedAssetData, isLoading} = useQuery(
    verifiedAssetsQueryOptions
  );

  return {verifiedAssetData, isLoading};
};

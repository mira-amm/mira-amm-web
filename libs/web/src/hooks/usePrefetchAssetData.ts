import {useEffect} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {
  assetListQueryOptions,
  verifiedAssetsQueryOptions,
} from "./queries/assetQueries";

export const usePrefetchAssetData = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch asset list
    queryClient.prefetchQuery(assetListQueryOptions);

    // Prefetch verified assets
    queryClient.prefetchQuery(verifiedAssetsQueryOptions);
  }, [queryClient]);
};

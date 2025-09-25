import { useQuery } from "@tanstack/react-query";
import { VerifiedAssets } from "../utils/checkIfCoinVerified";

export const useVerifiedAssets = () => {
  const { data: verifiedAssetData, isLoading, error } = useQuery({
    queryKey: ["verifiedAssets"],
    queryFn: async () => {
      const response = await fetch("/api/verified-assets");
      if (!response.ok) {
        throw new Error(`Failed to fetch verified assets: ${response.statusText}`);
      }
      const assets = await response.json();
      return assets as VerifiedAssets;
    },
    staleTime: Infinity,
    meta: { persist: true },
    retry: (failureCount, error) => {
      // Retry up to 2 times, but log failures for debugging
      if (failureCount < 2) {
        console.warn(`Verified assets fetch failed (attempt ${failureCount + 1}):`, error);
        return true;
      }
      console.error("Failed to fetch verified assets from API:", error);
      return false;
    },
  });

  return { 
    verifiedAssetData, 
    isLoading, 
    error: error as Error | null 
  };
};

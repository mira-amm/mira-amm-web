import {useQuery, UseQueryResult} from "@tanstack/react-query";
import type {ProtocolStatsData} from "@/src/types/protocol-stats";

/**
 * Error type for protocol stats API failures
 */
export interface ProtocolStatsError {
  error: string;
  message: string;
}

/**
 * TanStack Query result type for protocol stats
 */
export interface UseProtocolStatsResult
  extends UseQueryResult<ProtocolStatsData, Error> {
  data: ProtocolStatsData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isFetching: boolean;
}

/**
 * Fetch protocol stats from the API endpoint
 */
async function fetchProtocolStats(): Promise<ProtocolStatsData> {
  const startTime = performance.now();

  try {
    const response = await fetch("/api/protocol-stats/");

    if (!response.ok) {
      const errorData: ProtocolStatsError = await response.json();
      throw new Error(errorData.message || "Failed to fetch protocol stats");
    }

    const data = await response.json();

    return data;
  } catch (error) {
    const errorTime = performance.now();
    console.error(
      `❌ Protocol stats fetch failed after ${(errorTime - startTime).toFixed(2)}ms:`,
      error
    );
    throw error;
  }
}

/**
 * TanStack Query hook for fetching protocol statistics
 *
 * Features:
 * - 5-minute stale time for efficient caching
 * - Background refetch when data becomes stale
 * - Retry logic with exponential backoff
 * - Proper error handling and loading states
 *
 * @returns UseProtocolStatsResult with data, loading, and error states
 */
export function useProtocolStats(): UseProtocolStatsResult {
  // Check if we're on the client side
  const isClient = typeof window !== "undefined";

  const queryResult = useQuery({
    queryKey: ["protocol-stats"],
    queryFn: fetchProtocolStats,
    staleTime: 5 * 60 * 1000, // 5 minutes (300 seconds)
    gcTime: 10 * 60 * 1000, // 10 minutes (600 seconds) - keep in cache longer
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce API calls
    retry: 1, // Retry failed requests up to 1 time
    retryDelay: 1000, // Simple 1 second delay for retries
    refetchOnMount: true, // Always refetch on component mount if data is stale
    refetchInterval: false, // Don't use polling, rely on stale time for background refetch
    enabled: isClient, // Only enable on client side to avoid SSR issues
  });

  return {
    ...queryResult,
    // Ensure consistent return types
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
    isFetching: queryResult.isFetching,
  };
}

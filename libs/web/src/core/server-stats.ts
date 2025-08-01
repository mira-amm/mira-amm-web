import type {ProtocolStatsData} from "../types/protocol-stats";

/**
 * Server-side protocol stats fetching via API route
 * Used for SSR and React Server Components
 */
export interface ServerStatsResult {
  data: ProtocolStatsData | null;
  error: string | null;
  isStale: boolean;
  lastUpdated: Date;
}

/**
 * Fetch protocol stats on the server via API route
 * This avoids GraphQL client issues in SSR and uses our caching API endpoint
 */
export async function fetchProtocolStatsSSR(): Promise<ServerStatsResult> {
  const startTime = Date.now();

  try {
    console.log("SSR: Fetching protocol stats via API route...");

    // Use the API route we created for consistent caching
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/protocol-stats`, {
      // Enable Next.js SSR caching
      next: {
        revalidate: 300, // 5 minutes
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const result = await response.json();
    const duration = Date.now() - startTime;

    console.log(`SSR: Protocol stats fetched successfully in ${duration}ms`);

    return {
      data: result.data,
      error: null,
      isStale: result.isStale || false,
      lastUpdated: new Date(result.lastUpdated),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error(
      `SSR: Failed to fetch protocol stats after ${duration}ms:`,
      error
    );

    // Return graceful error state
    return {
      data: null,
      error: errorMessage,
      isStale: true,
      lastUpdated: new Date(),
    };
  }
}

/**
 * Fetch protocol stats with fallback to default values
 * Ensures SSR never fails due to stats fetching issues
 */
export async function fetchProtocolStatsWithFallback(): Promise<{
  data: ProtocolStatsData;
  error: string | null;
  isStale: boolean;
  lastUpdated: Date;
}> {
  const result = await fetchProtocolStatsSSR();

  // If fetching failed, return default values to prevent SSR failure
  if (!result.data) {
    console.warn("SSR: Using fallback protocol stats due to fetch failure");

    return {
      data: {
        totalTVL: 0,
        allTimeVolume: 0,
        oneDayVolume: 0,
        sevenDayVolume: 0,
      },
      error: result.error,
      isStale: true,
      lastUpdated: result.lastUpdated,
    };
  }

  return {
    data: result.data,
    error: result.error,
    isStale: result.isStale,
    lastUpdated: result.lastUpdated,
  };
}

/**
 * Preload protocol stats for client-side hydration
 * This ensures smooth transition from SSR to client-side
 */
export function serializeStatsForHydration(result: ServerStatsResult): string {
  return JSON.stringify({
    ...result,
    lastUpdated: result.lastUpdated.toISOString(),
  });
}

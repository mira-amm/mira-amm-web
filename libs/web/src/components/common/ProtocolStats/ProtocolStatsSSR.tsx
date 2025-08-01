import {Suspense} from "react";
import {fetchProtocolStatsWithFallback} from "../../../core/server-stats";
import {StatCard} from "./StatCard";
import type {ProtocolStatsData} from "../../../types/protocol-stats";

/**
 * Server-Side Rendered Protocol Stats Component
 * Fetches data on the server and renders with proper fallbacks
 */
export async function ProtocolStatsSSR({className}: {className?: string}) {
  // Fetch protocol stats on the server
  const {data, error, isStale, lastUpdated} =
    await fetchProtocolStatsWithFallback();

  // If there's an error and no fallback data, show simple error state
  if (error && data.totalTVL === 0 && data.allTimeVolume === 0) {
    return (
      <div className={`w-full ${className || ""}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-content-primary">
            Protocol Statistics
          </h2>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-error-surface text-error-content text-xs font-medium">
              Error
            </span>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-content-secondary mb-2">
            Failed to load protocol statistics
          </p>
          <p className="text-sm text-content-tertiary">{error}</p>
        </div>
      </div>
    );
  }

  // Render the stats component with server-fetched data
  return (
    <ProtocolStats
      stats={data}
      lastUpdated={lastUpdated}
      isStale={isStale}
      className={className}
    />
  );
}

/**
 * Protocol Stats with Loading Fallback for Suspense
 * Wraps the SSR component with proper loading states
 */
export function ProtocolStatsWithSuspense({className}: {className?: string}) {
  return (
    <Suspense fallback={<ProtocolStatsLoading className={className} />}>
      <ProtocolStatsSSR className={className} />
    </Suspense>
  );
}

/**
 * Export for easy use in pages
 */
export default ProtocolStatsWithSuspense;

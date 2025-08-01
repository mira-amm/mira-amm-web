import React from "react";
import {StatCard} from "./StatCard";
import {cn} from "../../../utils/cn";
import type {ProtocolStatsProps} from "../../../types/protocol-stats";

/**
 * Main protocol statistics component with SSR support
 * Displays key metrics: All Time Volume, Total TVL, 1 Day Volume, 7 Day Volume
 */
export function ProtocolStats({
  stats,
  lastUpdated,
  isStale = false,
}: ProtocolStatsProps) {
  const formatLastUpdated = React.useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(lastUpdated);
  }, [lastUpdated]);

  return (
    <div className="w-full">
      {/* Header with title and last updated info */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-content-primary">
          Protocol Statistics
        </h2>
        <div className="flex items-center gap-2 text-sm text-content-secondary">
          {isStale && (
            <span className="px-2 py-1 rounded bg-warning-surface text-warning-content text-xs font-medium">
              Stale Data
            </span>
          )}
          <span>Last updated: {formatLastUpdated}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="All Time Volume"
          value={stats.allTimeVolume}
          formatAsCurrency={true}
          className="hover:scale-105 transition-transform duration-200"
        />
        <StatCard
          title="Total TVL"
          value={stats.totalTVL}
          formatAsCurrency={true}
          className="hover:scale-105 transition-transform duration-200"
        />
        <StatCard
          title="24H Volume"
          value={stats.oneDayVolume}
          formatAsCurrency={true}
          className="hover:scale-105 transition-transform duration-200"
        />
        <StatCard
          title="7D Volume"
          value={stats.sevenDayVolume}
          formatAsCurrency={true}
          className="hover:scale-105 transition-transform duration-200"
        />
      </div>
    </div>
  );
}

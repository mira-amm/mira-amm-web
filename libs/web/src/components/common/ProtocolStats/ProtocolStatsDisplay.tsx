import React from "react";
import {StatCard} from "./StatCard";
import {cn} from "../../../utils/cn";
import type {ProtocolStatsData} from "../../../types/protocol-stats";

/**
 * Props for the ProtocolStatsDisplay component
 */
export interface ProtocolStatsDisplayProps {
  stats?: ProtocolStatsData;
  className?: string;
  isLoading?: boolean;
}

/**
 * Pure presentation component for protocol statistics
 * Displays key metrics: All Time Volume, Total TVL, 1 Day Volume, 7 Day Volume
 * Can be used by both client-side and SSR components
 */
export function ProtocolStatsDisplay({
  stats,
  className,
  isLoading = false,
}: ProtocolStatsDisplayProps) {
  return (
    <div className={cn("w-full pb-8", className)}>
      {/* Stats row */}
      <div className="flex flex-col md:flex-row gap-8">
        <StatCard
          title="All time volume"
          value={stats?.allTimeVolume}
          formatAsCurrency={true}
          isLoading={isLoading}
        />
        <StatCard
          title="Total TVL"
          value={stats?.totalTVL}
          formatAsCurrency={true}
          isLoading={isLoading}
        />
        <StatCard
          title="1D Volume"
          value={stats?.oneDayVolume}
          formatAsCurrency={true}
          isLoading={isLoading}
        />
        <StatCard
          title="7D Volume"
          value={stats?.sevenDayVolume}
          formatAsCurrency={true}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

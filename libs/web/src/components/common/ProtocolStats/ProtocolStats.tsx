import React from "react";
import {StatCard} from "./StatCard";
import {cn} from "../../../utils/cn";
import type {ProtocolStatsProps} from "../../../types/protocol-stats";

/**
 * Main protocol statistics component with SSR support
 * Displays key metrics: All Time Volume, Total TVL, 1 Day Volume, 7 Day Volume
 */
export function ProtocolStats({stats}: ProtocolStatsProps) {
  return (
    <div className="w-full">
      {/* Stats row */}
      <div className="flex flex-col md:flex-row gap-8">
        <StatCard
          title="All time volume"
          value={stats.allTimeVolume}
          formatAsCurrency={true}
        />
        <StatCard
          title="Total TVL"
          value={stats.totalTVL}
          formatAsCurrency={true}
        />
        <StatCard
          title="1D Volume"
          value={stats.oneDayVolume}
          formatAsCurrency={true}
        />
        <StatCard
          title="7D Volume"
          value={stats.sevenDayVolume}
          formatAsCurrency={true}
        />
      </div>
    </div>
  );
}

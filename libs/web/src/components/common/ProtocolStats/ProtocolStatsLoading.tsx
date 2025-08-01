import React from "react";
import {cn} from "../../../utils/cn";

/**
 * Loading skeleton for protocol stats component
 * Matches the layout of the actual component for smooth transitions
 */
export function ProtocolStatsLoading({className}: {className?: string}) {
  return (
    <div className={cn("w-full animate-pulse", className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-48 bg-surface-secondary rounded"></div>
        <div className="h-4 w-32 bg-surface-secondary rounded"></div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({length: 4}).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual stat card skeleton
 */
function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg bg-surface-secondary border border-border-primary">
      {/* Title skeleton */}
      <div className="h-4 w-24 bg-surface-tertiary rounded"></div>
      {/* Value skeleton */}
      <div className="h-8 w-20 bg-surface-tertiary rounded"></div>
    </div>
  );
}

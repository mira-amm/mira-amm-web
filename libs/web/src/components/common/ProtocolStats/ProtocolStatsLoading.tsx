import React from "react";
import {cn} from "../../../utils/cn";

/**
 * Loading skeleton for protocol stats component
 * Shows actual titles with skeleton values for better UX
 */
export function ProtocolStatsLoading({className}: {className?: string}) {
  const stats = ["All time volume", "Total TVL", "1D Volume", "7D Volume"];

  return (
    <div className={cn("w-full", className)}>
      {/* Stats row */}
      <div className="flex flex-col md:flex-row gap-8">
        {stats.map((title, index) => (
          <StatCardSkeleton key={index} title={title} />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual stat card skeleton
 */
function StatCardSkeleton({title}: {title: string}) {
  return (
    <div className="flex flex-col gap-4 md:w-[206px]">
      {/* Actual title */}
      <h3 className="text-gray-500 font-medium text-[17.72px] leading-none">
        {title}
      </h3>
      {/* Value skeleton */}
      <div className="h-[25px] w-20 bg-gray-300 rounded animate-pulse"></div>
    </div>
  );
}

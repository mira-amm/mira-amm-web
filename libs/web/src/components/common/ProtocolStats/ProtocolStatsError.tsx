import React from "react";
import {cn} from "../../../utils/cn";

interface ProtocolStatsErrorProps {
  error?: Error;
  onRetry?: () => void;
  className?: string;
}

/**
 * Error state component for protocol stats
 * Provides graceful error handling with retry functionality
 * Maintains the same layout as the normal stats component
 */
export function ProtocolStatsError({
  error,
  onRetry,
  className,
}: ProtocolStatsErrorProps) {
  const statTitles = ["All time volume", "Total TVL", "1D Volume", "7D Volume"];

  return (
    <div className={cn("w-full", className)}>
      {/* Stats row with error state */}
      <div className="flex flex-col md:flex-row gap-8">
        {statTitles.map((title, index) => (
          <ErrorStatCard key={index} title={title} />
        ))}
      </div>

      {/* Error message and retry */}
      <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm  text-red-800 mb-1">
              Failed to load protocol statistics
            </h3>
            <p className="text-xs text-red-600">
              {error?.message ||
                "An unexpected error occurred while fetching data."}
            </p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-xs  bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Individual error stat card that matches the StatCard layout
 */
function ErrorStatCard({title}: {title: string}) {
  return (
    <div className="flex flex-col gap-4 md:w-[206px]">
      {/* Title matches StatCard styling */}
      <h3 className="text-gray-500  text-[17.72px] leading-none">{title}</h3>
      {/* Error state value */}
      <div className="text-gray-400 text-[25.23px] leading-none font-alt">
        --
      </div>
    </div>
  );
}

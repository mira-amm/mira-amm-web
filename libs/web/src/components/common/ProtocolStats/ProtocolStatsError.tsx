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
 */
export function ProtocolStatsError({
  error,
  onRetry,
  className,
}: ProtocolStatsErrorProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
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

      {/* Error content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({length: 4}).map((_, index) => (
          <ErrorStatCard key={index} />
        ))}
      </div>

      {/* Error message and retry */}
      <div className="mt-6 p-4 rounded-lg bg-error-surface border border-error-border">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-error-content mb-1">
              Failed to load protocol statistics
            </h3>
            <p className="text-xs text-error-content-secondary">
              {error?.message ||
                "An unexpected error occurred while fetching data."}
            </p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-xs font-medium bg-error-content text-error-surface rounded hover:bg-error-content-secondary transition-colors"
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
 * Individual error stat card
 */
function ErrorStatCard() {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg bg-surface-secondary border border-error-border opacity-50">
      <div className="text-sm font-medium text-content-secondary uppercase tracking-wide">
        ---
      </div>
      <div className="text-2xl font-bold text-content-dimmed font-alt">--</div>
    </div>
  );
}

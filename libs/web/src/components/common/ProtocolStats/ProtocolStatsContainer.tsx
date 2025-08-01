import React from "react";
import {ProtocolStats} from "./ProtocolStats";
import {ProtocolStatsLoading} from "./ProtocolStatsLoading";
import {ProtocolStatsError} from "./ProtocolStatsError";
import {ProtocolStatsErrorBoundary} from "./ProtocolStatsErrorBoundary";
import type {ProtocolStatsData} from "../../../types/protocol-stats";

interface ProtocolStatsContainerProps {
  data?: ProtocolStatsData;
  lastUpdated?: Date;
  isLoading?: boolean;
  isStale?: boolean;
  error?: Error;
  onRetry?: () => void;
  className?: string;
}

/**
 * Container component that handles all states for protocol stats
 * Provides loading, error, and success states with error boundary protection
 */
export function ProtocolStatsContainer({
  data,
  lastUpdated,
  isLoading = false,
  isStale = false,
  error,
  onRetry,
  className,
}: ProtocolStatsContainerProps) {
  // Loading state
  if (isLoading && !data) {
    return <ProtocolStatsLoading className={className} />;
  }

  // Error state (when no data available)
  if (error && !data) {
    return (
      <ProtocolStatsError
        error={error}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  // Success state with data
  if (data) {
    return (
      <ProtocolStatsErrorBoundary
        onError={(error, errorInfo) => {
          console.error("Protocol stats component error:", error, errorInfo);
        }}
      >
        <ProtocolStats
          stats={data}
          lastUpdated={lastUpdated || new Date()}
          isStale={isStale}
        />
      </ProtocolStatsErrorBoundary>
    );
  }

  // Fallback loading state
  return <ProtocolStatsLoading className={className} />;
}

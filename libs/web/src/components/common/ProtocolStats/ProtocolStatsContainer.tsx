import React from "react";
import {ProtocolStats} from "./ProtocolStats";
import {ProtocolStatsErrorBoundary} from "./ProtocolStatsErrorBoundary";

interface ProtocolStatsContainerProps {
  className?: string;
}

/**
 * Container component for client-side protocol stats
 * Wraps the ProtocolStats component with error boundary protection
 * The ProtocolStats component handles its own loading, error, and data states via TanStack Query
 */
export function ProtocolStatsContainer({
  className,
}: ProtocolStatsContainerProps) {
  return (
    <ProtocolStatsErrorBoundary
      onError={(error, errorInfo) => {
        console.error("Protocol stats component error:", error, errorInfo);
      }}
    >
      <ProtocolStats className={className} />
    </ProtocolStatsErrorBoundary>
  );
}

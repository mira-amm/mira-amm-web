import React from "react";
import {ProtocolStatsDisplay} from "./ProtocolStatsDisplay";
import {ProtocolStatsError} from "./ProtocolStatsError";
import {cn} from "../../../utils/cn";
import {useProtocolStats} from "../../../hooks/useProtocolStats";
import {ProtocolStatsProps} from "@/src/types";

/**
 * Main protocol statistics component with client-side rendering
 * Displays key metrics: All Time Volume, Total TVL, 1 Day Volume, 7 Day Volume
 * Uses TanStack Query for data fetching, caching, and background updates
 */
export function ProtocolStats({className}: ProtocolStatsProps) {
  console.log("🔄 ProtocolStats component rendering...");
  const {data, isLoading, isError, error, refetch} = useProtocolStats();
  console.log("📊 ProtocolStats state:", {
    data,
    isLoading,
    isError,
    error: error?.message,
  });

  // Handle error state
  if (isError && error) {
    return (
      <div className={cn("w-full", className)}>
        <ProtocolStatsError error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <ProtocolStatsDisplay
      stats={data}
      className={className}
      isLoading={isLoading}
    />
  );
}

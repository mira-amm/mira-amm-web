"use client";

import React, {useState} from "react";
import {ProtocolStatsError} from "./ProtocolStatsError";

interface ProtocolStatsErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{error?: Error; onRetry?: () => void}>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error boundary specifically for protocol stats components
 * Catches JavaScript errors and provides graceful fallback UI
 */
export function ProtocolStatsErrorBoundary({
  children,
  fallback,
  onError,
}: ProtocolStatsErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const handleRetry = () => {
    setHasError(false);
    setError(undefined);
  };

  if (hasError) {
    const FallbackComponent = fallback || ProtocolStatsError;

    return <FallbackComponent error={error} onRetry={handleRetry} />;
  }

  // Wrap children in error handling
  try {
    return <>{children}</>;
  } catch (caughtError) {
    const err = caughtError as Error;
    console.error("ProtocolStats Error Boundary caught an error:", err);

    // Call optional error handler
    if (onError) {
      onError(err, {} as React.ErrorInfo);
    }

    setHasError(true);
    setError(err);

    const FallbackComponent = fallback || ProtocolStatsError;
    return <FallbackComponent error={err} onRetry={handleRetry} />;
  }
}

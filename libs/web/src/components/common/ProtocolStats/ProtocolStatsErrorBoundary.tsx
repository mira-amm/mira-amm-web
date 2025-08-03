"use client";

import React, {Component, ReactNode} from "react";
import {ProtocolStatsError} from "./ProtocolStatsError";

interface ProtocolStatsErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{error?: Error; onRetry?: () => void}>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ProtocolStatsErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically for protocol stats components
 * Catches JavaScript errors and provides graceful fallback UI
 */
export class ProtocolStatsErrorBoundary extends Component<
  ProtocolStatsErrorBoundaryProps,
  ProtocolStatsErrorBoundaryState
> {
  constructor(props: ProtocolStatsErrorBoundaryProps) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(
    error: Error
  ): ProtocolStatsErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "ProtocolStats Error Boundary caught an error:",
      error,
      errorInfo
    );

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({hasError: false, error: undefined});
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ProtocolStatsError;
      return (
        <FallbackComponent
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

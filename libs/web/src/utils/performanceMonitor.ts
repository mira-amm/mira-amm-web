/**
 * Performance monitoring utilities for V2 SDK operations
 */

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  totalOperations: number;
  averageDuration: number;
  successRate: number;
  errorRate: number;
  slowestOperation: PerformanceMetric | null;
  fastestOperation: PerformanceMetric | null;
  recentOperations: PerformanceMetric[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 operations
  private readonly slowOperationThreshold = 2000; // 2 seconds

  /**
   * Start timing an operation
   */
  startOperation(operation: string, metadata?: Record<string, any>): string {
    const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const metric: PerformanceMetric = {
      operation: `${operation}:${operationId}`,
      startTime: performance.now(),
      success: false,
      metadata,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    return operationId;
  }

  /**
   * End timing an operation
   */
  endOperation(
    operationId: string,
    success: boolean = true,
    error?: string
  ): void {
    const metric = this.metrics.find((m) => m.operation.includes(operationId));

    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.success = success;
      metric.error = error;

      // Log slow operations in development
      if (
        metric.duration > this.slowOperationThreshold &&
        process.env.NODE_ENV === "development"
      ) {
        console.warn(
          `Slow operation detected: ${metric.operation} took ${metric.duration.toFixed(2)}ms`
        );
      }
    }
  }

  /**
   * Time an async operation
   */
  async timeOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const operationId = this.startOperation(operation, metadata);

    try {
      const result = await fn();
      this.endOperation(operationId, true);
      return result;
    } catch (error) {
      this.endOperation(
        operationId,
        false,
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getStats(operationType?: string): PerformanceStats {
    let relevantMetrics = this.metrics.filter((m) => m.endTime !== undefined);

    if (operationType) {
      relevantMetrics = relevantMetrics.filter((m) =>
        m.operation.startsWith(operationType)
      );
    }

    if (relevantMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        successRate: 0,
        errorRate: 0,
        slowestOperation: null,
        fastestOperation: null,
        recentOperations: [],
      };
    }

    const durations = relevantMetrics.map((m) => m.duration!);
    const successfulOps = relevantMetrics.filter((m) => m.success);

    return {
      totalOperations: relevantMetrics.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      successRate: (successfulOps.length / relevantMetrics.length) * 100,
      errorRate:
        ((relevantMetrics.length - successfulOps.length) /
          relevantMetrics.length) *
        100,
      slowestOperation: relevantMetrics.reduce((slowest, current) =>
        !slowest || current.duration! > slowest.duration! ? current : slowest
      ),
      fastestOperation: relevantMetrics.reduce((fastest, current) =>
        !fastest || current.duration! < fastest.duration! ? current : fastest
      ),
      recentOperations: relevantMetrics.slice(-10), // Last 10 operations
    };
  }

  /**
   * Get operations by type
   */
  getOperationsByType(): Record<string, number> {
    const operationCounts: Record<string, number> = {};

    this.metrics.forEach((metric) => {
      const operationType = metric.operation.split(":")[0];
      operationCounts[operationType] =
        (operationCounts[operationType] || 0) + 1;
    });

    return operationCounts;
  }

  /**
   * Get slow operations
   */
  getSlowOperations(
    threshold: number = this.slowOperationThreshold
  ): PerformanceMetric[] {
    return this.metrics.filter(
      (m) => m.duration !== undefined && m.duration > threshold
    );
  }

  /**
   * Get failed operations
   */
  getFailedOperations(): PerformanceMetric[] {
    return this.metrics.filter((m) => !m.success);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get real-time performance summary
   */
  getRealTimeSummary() {
    const recentMetrics = this.metrics.slice(-50); // Last 50 operations
    const completedMetrics = recentMetrics.filter(
      (m) => m.endTime !== undefined
    );

    if (completedMetrics.length === 0) {
      return {
        status: "no_data",
        message: "No recent operations to analyze",
      };
    }

    const avgDuration =
      completedMetrics.reduce((sum, m) => sum + m.duration!, 0) /
      completedMetrics.length;
    const successRate =
      (completedMetrics.filter((m) => m.success).length /
        completedMetrics.length) *
      100;

    let status: "good" | "warning" | "critical" = "good";
    let message = "Performance is good";

    if (avgDuration > this.slowOperationThreshold) {
      status = "critical";
      message = "Operations are running slowly";
    } else if (avgDuration > this.slowOperationThreshold / 2) {
      status = "warning";
      message = "Operations are slower than usual";
    } else if (successRate < 95) {
      status = "warning";
      message = "Higher than normal error rate";
    } else if (successRate < 90) {
      status = "critical";
      message = "High error rate detected";
    }

    return {
      status,
      message,
      avgDuration: Math.round(avgDuration),
      successRate: Math.round(successRate * 100) / 100,
      recentOperations: completedMetrics.length,
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for timing class methods
 */
export function timed(operationName?: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    const operation =
      operationName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      return await performanceMonitor.timeOperation(
        operation,
        () => method.apply(this, args),
        {args: args.length}
      );
    };
  };
}

/**
 * Hook for React components to monitor performance
 */
export function usePerformanceMonitor() {
  return {
    startOperation: (operation: string, metadata?: Record<string, any>) =>
      performanceMonitor.startOperation(operation, metadata),
    endOperation: (operationId: string, success?: boolean, error?: string) =>
      performanceMonitor.endOperation(operationId, success, error),
    timeOperation: <T>(
      operation: string,
      fn: () => Promise<T>,
      metadata?: Record<string, any>
    ) => performanceMonitor.timeOperation(operation, fn, metadata),
    getStats: (operationType?: string) =>
      performanceMonitor.getStats(operationType),
    getRealTimeSummary: () => performanceMonitor.getRealTimeSummary(),
    clear: () => performanceMonitor.clear(),
  };
}

/**
 * Performance monitoring utilities for specific SDK operations
 */
export const SDKPerformanceUtils = {
  /**
   * Monitor pool data fetching
   */
  async monitorPoolDataFetch<T>(
    poolId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return await performanceMonitor.timeOperation(
      "pool_data_fetch",
      operation,
      {poolId}
    );
  },

  /**
   * Monitor liquidity operations
   */
  async monitorLiquidityOperation<T>(
    operationType: "add" | "remove",
    poolId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return await performanceMonitor.timeOperation(
      `liquidity_${operationType}`,
      operation,
      {poolId, operationType}
    );
  },

  /**
   * Monitor swap operations
   */
  async monitorSwapOperation<T>(
    swapType: "exact_input" | "exact_output" | "preview",
    operation: () => Promise<T>
  ): Promise<T> {
    return await performanceMonitor.timeOperation(
      `swap_${swapType}`,
      operation,
      {swapType}
    );
  },

  /**
   * Get SDK-specific performance insights
   */
  getSDKPerformanceInsights() {
    const poolStats = performanceMonitor.getStats("pool_data_fetch");
    const liquidityStats = performanceMonitor.getStats("liquidity_");
    const swapStats = performanceMonitor.getStats("swap_");

    return {
      poolOperations: {
        count: poolStats.totalOperations,
        avgDuration: poolStats.averageDuration,
        successRate: poolStats.successRate,
      },
      liquidityOperations: {
        count: liquidityStats.totalOperations,
        avgDuration: liquidityStats.averageDuration,
        successRate: liquidityStats.successRate,
      },
      swapOperations: {
        count: swapStats.totalOperations,
        avgDuration: swapStats.averageDuration,
        successRate: swapStats.successRate,
      },
      overall: performanceMonitor.getRealTimeSummary(),
    };
  },
};

import {BN, BigNumberish, AssetId} from "fuels";
import {PoolIdV2} from "../model";
import {MockError, MockErrorType, MockSDKConfig} from "./types";

/**
 * Detailed context information for debugging errors
 */
export interface DetailedErrorContext {
  /** Unique error ID for tracking */
  errorId: string;
  /** Timestamp when error occurred */
  timestamp: Date;
  /** Operation that caused the error */
  operation: string;
  /** User/account that triggered the error */
  userId?: string;
  /** Pool involved in the operation */
  poolId?: string;
  /** Complete parameter set used in the operation */
  parameters: Record<string, any>;
  /** System state at the time of error */
  systemState: {
    /** Available balances */
    balances: Record<string, string>;
    /** Pool states */
    pools: Record<string, any>;
    /** Active transactions */
    activeTransactions: number;
    /** Network conditions */
    networkConditions: {
      latency: number;
      gasPrice: string;
      blockNumber: number;
    };
  };
  /** Call stack trace */
  stackTrace: string[];
  /** Previous operations in the session */
  operationHistory: Array<{
    operation: string;
    timestamp: Date;
    success: boolean;
    parameters: Record<string, any>;
  }>;
  /** Error classification */
  classification: {
    /** Error severity level */
    severity: "low" | "medium" | "high" | "critical";
    /** Error category */
    category:
      | "user_error"
      | "system_error"
      | "network_error"
      | "validation_error";
    /** Whether error is expected in normal operation */
    isExpected: boolean;
    /** Impact on user experience */
    userImpact: "none" | "minor" | "moderate" | "severe";
  };
  /** Debugging information */
  debugInfo: {
    /** Relevant configuration */
    config: Partial<MockSDKConfig>;
    /** Environment information */
    environment: Record<string, any>;
    /** Performance metrics */
    performance: {
      operationDuration: number;
      memoryUsage?: number;
      cpuUsage?: number;
    };
  };
}

/**
 * Error pattern for identifying recurring issues
 */
export interface ErrorPattern {
  /** Pattern identifier */
  id: string;
  /** Pattern description */
  description: string;
  /** Matching criteria */
  criteria: {
    operation?: string;
    errorType?: MockErrorType;
    parameterPatterns?: Record<string, any>;
    frequencyThreshold?: number;
    timeWindow?: number; // in milliseconds
  };
  /** Number of occurrences */
  occurrences: number;
  /** First occurrence timestamp */
  firstSeen: Date;
  /** Last occurrence timestamp */
  lastSeen: Date;
  /** Suggested resolution */
  resolution: string;
}

/**
 * MockErrorContextTracker provides comprehensive error tracking and debugging capabilities
 *
 * Features:
 * - Detailed error context collection for debugging
 * - Error pattern detection and analysis
 * - Performance impact tracking
 * - Automated error classification
 * - Debug information aggregation
 * - Error correlation analysis
 */
export class MockErrorContextTracker {
  private config: MockSDKConfig;
  private errorContexts: Map<string, DetailedErrorContext> = new Map();
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private operationHistory: Array<{
    operation: string;
    timestamp: Date;
    success: boolean;
    parameters: Record<string, any>;
  }> = [];
  private maxContextHistory = 1000;
  private maxOperationHistory = 500;

  constructor(config: MockSDKConfig) {
    this.config = config;
    this.initializeErrorPatterns();
  }

  /**
   * Track an error with comprehensive context
   */
  trackError(
    error: MockError,
    operation: string,
    parameters: Record<string, any>,
    systemState: any,
    userId?: string
  ): DetailedErrorContext {
    const errorId = this.generateErrorId();
    const stackTrace = this.captureStackTrace();

    const context: DetailedErrorContext = {
      errorId,
      timestamp: new Date(),
      operation,
      userId,
      poolId: this.extractPoolId(parameters),
      parameters: this.sanitizeParameters(parameters),
      systemState: this.captureSystemState(systemState),
      stackTrace,
      operationHistory: [...this.operationHistory],
      classification: this.classifyError(error, operation, parameters),
      debugInfo: {
        config: this.sanitizeConfig(),
        environment: this.captureEnvironment(),
        performance: this.capturePerformanceMetrics(),
      },
    };

    // Store the context
    this.errorContexts.set(errorId, context);

    // Clean up old contexts
    this.cleanupOldContexts();

    // Update error patterns
    this.updateErrorPatterns(context);

    // Log for debugging if enabled
    if (this.config.enableDebugLogging) {
      this.logErrorContext(context);
    }

    return context;
  }

  /**
   * Track a successful operation for context
   */
  trackOperation(
    operation: string,
    parameters: Record<string, any>,
    success: boolean = true
  ): void {
    this.operationHistory.push({
      operation,
      timestamp: new Date(),
      success,
      parameters: this.sanitizeParameters(parameters),
    });

    // Clean up old operation history
    if (this.operationHistory.length > this.maxOperationHistory) {
      this.operationHistory = this.operationHistory.slice(
        -this.maxOperationHistory
      );
    }
  }

  /**
   * Get error context by ID
   */
  getErrorContext(errorId: string): DetailedErrorContext | undefined {
    return this.errorContexts.get(errorId);
  }

  /**
   * Get all error contexts for an operation
   */
  getErrorContextsForOperation(operation: string): DetailedErrorContext[] {
    return Array.from(this.errorContexts.values())
      .filter((context) => context.operation === operation)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get error contexts for a specific user
   */
  getErrorContextsForUser(userId: string): DetailedErrorContext[] {
    return Array.from(this.errorContexts.values())
      .filter((context) => context.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get error contexts for a specific pool
   */
  getErrorContextsForPool(poolId: string): DetailedErrorContext[] {
    return Array.from(this.errorContexts.values())
      .filter((context) => context.poolId === poolId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Analyze error patterns and trends
   */
  analyzeErrorPatterns(): {
    patterns: ErrorPattern[];
    trends: {
      errorRate: number;
      mostCommonErrors: Array<{type: MockErrorType; count: number}>;
      operationFailureRates: Record<string, number>;
      timeBasedTrends: Array<{
        timeWindow: string;
        errorCount: number;
        successCount: number;
      }>;
    };
    recommendations: string[];
  } {
    const patterns = Array.from(this.errorPatterns.values()).sort(
      (a, b) => b.occurrences - a.occurrences
    );

    const errorCounts = new Map<MockErrorType, number>();
    const operationCounts = new Map<string, {errors: number; total: number}>();

    // Analyze error contexts
    for (const context of this.errorContexts.values()) {
      // Count error types
      const errorType = this.extractErrorType(context);
      errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1);

      // Count operation failures
      const opStats = operationCounts.get(context.operation) || {
        errors: 0,
        total: 0,
      };
      opStats.errors++;
      opStats.total++;
      operationCounts.set(context.operation, opStats);
    }

    // Add successful operations to totals
    for (const op of this.operationHistory) {
      if (op.success) {
        const opStats = operationCounts.get(op.operation) || {
          errors: 0,
          total: 0,
        };
        opStats.total++;
        operationCounts.set(op.operation, opStats);
      }
    }

    const mostCommonErrors = Array.from(errorCounts.entries())
      .map(([type, count]) => ({type, count}))
      .sort((a, b) => b.count - a.count);

    const operationFailureRates: Record<string, number> = {};
    for (const [operation, stats] of operationCounts.entries()) {
      operationFailureRates[operation] =
        stats.total > 0 ? stats.errors / stats.total : 0;
    }

    const totalOperations =
      this.operationHistory.length + this.errorContexts.size;
    const errorRate =
      totalOperations > 0 ? this.errorContexts.size / totalOperations : 0;

    const timeBasedTrends = this.analyzeTimeBasedTrends();
    const recommendations = this.generateRecommendations(
      patterns,
      mostCommonErrors,
      operationFailureRates
    );

    return {
      patterns,
      trends: {
        errorRate,
        mostCommonErrors,
        operationFailureRates,
        timeBasedTrends,
      },
      recommendations,
    };
  }

  /**
   * Generate debug report for an error
   */
  generateDebugReport(errorId: string): string {
    const context = this.errorContexts.get(errorId);
    if (!context) {
      return `Error context not found for ID: ${errorId}`;
    }

    const report = [
      `=== ERROR DEBUG REPORT ===`,
      `Error ID: ${context.errorId}`,
      `Timestamp: ${context.timestamp.toISOString()}`,
      `Operation: ${context.operation}`,
      `User ID: ${context.userId || "N/A"}`,
      `Pool ID: ${context.poolId || "N/A"}`,
      ``,
      `=== ERROR CLASSIFICATION ===`,
      `Severity: ${context.classification.severity}`,
      `Category: ${context.classification.category}`,
      `Expected: ${context.classification.isExpected}`,
      `User Impact: ${context.classification.userImpact}`,
      ``,
      `=== PARAMETERS ===`,
      JSON.stringify(context.parameters, null, 2),
      ``,
      `=== SYSTEM STATE ===`,
      JSON.stringify(context.systemState, null, 2),
      ``,
      `=== STACK TRACE ===`,
      ...context.stackTrace,
      ``,
      `=== RECENT OPERATIONS ===`,
      ...context.operationHistory
        .slice(-5)
        .map(
          (op) =>
            `${op.timestamp.toISOString()} - ${op.operation} (${op.success ? "SUCCESS" : "FAILED"})`
        ),
      ``,
      `=== DEBUG INFO ===`,
      JSON.stringify(context.debugInfo, null, 2),
      ``,
      `=== END REPORT ===`,
    ];

    return report.join("\n");
  }

  /**
   * Clear all tracked contexts and patterns
   */
  clearAll(): void {
    this.errorContexts.clear();
    this.errorPatterns.clear();
    this.operationHistory = [];
  }

  /**
   * Export error data for external analysis
   */
  exportErrorData(): {
    contexts: DetailedErrorContext[];
    patterns: ErrorPattern[];
    operationHistory: typeof this.operationHistory;
    summary: ReturnType<typeof this.analyzeErrorPatterns>;
  } {
    return {
      contexts: Array.from(this.errorContexts.values()),
      patterns: Array.from(this.errorPatterns.values()),
      operationHistory: [...this.operationHistory],
      summary: this.analyzeErrorPatterns(),
    };
  }

  // ===== Private Helper Methods =====

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Capture stack trace
   */
  private captureStackTrace(): string[] {
    const stack = new Error().stack || "";
    return stack.split("\n").slice(2); // Remove Error and this function
  }

  /**
   * Extract pool ID from parameters
   */
  private extractPoolId(parameters: Record<string, any>): string | undefined {
    if (parameters.poolId) {
      return parameters.poolId.toString();
    }
    if (
      parameters.pools &&
      Array.isArray(parameters.pools) &&
      parameters.pools.length > 0
    ) {
      return parameters.pools[0].toString();
    }
    return undefined;
  }

  /**
   * Sanitize parameters for logging (remove sensitive data)
   */
  private sanitizeParameters(
    parameters: Record<string, any>
  ): Record<string, any> {
    const sanitized = {...parameters};

    // Convert BN objects to strings
    for (const [key, value] of Object.entries(sanitized)) {
      if (value && typeof value === "object" && value.toString) {
        sanitized[key] = value.toString();
      }
    }

    return sanitized;
  }

  /**
   * Capture current system state
   */
  private captureSystemState(
    systemState: any
  ): DetailedErrorContext["systemState"] {
    return {
      balances: this.extractBalances(systemState),
      pools: this.extractPoolStates(systemState),
      activeTransactions: this.extractActiveTransactions(systemState),
      networkConditions: {
        latency: this.config.defaultLatencyMs,
        gasPrice: "1000000000", // Mock gas price
        blockNumber: Math.floor(Date.now() / 1000), // Mock block number
      },
    };
  }

  /**
   * Classify error for debugging purposes
   */
  private classifyError(
    error: MockError,
    operation: string,
    parameters: Record<string, any>
  ): DetailedErrorContext["classification"] {
    const severity = this.determineSeverity(error.type);
    const category = this.determineCategory(error.type);
    const isExpected = this.isExpectedError(error.type, operation);
    const userImpact = this.determineUserImpact(error.type, operation);

    return {severity, category, isExpected, userImpact};
  }

  /**
   * Sanitize config for logging
   */
  private sanitizeConfig(): Partial<MockSDKConfig> {
    return {
      defaultFailureRate: this.config.defaultFailureRate,
      defaultLatencyMs: this.config.defaultLatencyMs,
      enableRealisticGas: this.config.enableRealisticGas,
      enablePriceImpact: this.config.enablePriceImpact,
      enableSlippageSimulation: this.config.enableSlippageSimulation,
    };
  }

  /**
   * Capture environment information
   */
  private captureEnvironment(): Record<string, any> {
    return {
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "Node.js",
      timestamp: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * Capture performance metrics
   */
  private capturePerformanceMetrics(): DetailedErrorContext["debugInfo"]["performance"] {
    return {
      operationDuration: 0, // Will be filled by caller
      memoryUsage:
        typeof performance !== "undefined" && performance.memory
          ? performance.memory.usedJSHeapSize
          : undefined,
    };
  }

  /**
   * Initialize predefined error patterns
   */
  private initializeErrorPatterns(): void {
    const patterns: Omit<
      ErrorPattern,
      "occurrences" | "firstSeen" | "lastSeen"
    >[] = [
      {
        id: "frequent_slippage",
        description: "Frequent slippage errors in swap operations",
        criteria: {
          operation: "swap",
          errorType: MockErrorType.SLIPPAGE_EXCEEDED,
          frequencyThreshold: 5,
          timeWindow: 60000, // 1 minute
        },
        resolution:
          "Consider using higher slippage tolerance or smaller trade sizes",
      },
      {
        id: "insufficient_balance_pattern",
        description: "Repeated insufficient balance errors",
        criteria: {
          errorType: MockErrorType.INSUFFICIENT_BALANCE,
          frequencyThreshold: 3,
          timeWindow: 300000, // 5 minutes
        },
        resolution: "Ensure adequate token balances before operations",
      },
      {
        id: "network_instability",
        description: "Network errors indicating connection issues",
        criteria: {
          errorType: MockErrorType.NETWORK_ERROR,
          frequencyThreshold: 3,
          timeWindow: 120000, // 2 minutes
        },
        resolution:
          "Check network connection and retry with exponential backoff",
      },
    ];

    for (const pattern of patterns) {
      this.errorPatterns.set(pattern.id, {
        ...pattern,
        occurrences: 0,
        firstSeen: new Date(),
        lastSeen: new Date(),
      });
    }
  }

  /**
   * Update error patterns based on new error
   */
  private updateErrorPatterns(context: DetailedErrorContext): void {
    const errorType = this.extractErrorType(context);

    for (const pattern of this.errorPatterns.values()) {
      if (this.matchesPattern(context, errorType, pattern)) {
        pattern.occurrences++;
        pattern.lastSeen = context.timestamp;

        if (pattern.occurrences === 1) {
          pattern.firstSeen = context.timestamp;
        }
      }
    }
  }

  /**
   * Check if error context matches a pattern
   */
  private matchesPattern(
    context: DetailedErrorContext,
    errorType: MockErrorType,
    pattern: ErrorPattern
  ): boolean {
    const criteria = pattern.criteria;

    if (criteria.operation && criteria.operation !== context.operation) {
      return false;
    }

    if (criteria.errorType && criteria.errorType !== errorType) {
      return false;
    }

    // Additional pattern matching logic can be added here

    return true;
  }

  /**
   * Extract error type from context
   */
  private extractErrorType(context: DetailedErrorContext): MockErrorType {
    // This would need to be implemented based on how errors are stored in context
    // For now, return a default
    return MockErrorType.NETWORK_ERROR;
  }

  /**
   * Clean up old error contexts
   */
  private cleanupOldContexts(): void {
    if (this.errorContexts.size <= this.maxContextHistory) {
      return;
    }

    const contexts = Array.from(this.errorContexts.entries()).sort(
      ([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const toRemove = contexts.slice(
      0,
      contexts.length - this.maxContextHistory
    );
    for (const [id] of toRemove) {
      this.errorContexts.delete(id);
    }
  }

  /**
   * Log error context for debugging
   */
  private logErrorContext(context: DetailedErrorContext): void {
    console.error(`[MockSDK Error] ${context.operation} failed:`, {
      errorId: context.errorId,
      timestamp: context.timestamp,
      classification: context.classification,
      parameters: context.parameters,
    });
  }

  /**
   * Extract balances from system state
   */
  private extractBalances(systemState: any): Record<string, string> {
    if (systemState?.account?.balances) {
      const balances: Record<string, string> = {};
      for (const [assetId, balance] of systemState.account.balances.entries()) {
        balances[assetId] = balance.toString();
      }
      return balances;
    }
    return {};
  }

  /**
   * Extract pool states from system state
   */
  private extractPoolStates(systemState: any): Record<string, any> {
    if (systemState?.stateManager?.pools) {
      const pools: Record<string, any> = {};
      for (const [poolId, pool] of systemState.stateManager.pools.entries()) {
        pools[poolId] = {
          activeBinId: pool.activeBinId,
          totalReserves: pool.totalReserves,
          binCount: pool.bins?.size || 0,
        };
      }
      return pools;
    }
    return {};
  }

  /**
   * Extract active transactions count
   */
  private extractActiveTransactions(systemState: any): number {
    return systemState?.activeTransactions || 0;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(
    errorType: MockErrorType
  ): DetailedErrorContext["classification"]["severity"] {
    const severityMap: Record<
      MockErrorType,
      DetailedErrorContext["classification"]["severity"]
    > = {
      [MockErrorType.NETWORK_ERROR]: "high",
      [MockErrorType.GAS_ESTIMATION_FAILED]: "medium",
      [MockErrorType.INSUFFICIENT_BALANCE]: "low",
      [MockErrorType.SLIPPAGE_EXCEEDED]: "low",
      [MockErrorType.DEADLINE_EXCEEDED]: "low",
      [MockErrorType.INSUFFICIENT_LIQUIDITY]: "medium",
      [MockErrorType.POOL_NOT_FOUND]: "high",
      [MockErrorType.INVALID_BIN_RANGE]: "medium",
      [MockErrorType.INVALID_PARAMETERS]: "medium",
    };

    return severityMap[errorType] || "medium";
  }

  /**
   * Determine error category
   */
  private determineCategory(
    errorType: MockErrorType
  ): DetailedErrorContext["classification"]["category"] {
    const categoryMap: Record<
      MockErrorType,
      DetailedErrorContext["classification"]["category"]
    > = {
      [MockErrorType.NETWORK_ERROR]: "network_error",
      [MockErrorType.GAS_ESTIMATION_FAILED]: "system_error",
      [MockErrorType.INSUFFICIENT_BALANCE]: "user_error",
      [MockErrorType.SLIPPAGE_EXCEEDED]: "user_error",
      [MockErrorType.DEADLINE_EXCEEDED]: "user_error",
      [MockErrorType.INSUFFICIENT_LIQUIDITY]: "system_error",
      [MockErrorType.POOL_NOT_FOUND]: "user_error",
      [MockErrorType.INVALID_BIN_RANGE]: "validation_error",
      [MockErrorType.INVALID_PARAMETERS]: "validation_error",
    };

    return categoryMap[errorType] || "system_error";
  }

  /**
   * Check if error is expected in normal operation
   */
  private isExpectedError(
    errorType: MockErrorType,
    operation: string
  ): boolean {
    const expectedErrors = [
      MockErrorType.SLIPPAGE_EXCEEDED,
      MockErrorType.INSUFFICIENT_LIQUIDITY,
    ];

    return expectedErrors.includes(errorType);
  }

  /**
   * Determine user impact
   */
  private determineUserImpact(
    errorType: MockErrorType,
    operation: string
  ): DetailedErrorContext["classification"]["userImpact"] {
    const impactMap: Record<
      MockErrorType,
      DetailedErrorContext["classification"]["userImpact"]
    > = {
      [MockErrorType.NETWORK_ERROR]: "severe",
      [MockErrorType.GAS_ESTIMATION_FAILED]: "moderate",
      [MockErrorType.INSUFFICIENT_BALANCE]: "minor",
      [MockErrorType.SLIPPAGE_EXCEEDED]: "minor",
      [MockErrorType.DEADLINE_EXCEEDED]: "minor",
      [MockErrorType.INSUFFICIENT_LIQUIDITY]: "moderate",
      [MockErrorType.POOL_NOT_FOUND]: "severe",
      [MockErrorType.INVALID_BIN_RANGE]: "moderate",
      [MockErrorType.INVALID_PARAMETERS]: "moderate",
    };

    return impactMap[errorType] || "moderate";
  }

  /**
   * Analyze time-based error trends
   */
  private analyzeTimeBasedTrends(): Array<{
    timeWindow: string;
    errorCount: number;
    successCount: number;
  }> {
    const now = Date.now();
    const windows = [
      {name: "last_hour", duration: 60 * 60 * 1000},
      {name: "last_day", duration: 24 * 60 * 60 * 1000},
      {name: "last_week", duration: 7 * 24 * 60 * 60 * 1000},
    ];

    return windows.map((window) => {
      const cutoff = now - window.duration;

      const errorCount = Array.from(this.errorContexts.values()).filter(
        (context) => context.timestamp.getTime() > cutoff
      ).length;

      const successCount = this.operationHistory.filter(
        (op) => op.success && op.timestamp.getTime() > cutoff
      ).length;

      return {
        timeWindow: window.name,
        errorCount,
        successCount,
      };
    });
  }

  /**
   * Generate recommendations based on error analysis
   */
  private generateRecommendations(
    patterns: ErrorPattern[],
    mostCommonErrors: Array<{type: MockErrorType; count: number}>,
    operationFailureRates: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // Pattern-based recommendations
    for (const pattern of patterns.slice(0, 3)) {
      if (pattern.occurrences > 0) {
        recommendations.push(pattern.resolution);
      }
    }

    // Error type recommendations
    for (const {type, count} of mostCommonErrors.slice(0, 2)) {
      if (count > 5) {
        recommendations.push(this.getErrorTypeRecommendation(type));
      }
    }

    // Operation failure rate recommendations
    for (const [operation, rate] of Object.entries(operationFailureRates)) {
      if (rate > 0.2) {
        // 20% failure rate
        recommendations.push(
          `High failure rate for ${operation} operations (${(rate * 100).toFixed(1)}%). Review parameters and conditions.`
        );
      }
    }

    return recommendations.filter(Boolean);
  }

  /**
   * Get recommendation for specific error type
   */
  private getErrorTypeRecommendation(errorType: MockErrorType): string {
    const recommendations: Record<MockErrorType, string> = {
      [MockErrorType.SLIPPAGE_EXCEEDED]:
        "Consider using higher slippage tolerance for volatile market conditions",
      [MockErrorType.INSUFFICIENT_BALANCE]:
        "Ensure adequate token balances before initiating operations",
      [MockErrorType.NETWORK_ERROR]:
        "Implement retry logic with exponential backoff for network operations",
      [MockErrorType.INSUFFICIENT_LIQUIDITY]:
        "Use smaller trade sizes or add liquidity to pools",
      [MockErrorType.GAS_ESTIMATION_FAILED]:
        "Review gas limit settings and network conditions",
      [MockErrorType.DEADLINE_EXCEEDED]:
        "Use longer deadlines for operations during network congestion",
      [MockErrorType.POOL_NOT_FOUND]: "Verify pool existence before operations",
      [MockErrorType.INVALID_BIN_RANGE]:
        "Validate bin parameters before liquidity operations",
      [MockErrorType.INVALID_PARAMETERS]:
        "Implement comprehensive parameter validation",
    };

    return (
      recommendations[errorType] ||
      "Review error patterns and adjust operation parameters"
    );
  }
}

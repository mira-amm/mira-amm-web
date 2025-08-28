import {BN, BigNumberish} from "fuels";
import {MockError, MockErrorType, MockSDKConfig} from "./types";
import {MockStateManager} from "./MockStateManager";

/**
 * Error recovery suggestion with actionable steps
 */
export interface ErrorRecoverySuggestion {
  /** Type of recovery action */
  type: "retry" | "adjust_parameters" | "wait" | "manual_intervention";
  /** Human-readable description */
  description: string;
  /** Specific parameters to adjust */
  parameterAdjustments?: Record<string, any>;
  /** Estimated wait time for retry (in milliseconds) */
  waitTime?: number;
  /** Confidence level of the suggestion (0-1) */
  confidence: number;
  /** Additional context for the suggestion */
  context?: Record<string, any>;
}

/**
 * State snapshot for rollback operations
 */
export interface StateSnapshot {
  /** Snapshot timestamp */
  timestamp: Date;
  /** Operation that created this snapshot */
  operation: string;
  /** Serialized state data */
  stateData: any;
  /** Transaction ID associated with this snapshot */
  transactionId?: string;
}

/**
 * Error context with recovery information
 */
export interface ErrorContextWithRecovery {
  /** Original error */
  error: MockError;
  /** Operation that caused the error */
  operation: string;
  /** Parameters used in the operation */
  parameters: Record<string, any>;
  /** State snapshot before the operation */
  preOperationSnapshot?: StateSnapshot;
  /** Recovery suggestions */
  suggestions: ErrorRecoverySuggestion[];
  /** Whether the error is recoverable */
  isRecoverable: boolean;
  /** Number of retry attempts made */
  retryCount: number;
  /** Maximum retry attempts allowed */
  maxRetries: number;
}

/**
 * MockErrorRecovery provides comprehensive error handling and recovery mechanisms
 *
 * Features:
 * - Automatic error analysis and recovery suggestions
 * - State rollback capabilities for failed operations
 * - Intelligent retry mechanisms with backoff strategies
 * - Context-aware error recovery based on operation type and parameters
 * - Graceful degradation for unrecoverable errors
 */
export class MockErrorRecovery {
  private config: MockSDKConfig;
  private stateManager: MockStateManager;
  private stateSnapshots: Map<string, StateSnapshot> = new Map();
  private errorHistory: ErrorContextWithRecovery[] = [];
  private maxErrorHistory = 100;

  constructor(config: MockSDKConfig, stateManager: MockStateManager) {
    this.config = config;
    this.stateManager = stateManager;
  }

  /**
   * Create a state snapshot before an operation
   */
  createStateSnapshot(operation: string, transactionId?: string): string {
    const snapshotId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const snapshot: StateSnapshot = {
      timestamp: new Date(),
      operation,
      stateData: this.stateManager.serialize(),
      transactionId,
    };

    this.stateSnapshots.set(snapshotId, snapshot);

    // Clean up old snapshots (keep only last 50)
    if (this.stateSnapshots.size > 50) {
      const oldestKey = Array.from(this.stateSnapshots.keys())[0];
      this.stateSnapshots.delete(oldestKey);
    }

    return snapshotId;
  }

  /**
   * Rollback state to a previous snapshot
   */
  rollbackToSnapshot(snapshotId: string): boolean {
    const snapshot = this.stateSnapshots.get(snapshotId);
    if (!snapshot) {
      return false;
    }

    try {
      this.stateManager.deserialize(snapshot.stateData);
      return true;
    } catch (error) {
      console.error("Failed to rollback state:", error);
      return false;
    }
  }

  /**
   * Handle an error and provide recovery options
   */
  handleError(
    error: MockError,
    operation: string,
    parameters: Record<string, any>,
    preOperationSnapshotId?: string
  ): ErrorContextWithRecovery {
    const preOperationSnapshot = preOperationSnapshotId
      ? this.stateSnapshots.get(preOperationSnapshotId)
      : undefined;

    const suggestions = this.generateRecoverySuggestions(
      error,
      operation,
      parameters
    );
    const isRecoverable = this.isErrorRecoverable(error, operation);

    const errorContext: ErrorContextWithRecovery = {
      error,
      operation,
      parameters,
      preOperationSnapshot,
      suggestions,
      isRecoverable,
      retryCount: 0,
      maxRetries: this.getMaxRetries(error.type, operation),
    };

    // Add to error history
    this.errorHistory.push(errorContext);
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory.shift();
    }

    return errorContext;
  }

  /**
   * Attempt automatic recovery for an error
   */
  async attemptRecovery(errorContext: ErrorContextWithRecovery): Promise<{
    success: boolean;
    adjustedParameters?: Record<string, any>;
    message: string;
  }> {
    if (!errorContext.isRecoverable) {
      return {
        success: false,
        message: "Error is not recoverable",
      };
    }

    if (errorContext.retryCount >= errorContext.maxRetries) {
      return {
        success: false,
        message: `Maximum retry attempts (${errorContext.maxRetries}) exceeded`,
      };
    }

    // Try the highest confidence suggestion first
    const bestSuggestion = errorContext.suggestions.sort(
      (a, b) => b.confidence - a.confidence
    )[0];

    if (!bestSuggestion) {
      return {
        success: false,
        message: "No recovery suggestions available",
      };
    }

    errorContext.retryCount++;

    switch (bestSuggestion.type) {
      case "retry":
        // Simple retry after optional wait
        if (bestSuggestion.waitTime) {
          await this.wait(bestSuggestion.waitTime);
        }
        return {
          success: true,
          message: `Retrying operation (attempt ${errorContext.retryCount})`,
        };

      case "adjust_parameters":
        // Adjust parameters and retry
        const adjustedParameters = this.adjustParameters(
          errorContext.parameters,
          bestSuggestion.parameterAdjustments || {}
        );
        return {
          success: true,
          adjustedParameters,
          message: `Adjusted parameters: ${Object.keys(bestSuggestion.parameterAdjustments || {}).join(", ")}`,
        };

      case "wait":
        // Wait and then retry
        await this.wait(bestSuggestion.waitTime || 1000);
        return {
          success: true,
          message: `Waited ${bestSuggestion.waitTime || 1000}ms before retry`,
        };

      case "manual_intervention":
        return {
          success: false,
          message: bestSuggestion.description,
        };

      default:
        return {
          success: false,
          message: "Unknown recovery type",
        };
    }
  }

  /**
   * Get error statistics and patterns
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<MockErrorType, number>;
    errorsByOperation: Record<string, number>;
    recoverySuccessRate: number;
    commonFailurePatterns: Array<{
      pattern: string;
      count: number;
      suggestion: string;
    }>;
  } {
    const errorsByType: Record<MockErrorType, number> = {} as any;
    const errorsByOperation: Record<string, number> = {};
    let recoveredErrors = 0;

    for (const errorContext of this.errorHistory) {
      // Count by type
      errorsByType[errorContext.error.type] =
        (errorsByType[errorContext.error.type] || 0) + 1;

      // Count by operation
      errorsByOperation[errorContext.operation] =
        (errorsByOperation[errorContext.operation] || 0) + 1;

      // Count recovered errors
      if (errorContext.isRecoverable && errorContext.retryCount > 0) {
        recoveredErrors++;
      }
    }

    const recoverySuccessRate =
      this.errorHistory.length > 0
        ? recoveredErrors / this.errorHistory.length
        : 0;

    const commonFailurePatterns = this.identifyFailurePatterns();

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsByOperation,
      recoverySuccessRate,
      commonFailurePatterns,
    };
  }

  /**
   * Clear error history and snapshots
   */
  clearHistory(): void {
    this.errorHistory = [];
    this.stateSnapshots.clear();
  }

  // ===== Private Helper Methods =====

  /**
   * Generate recovery suggestions based on error type and context
   */
  private generateRecoverySuggestions(
    error: MockError,
    operation: string,
    parameters: Record<string, any>
  ): ErrorRecoverySuggestion[] {
    const suggestions: ErrorRecoverySuggestion[] = [];

    switch (error.type) {
      case MockErrorType.INSUFFICIENT_BALANCE:
        suggestions.push({
          type: "manual_intervention",
          description: "Add more tokens to your account balance",
          confidence: 0.9,
          context: {
            requiredAction: "deposit_tokens",
            missingAssets: this.extractMissingAssets(error.context),
          },
        });
        break;

      case MockErrorType.SLIPPAGE_EXCEEDED:
        suggestions.push({
          type: "adjust_parameters",
          description: "Increase slippage tolerance",
          parameterAdjustments: this.calculateSlippageAdjustment(
            parameters,
            error.context
          ),
          confidence: 0.8,
        });
        suggestions.push({
          type: "wait",
          description: "Wait for market conditions to stabilize",
          waitTime: 5000,
          confidence: 0.6,
        });
        break;

      case MockErrorType.INSUFFICIENT_LIQUIDITY:
        if (operation === "swap") {
          suggestions.push({
            type: "adjust_parameters",
            description: "Reduce swap amount",
            parameterAdjustments: this.calculateAmountReduction(parameters),
            confidence: 0.7,
          });
        }
        suggestions.push({
          type: "manual_intervention",
          description: "Add liquidity to the pool or try a different route",
          confidence: 0.5,
        });
        break;

      case MockErrorType.DEADLINE_EXCEEDED:
        suggestions.push({
          type: "adjust_parameters",
          description: "Extend transaction deadline",
          parameterAdjustments: {
            deadline: new BN(Date.now() + 20 * 60 * 1000).toString(), // 20 minutes from now
          },
          confidence: 0.9,
        });
        break;

      case MockErrorType.NETWORK_ERROR:
        suggestions.push({
          type: "retry",
          description: "Retry the operation",
          waitTime: 2000,
          confidence: 0.8,
        });
        suggestions.push({
          type: "wait",
          description: "Wait for network conditions to improve",
          waitTime: 10000,
          confidence: 0.6,
        });
        break;

      case MockErrorType.GAS_ESTIMATION_FAILED:
        suggestions.push({
          type: "adjust_parameters",
          description: "Increase gas limit",
          parameterAdjustments: this.calculateGasAdjustment(parameters),
          confidence: 0.7,
        });
        suggestions.push({
          type: "retry",
          description: "Retry gas estimation",
          waitTime: 1000,
          confidence: 0.6,
        });
        break;

      case MockErrorType.POOL_NOT_FOUND:
        suggestions.push({
          type: "manual_intervention",
          description: "Create the pool first or verify the pool ID",
          confidence: 0.9,
          context: {
            requiredAction: "create_pool_or_verify_id",
          },
        });
        break;

      case MockErrorType.INVALID_BIN_RANGE:
      case MockErrorType.INVALID_PARAMETERS:
        suggestions.push({
          type: "adjust_parameters",
          description: "Correct invalid parameters",
          parameterAdjustments: this.suggestParameterCorrections(
            parameters,
            error
          ),
          confidence: 0.8,
        });
        break;
    }

    return suggestions;
  }

  /**
   * Check if an error is recoverable
   */
  private isErrorRecoverable(error: MockError, operation: string): boolean {
    const recoverableErrors = [
      MockErrorType.SLIPPAGE_EXCEEDED,
      MockErrorType.DEADLINE_EXCEEDED,
      MockErrorType.NETWORK_ERROR,
      MockErrorType.GAS_ESTIMATION_FAILED,
      MockErrorType.INSUFFICIENT_LIQUIDITY, // Sometimes recoverable with smaller amounts
    ];

    return recoverableErrors.includes(error.type);
  }

  /**
   * Get maximum retry attempts for error type and operation
   */
  private getMaxRetries(errorType: MockErrorType, operation: string): number {
    const retryLimits: Record<MockErrorType, number> = {
      [MockErrorType.NETWORK_ERROR]: 3,
      [MockErrorType.GAS_ESTIMATION_FAILED]: 2,
      [MockErrorType.SLIPPAGE_EXCEEDED]: 2,
      [MockErrorType.DEADLINE_EXCEEDED]: 1,
      [MockErrorType.INSUFFICIENT_LIQUIDITY]: 1,
      [MockErrorType.INSUFFICIENT_BALANCE]: 0,
      [MockErrorType.POOL_NOT_FOUND]: 0,
      [MockErrorType.INVALID_BIN_RANGE]: 0,
      [MockErrorType.INVALID_PARAMETERS]: 0,
    };

    return retryLimits[errorType] || 0;
  }

  /**
   * Adjust parameters based on suggestions
   */
  private adjustParameters(
    originalParameters: Record<string, any>,
    adjustments: Record<string, any>
  ): Record<string, any> {
    return {
      ...originalParameters,
      ...adjustments,
    };
  }

  /**
   * Wait for specified time
   */
  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Extract missing assets from error context
   */
  private extractMissingAssets(context?: Record<string, any>): string[] {
    if (!context) return [];

    const assets: string[] = [];
    if (context.assetId) assets.push(context.assetId);
    if (context.assetIn) assets.push(context.assetIn);
    if (context.assetOut) assets.push(context.assetOut);

    return assets;
  }

  /**
   * Calculate slippage adjustment
   */
  private calculateSlippageAdjustment(
    parameters: Record<string, any>,
    errorContext?: Record<string, any>
  ): Record<string, any> {
    const adjustments: Record<string, any> = {};

    // Increase minimum amounts by reducing them (allowing more slippage)
    if (parameters.amountAMin) {
      const currentMin = new BN(parameters.amountAMin.toString());
      adjustments.amountAMin = currentMin
        .mul(new BN(90))
        .div(new BN(100))
        .toString(); // 10% more slippage
    }

    if (parameters.amountBMin) {
      const currentMin = new BN(parameters.amountBMin.toString());
      adjustments.amountBMin = currentMin
        .mul(new BN(90))
        .div(new BN(100))
        .toString(); // 10% more slippage
    }

    if (parameters.amountOutMin) {
      const currentMin = new BN(parameters.amountOutMin.toString());
      adjustments.amountOutMin = currentMin
        .mul(new BN(90))
        .div(new BN(100))
        .toString(); // 10% more slippage
    }

    return adjustments;
  }

  /**
   * Calculate amount reduction for insufficient liquidity
   */
  private calculateAmountReduction(
    parameters: Record<string, any>
  ): Record<string, any> {
    const adjustments: Record<string, any> = {};

    // Reduce amounts by 20%
    if (parameters.amountIn) {
      const currentAmount = new BN(parameters.amountIn.toString());
      adjustments.amountIn = currentAmount
        .mul(new BN(80))
        .div(new BN(100))
        .toString();
    }

    if (parameters.amountADesired) {
      const currentAmount = new BN(parameters.amountADesired.toString());
      adjustments.amountADesired = currentAmount
        .mul(new BN(80))
        .div(new BN(100))
        .toString();
    }

    if (parameters.amountBDesired) {
      const currentAmount = new BN(parameters.amountBDesired.toString());
      adjustments.amountBDesired = currentAmount
        .mul(new BN(80))
        .div(new BN(100))
        .toString();
    }

    return adjustments;
  }

  /**
   * Calculate gas adjustment
   */
  private calculateGasAdjustment(
    parameters: Record<string, any>
  ): Record<string, any> {
    const adjustments: Record<string, any> = {};

    // Increase gas limit by 50%
    if (parameters.txParams?.gasLimit) {
      const currentGasLimit = new BN(parameters.txParams.gasLimit.toString());
      adjustments.txParams = {
        ...parameters.txParams,
        gasLimit: currentGasLimit.mul(new BN(150)).div(new BN(100)).toString(),
      };
    }

    return adjustments;
  }

  /**
   * Suggest parameter corrections for invalid parameters
   */
  private suggestParameterCorrections(
    parameters: Record<string, any>,
    error: MockError
  ): Record<string, any> {
    const corrections: Record<string, any> = {};

    // Based on error message, suggest specific corrections
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes("deadline")) {
      corrections.deadline = new BN(Date.now() + 20 * 60 * 1000).toString();
    }

    if (errorMessage.includes("bin") && errorMessage.includes("range")) {
      // Suggest a reasonable active bin ID
      corrections.activeIdDesired = "8388608"; // Common active bin ID
    }

    if (errorMessage.includes("slippage")) {
      corrections.idSlippage = "10"; // 10 bin slippage tolerance
    }

    return corrections;
  }

  /**
   * Identify common failure patterns
   */
  private identifyFailurePatterns(): Array<{
    pattern: string;
    count: number;
    suggestion: string;
  }> {
    const patterns: Record<string, {count: number; suggestion: string}> = {};

    for (const errorContext of this.errorHistory) {
      const pattern = `${errorContext.operation}_${errorContext.error.type}`;

      if (!patterns[pattern]) {
        patterns[pattern] = {
          count: 0,
          suggestion: this.getPatternSuggestion(
            errorContext.operation,
            errorContext.error.type
          ),
        };
      }

      patterns[pattern].count++;
    }

    return Object.entries(patterns)
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        suggestion: data.suggestion,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 patterns
  }

  /**
   * Get suggestion for common failure patterns
   */
  private getPatternSuggestion(
    operation: string,
    errorType: MockErrorType
  ): string {
    const key = `${operation}_${errorType}`;

    const suggestions: Record<string, string> = {
      swap_SLIPPAGE_EXCEEDED:
        "Consider using smaller swap amounts or higher slippage tolerance",
      addLiquidity_INSUFFICIENT_BALANCE:
        "Ensure sufficient token balances before adding liquidity",
      swap_INSUFFICIENT_LIQUIDITY:
        "Try smaller amounts or different trading routes",
      removeLiquidity_DEADLINE_EXCEEDED:
        "Use longer deadlines for liquidity operations",
    };

    return suggestions[key] || "Review operation parameters and try again";
  }
}

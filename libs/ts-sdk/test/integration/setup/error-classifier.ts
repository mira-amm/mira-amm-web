/**
 * Error classification system for test infrastructure
 * Distinguishes between infrastructure and application errors
 */

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  INFRASTRUCTURE = "infrastructure",
  APPLICATION = "application",
  UNKNOWN = "unknown",
}

/**
 * Infrastructure error types
 */
export enum InfrastructureErrorType {
  SERVICE_STARTUP = "service_startup",
  SERVICE_HEALTH = "service_health",
  PORT_CONFLICT = "port_conflict",
  TIMEOUT = "timeout",
  WALLET_FUNDING = "wallet_funding",
  BALANCE_INSUFFICIENT = "balance_insufficient",
  NETWORK_CONNECTION = "network_connection",
  CONTRACT_DEPLOYMENT = "contract_deployment",
  INDEXER_SYNC = "indexer_sync",
}

/**
 * Application error types
 */
export enum ApplicationErrorType {
  CONTRACT_CALL = "contract_call",
  BUSINESS_LOGIC = "business_logic",
  VALIDATION = "validation",
  TRANSACTION_FAILED = "transaction_failed",
  SLIPPAGE = "slippage",
  LIQUIDITY = "liquidity",
}

/**
 * Classified error information
 */
export interface ClassifiedError {
  category: ErrorCategory;
  type: InfrastructureErrorType | ApplicationErrorType | string;
  originalError: Error;
  message: string;
  context?: Record<string, any>;
  suggestedFix?: string;
  isRetryable: boolean;
  severity: "low" | "medium" | "high" | "critical";
}

/**
 * Error classification patterns for infrastructure errors
 */
const INFRASTRUCTURE_PATTERNS = [
  // Service startup errors - specific patterns first
  {
    pattern: /port.*already.*in.*use|EADDRINUSE/i,
    type: InfrastructureErrorType.PORT_CONFLICT,
    isRetryable: false,
    severity: "high" as const,
    suggestedFix:
      "Stop existing processes using the port or use 'lsof -ti:{port} | xargs kill -9' to force kill",
  },
  {
    pattern:
      /timeout.*waiting.*for.*services?.*to.*start|service.*startup.*timeout|service.*not.*ready/i,
    type: InfrastructureErrorType.SERVICE_STARTUP,
    isRetryable: true,
    severity: "high" as const,
    suggestedFix:
      "Check service logs and ensure all dependencies are available",
  },
  {
    pattern: /fuel.*node.*not.*responding/i,
    type: InfrastructureErrorType.SERVICE_HEALTH,
    isRetryable: true,
    severity: "critical" as const,
    suggestedFix: "Restart the Fuel node service",
  },
  {
    pattern: /indexer.*not.*responding/i,
    type: InfrastructureErrorType.SERVICE_HEALTH,
    isRetryable: true,
    severity: "high" as const,
    suggestedFix: "Restart the indexer service and wait for synchronization",
  },

  // Network and connection errors
  {
    pattern: /ECONNREFUSED|connection.*refused/i,
    type: InfrastructureErrorType.NETWORK_CONNECTION,
    isRetryable: true,
    severity: "high" as const,
    suggestedFix:
      "Ensure services are running and accessible on the expected ports",
  },
  {
    pattern: /ENOTFOUND|DNS.*resolution.*failed/i,
    type: InfrastructureErrorType.NETWORK_CONNECTION,
    isRetryable: false,
    severity: "medium" as const,
    suggestedFix: "Check network configuration and service URLs",
  },

  // Wallet and funding errors - specific patterns
  {
    pattern: /insufficient.*balance.*for.*transfer/i,
    type: InfrastructureErrorType.BALANCE_INSUFFICIENT,
    isRetryable: false,
    severity: "medium" as const,
    suggestedFix: "Fund the master wallet or reduce funding amounts",
  },
  {
    pattern: /wallet.*funding.*failed|transfer.*failed/i,
    type: InfrastructureErrorType.WALLET_FUNDING,
    isRetryable: true,
    severity: "medium" as const,
    suggestedFix: "Check wallet balances and retry with smaller amounts",
  },

  // Contract and deployment errors
  {
    pattern: /contract.*deployment.*failed/i,
    type: InfrastructureErrorType.CONTRACT_DEPLOYMENT,
    isRetryable: true,
    severity: "high" as const,
    suggestedFix: "Redeploy contracts or check deployment configuration",
  },
  {
    pattern: /indexer.*synchronization.*failed/i,
    type: InfrastructureErrorType.INDEXER_SYNC,
    isRetryable: true,
    severity: "medium" as const,
    suggestedFix: "Wait for indexer to synchronize or restart indexer service",
  },

  // Generic timeout - must be last to avoid overriding specific patterns
  {
    pattern: /connection.*timeout|operation.*timed.*out/i,
    type: InfrastructureErrorType.TIMEOUT,
    isRetryable: true,
    severity: "medium" as const,
    suggestedFix: "Increase timeout values or check service performance",
  },
];

/**
 * Error classification patterns for application errors
 */
const APPLICATION_PATTERNS = [
  // Contract execution errors
  {
    pattern: /revert|execution.*failed|contract.*call.*failed/i,
    type: ApplicationErrorType.CONTRACT_CALL,
    isRetryable: false,
    severity: "medium" as const,
    suggestedFix: "Check contract parameters and state requirements",
  },
  {
    pattern: /transaction.*failed|tx.*failed/i,
    type: ApplicationErrorType.TRANSACTION_FAILED,
    isRetryable: true,
    severity: "medium" as const,
    suggestedFix: "Check transaction parameters and gas settings",
  },

  // Business logic errors
  {
    pattern: /slippage.*exceeded|price.*impact/i,
    type: ApplicationErrorType.SLIPPAGE,
    isRetryable: true,
    severity: "low" as const,
    suggestedFix: "Adjust slippage tolerance or trade smaller amounts",
  },
  {
    pattern: /insufficient.*liquidity|liquidity.*too.*low/i,
    type: ApplicationErrorType.LIQUIDITY,
    isRetryable: false,
    severity: "medium" as const,
    suggestedFix: "Add liquidity to the pool or use a different trading pair",
  },
  {
    pattern: /validation.*failed|invalid.*parameter/i,
    type: ApplicationErrorType.VALIDATION,
    isRetryable: false,
    severity: "low" as const,
    suggestedFix: "Check input parameters and validation requirements",
  },
];

/**
 * Error classifier for test infrastructure
 */
export class ErrorClassifier {
  /**
   * Classify an error into infrastructure or application category
   */
  static classify(
    error: Error,
    context?: Record<string, any>
  ): ClassifiedError {
    const errorMessage = error.message || error.toString();
    const errorStack = error.stack || "";
    const fullErrorText = `${errorMessage} ${errorStack}`;

    // Check infrastructure patterns first
    for (const pattern of INFRASTRUCTURE_PATTERNS) {
      if (pattern.pattern.test(fullErrorText)) {
        return {
          category: ErrorCategory.INFRASTRUCTURE,
          type: pattern.type,
          originalError: error,
          message: errorMessage,
          context,
          suggestedFix: pattern.suggestedFix,
          isRetryable: pattern.isRetryable,
          severity: pattern.severity,
        };
      }
    }

    // Check application patterns
    for (const pattern of APPLICATION_PATTERNS) {
      if (pattern.pattern.test(fullErrorText)) {
        return {
          category: ErrorCategory.APPLICATION,
          type: pattern.type,
          originalError: error,
          message: errorMessage,
          context,
          suggestedFix: pattern.suggestedFix,
          isRetryable: pattern.isRetryable,
          severity: pattern.severity,
        };
      }
    }

    // Default to unknown category
    return {
      category: ErrorCategory.UNKNOWN,
      type: "unknown",
      originalError: error,
      message: errorMessage,
      context,
      isRetryable: false,
      severity: "medium",
    };
  }

  /**
   * Check if an error is infrastructure-related
   */
  static isInfrastructureError(error: Error): boolean {
    const classified = this.classify(error);
    return classified.category === ErrorCategory.INFRASTRUCTURE;
  }

  /**
   * Check if an error is application-related
   */
  static isApplicationError(error: Error): boolean {
    const classified = this.classify(error);
    return classified.category === ErrorCategory.APPLICATION;
  }

  /**
   * Check if an error is retryable
   */
  static isRetryable(error: Error): boolean {
    const classified = this.classify(error);
    return classified.isRetryable;
  }

  /**
   * Get suggested fix for an error
   */
  static getSuggestedFix(error: Error): string | undefined {
    const classified = this.classify(error);
    return classified.suggestedFix;
  }

  /**
   * Get error severity
   */
  static getSeverity(error: Error): "low" | "medium" | "high" | "critical" {
    const classified = this.classify(error);
    return classified.severity;
  }

  /**
   * Create a detailed error report
   */
  static createErrorReport(
    error: Error,
    context?: Record<string, any>
  ): string {
    const classified = this.classify(error, context);

    let report = `🚨 Error Classification Report\n`;
    report += `Category: ${classified.category.toUpperCase()}\n`;
    report += `Type: ${classified.type}\n`;
    report += `Severity: ${classified.severity.toUpperCase()}\n`;
    report += `Retryable: ${classified.isRetryable ? "Yes" : "No"}\n`;
    report += `Message: ${classified.message}\n`;

    if (classified.suggestedFix) {
      report += `\n💡 Suggested Fix:\n${classified.suggestedFix}\n`;
    }

    if (classified.context && Object.keys(classified.context).length > 0) {
      report += `\n📊 Context:\n`;
      for (const [key, value] of Object.entries(classified.context)) {
        report += `  ${key}: ${JSON.stringify(value)}\n`;
      }
    }

    return report;
  }

  /**
   * Handle error with appropriate response based on classification
   */
  static handleError(
    error: Error,
    context?: Record<string, any>
  ): {
    shouldRetry: boolean;
    shouldFail: boolean;
    message: string;
    actions: string[];
  } {
    const classified = this.classify(error, context);
    const actions: string[] = [];

    // Determine actions based on error type
    if (classified.category === ErrorCategory.INFRASTRUCTURE) {
      if (classified.type === InfrastructureErrorType.SERVICE_STARTUP) {
        actions.push("Check service logs");
        actions.push("Verify port availability");
        actions.push("Ensure dependencies are installed");
      } else if (classified.type === InfrastructureErrorType.WALLET_FUNDING) {
        actions.push("Check master wallet balance");
        actions.push("Reduce funding amounts");
        actions.push("Retry with exponential backoff");
      } else if (classified.type === InfrastructureErrorType.TIMEOUT) {
        actions.push("Increase timeout values");
        actions.push("Check service performance");
        actions.push("Verify network connectivity");
      }
    } else if (classified.category === ErrorCategory.APPLICATION) {
      if (classified.type === ApplicationErrorType.CONTRACT_CALL) {
        actions.push("Verify contract parameters");
        actions.push("Check contract state");
        actions.push("Review transaction gas settings");
      } else if (classified.type === ApplicationErrorType.SLIPPAGE) {
        actions.push("Increase slippage tolerance");
        actions.push("Reduce trade size");
        actions.push("Check market conditions");
      }
    }

    // Add suggested fix as an action if available
    if (classified.suggestedFix) {
      actions.push(classified.suggestedFix);
    }

    return {
      shouldRetry: classified.isRetryable,
      shouldFail: classified.severity === "critical",
      message: this.createErrorReport(error, context),
      actions,
    };
  }
}

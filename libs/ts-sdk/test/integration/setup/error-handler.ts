import {
  ErrorClassifier,
  ClassifiedError,
  ErrorCategory,
  InfrastructureErrorType,
} from "./error-classifier";

/**
 * Enhanced error handler with helpful messages and recovery suggestions
 */
export class ErrorHandler {
  /**
   * Format an error with helpful context and suggested fixes
   */
  static formatError(
    error: Error,
    context?: Record<string, any>,
    operation?: string
  ): string {
    const classified = ErrorClassifier.classify(error, context);
    const timestamp = new Date().toISOString();

    let message = `\n${"=".repeat(80)}\n`;
    message += `🚨 TEST INFRASTRUCTURE ERROR\n`;
    message += `Time: ${timestamp}\n`;

    if (operation) {
      message += `Operation: ${operation}\n`;
    }

    message += `${"=".repeat(80)}\n\n`;

    // Error classification section
    message += `📋 ERROR CLASSIFICATION\n`;
    message += `Category: ${this.getCategoryIcon(classified.category)} ${classified.category.toUpperCase()}\n`;
    message += `Type: ${classified.type}\n`;
    message += `Severity: ${this.getSeverityIcon(classified.severity)} ${classified.severity.toUpperCase()}\n`;
    message += `Retryable: ${classified.isRetryable ? "✅ Yes" : "❌ No"}\n\n`;

    // Original error section
    message += `💥 ERROR DETAILS\n`;
    message += `Message: ${classified.message}\n`;

    if (error.stack) {
      const stackLines = error.stack.split("\n").slice(0, 5); // First 5 lines
      message += `Stack: ${stackLines.join("\n       ")}\n`;
    }
    message += `\n`;

    // Context section
    if (classified.context && Object.keys(classified.context).length > 0) {
      message += `📊 CONTEXT INFORMATION\n`;
      for (const [key, value] of Object.entries(classified.context)) {
        message += `${key}: ${this.formatContextValue(value)}\n`;
      }
      message += `\n`;
    }

    // Diagnostic information section
    message += this.getDiagnosticInfo(classified);

    // Suggested fixes section
    message += `💡 SUGGESTED FIXES\n`;
    const fixes = this.getSuggestedFixes(classified);
    fixes.forEach((fix, index) => {
      message += `${index + 1}. ${fix}\n`;
    });
    message += `\n`;

    // Next steps section
    message += `🔧 NEXT STEPS\n`;
    const nextSteps = this.getNextSteps(classified);
    nextSteps.forEach((step, index) => {
      message += `${index + 1}. ${step}\n`;
    });

    message += `\n${"=".repeat(80)}\n`;

    return message;
  }

  /**
   * Get category icon for visual identification
   */
  private static getCategoryIcon(category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.INFRASTRUCTURE:
        return "🏗️";
      case ErrorCategory.APPLICATION:
        return "🔧";
      default:
        return "❓";
    }
  }

  /**
   * Get severity icon for visual identification
   */
  private static getSeverityIcon(severity: string): string {
    switch (severity) {
      case "critical":
        return "🔴";
      case "high":
        return "🟠";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  }

  /**
   * Format context values for display
   */
  private static formatContextValue(value: any): string {
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  /**
   * Get diagnostic information based on error type
   */
  private static getDiagnosticInfo(classified: ClassifiedError): string {
    let info = `🔍 DIAGNOSTIC INFORMATION\n`;

    if (classified.category === ErrorCategory.INFRASTRUCTURE) {
      switch (classified.type) {
        case InfrastructureErrorType.PORT_CONFLICT:
          info += this.getPortDiagnostics(classified);
          break;
        case InfrastructureErrorType.SERVICE_STARTUP:
          info += this.getServiceDiagnostics(classified);
          break;
        case InfrastructureErrorType.WALLET_FUNDING:
          info += this.getWalletDiagnostics(classified);
          break;
        case InfrastructureErrorType.TIMEOUT:
          info += this.getTimeoutDiagnostics(classified);
          break;
        default:
          info += `No specific diagnostics available for ${classified.type}\n`;
      }
    } else {
      info += `Application errors typically require reviewing business logic and contract state\n`;
    }

    return info + `\n`;
  }

  /**
   * Get port-specific diagnostic information
   */
  private static getPortDiagnostics(classified: ClassifiedError): string {
    let info = `Port conflict detected. Common causes:\n`;
    info += `• Another instance of the service is already running\n`;
    info += `• Previous service shutdown was not clean\n`;
    info += `• Different application is using the same port\n\n`;

    info += `To diagnose:\n`;
    info += `• Run: lsof -i :4000 (for Fuel node)\n`;
    info += `• Run: lsof -i :4350 (for indexer)\n`;
    info += `• Check process list: ps aux | grep fuel\n`;

    return info;
  }

  /**
   * Get service-specific diagnostic information
   */
  private static getServiceDiagnostics(classified: ClassifiedError): string {
    let info = `Service startup failure. Common causes:\n`;
    info += `• Missing dependencies or configuration\n`;
    info += `• Insufficient system resources\n`;
    info += `• Network connectivity issues\n`;
    info += `• Permission problems\n\n`;

    info += `To diagnose:\n`;
    info += `• Check service logs in terminal output\n`;
    info += `• Verify pnpm and nx are installed\n`;
    info += `• Ensure you're in the correct workspace directory\n`;
    info += `• Check available disk space and memory\n`;

    return info;
  }

  /**
   * Get wallet-specific diagnostic information
   */
  private static getWalletDiagnostics(classified: ClassifiedError): string {
    let info = `Wallet funding failure. Common causes:\n`;
    info += `• Insufficient master wallet balance\n`;
    info += `• Network congestion or high gas fees\n`;
    info += `• UTXO conflicts from concurrent transactions\n`;
    info += `• Node synchronization issues\n\n`;

    info += `To diagnose:\n`;
    info += `• Check master wallet balance\n`;
    info += `• Verify node is fully synchronized\n`;
    info += `• Look for transaction conflicts in logs\n`;
    info += `• Check network status and gas prices\n`;

    return info;
  }

  /**
   * Get timeout-specific diagnostic information
   */
  private static getTimeoutDiagnostics(classified: ClassifiedError): string {
    let info = `Timeout occurred. Common causes:\n`;
    info += `• Service taking longer than expected to start\n`;
    info += `• Network latency or connectivity issues\n`;
    info += `• System resource constraints\n`;
    info += `• Configuration problems\n\n`;

    info += `To diagnose:\n`;
    info += `• Check system resource usage (CPU, memory, disk)\n`;
    info += `• Verify network connectivity\n`;
    info += `• Review service startup logs\n`;
    info += `• Consider increasing timeout values\n`;

    return info;
  }

  /**
   * Get suggested fixes based on error classification
   */
  private static getSuggestedFixes(classified: ClassifiedError): string[] {
    const fixes: string[] = [];

    // Add the primary suggested fix if available
    if (classified.suggestedFix) {
      fixes.push(classified.suggestedFix);
    }

    // Add specific fixes based on error type
    if (classified.category === ErrorCategory.INFRASTRUCTURE) {
      switch (classified.type) {
        case InfrastructureErrorType.PORT_CONFLICT:
          fixes.push("Kill existing processes: lsof -ti:4000 | xargs kill -9");
          fixes.push("Use different ports in configuration");
          fixes.push("Restart your development environment");
          break;

        case InfrastructureErrorType.SERVICE_STARTUP:
          fixes.push("Run 'pnpm install' to ensure dependencies are installed");
          fixes.push("Try starting services manually: pnpm nx dev indexer");
          fixes.push("Check if you're in the correct workspace directory");
          fixes.push("Restart your terminal and try again");
          break;

        case InfrastructureErrorType.WALLET_FUNDING:
          fixes.push(
            "Reduce wallet funding amounts (use 0.1 ETH instead of 10 ETH)"
          );
          fixes.push("Add delay between wallet creation operations");
          fixes.push("Check master wallet has sufficient balance");
          fixes.push("Retry with exponential backoff");
          break;

        case InfrastructureErrorType.BALANCE_INSUFFICIENT:
          fixes.push("Fund the master wallet with more ETH");
          fixes.push("Reduce the amounts being transferred");
          fixes.push("Use smaller test amounts for development");
          break;

        case InfrastructureErrorType.TIMEOUT:
          fixes.push("Increase timeout values in configuration");
          fixes.push("Check system performance and free up resources");
          fixes.push("Verify network connectivity");
          fixes.push("Wait longer and retry the operation");
          break;

        case InfrastructureErrorType.NETWORK_CONNECTION:
          fixes.push("Verify services are running on expected ports");
          fixes.push("Check firewall and network configuration");
          fixes.push("Restart network services");
          fixes.push("Use localhost instead of 127.0.0.1 or vice versa");
          break;
      }
    } else if (classified.category === ErrorCategory.APPLICATION) {
      fixes.push("Review contract parameters and state requirements");
      fixes.push("Check transaction gas settings and limits");
      fixes.push("Verify input validation and business logic");
      fixes.push("Consult application documentation for specific error codes");
    }

    // Add generic fixes if no specific ones were added
    if (fixes.length === 0) {
      fixes.push("Review error message and stack trace for clues");
      fixes.push("Check recent changes that might have caused the issue");
      fixes.push("Consult documentation or seek help from team members");
    }

    return fixes;
  }

  /**
   * Get next steps based on error classification
   */
  private static getNextSteps(classified: ClassifiedError): string[] {
    const steps: string[] = [];

    if (classified.isRetryable) {
      steps.push("Retry the operation after applying suggested fixes");
      if (classified.category === ErrorCategory.INFRASTRUCTURE) {
        steps.push("If retry fails, restart the entire test environment");
      }
    } else {
      steps.push("Fix the underlying issue before retrying");
    }

    if (classified.severity === "critical") {
      steps.push("Stop current test execution and fix critical issues first");
      steps.push("Verify system health before continuing");
    } else if (classified.severity === "high") {
      steps.push("Address this issue promptly to prevent test failures");
    }

    // Add category-specific next steps
    if (classified.category === ErrorCategory.INFRASTRUCTURE) {
      steps.push("Check infrastructure health: services, ports, balances");
      steps.push("Review test environment setup and configuration");
    } else if (classified.category === ErrorCategory.APPLICATION) {
      steps.push("Review application logic and contract interactions");
      steps.push("Verify test data and expected behaviors");
    }

    steps.push("Document the issue if it persists for team investigation");

    return steps;
  }

  /**
   * Create a concise error summary for logging
   */
  static createErrorSummary(
    error: Error,
    context?: Record<string, any>
  ): string {
    const classified = ErrorClassifier.classify(error, context);

    return (
      `[${classified.category.toUpperCase()}] ${classified.type}: ${classified.message}` +
      (classified.suggestedFix ? ` | Fix: ${classified.suggestedFix}` : "")
    );
  }

  /**
   * Check if error should cause immediate test failure
   */
  static shouldFailImmediately(error: Error): boolean {
    const classified = ErrorClassifier.classify(error);
    return (
      classified.severity === "critical" ||
      (classified.category === ErrorCategory.INFRASTRUCTURE &&
        !classified.isRetryable)
    );
  }

  /**
   * Get retry strategy for an error
   */
  static getRetryStrategy(error: Error): {
    shouldRetry: boolean;
    maxRetries: number;
    baseDelay: number;
    backoffMultiplier: number;
  } {
    const classified = ErrorClassifier.classify(error);

    if (!classified.isRetryable) {
      return {
        shouldRetry: false,
        maxRetries: 0,
        baseDelay: 0,
        backoffMultiplier: 1,
      };
    }

    // Different retry strategies based on error type
    switch (classified.type) {
      case InfrastructureErrorType.WALLET_FUNDING:
        return {
          shouldRetry: true,
          maxRetries: 3,
          baseDelay: 1000,
          backoffMultiplier: 2,
        };

      case InfrastructureErrorType.SERVICE_STARTUP:
        return {
          shouldRetry: true,
          maxRetries: 2,
          baseDelay: 5000,
          backoffMultiplier: 1.5,
        };

      case InfrastructureErrorType.TIMEOUT:
        return {
          shouldRetry: true,
          maxRetries: 2,
          baseDelay: 2000,
          backoffMultiplier: 2,
        };

      case InfrastructureErrorType.NETWORK_CONNECTION:
        return {
          shouldRetry: true,
          maxRetries: 3,
          baseDelay: 1000,
          backoffMultiplier: 1.5,
        };

      default:
        return {
          shouldRetry: true,
          maxRetries: 2,
          baseDelay: 1000,
          backoffMultiplier: 2,
        };
    }
  }

  /**
   * Handle error with full context and recovery suggestions
   */
  static handleErrorWithRecovery(
    error: Error,
    context?: Record<string, any>,
    operation?: string
  ): {
    formattedError: string;
    summary: string;
    shouldRetry: boolean;
    shouldFail: boolean;
    retryStrategy: ReturnType<typeof ErrorHandler.getRetryStrategy>;
  } {
    const formattedError = this.formatError(error, context, operation);
    const summary = this.createErrorSummary(error, context);
    const shouldFail = this.shouldFailImmediately(error);
    const retryStrategy = this.getRetryStrategy(error);

    return {
      formattedError,
      summary,
      shouldRetry: retryStrategy.shouldRetry,
      shouldFail,
      retryStrategy,
    };
  }
}

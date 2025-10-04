import * as fs from "fs";
import * as path from "path";
import {
  ErrorClassifier,
  ErrorCategory,
  InfrastructureErrorType,
} from "./error-classifier";

/**
 * Log levels for diagnostic information
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * Diagnostic log entry
 */
export interface DiagnosticLogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  operation: string;
  message: string;
  context?: Record<string, any>;
  duration?: number;
  error?: Error;
}

/**
 * Service log capture configuration
 */
export interface ServiceLogConfig {
  serviceName: string;
  logFile?: string;
  maxLines?: number;
  includeTimestamp?: boolean;
}

/**
 * Diagnostic logger for test infrastructure
 */
export class DiagnosticLogger {
  private static instance: DiagnosticLogger;
  private logs: DiagnosticLogEntry[] = [];
  private logFile?: string;
  private maxLogEntries: number = 1000;
  private startTime: number = Date.now();

  private constructor() {
    // Setup log file in temp directory
    const tempDir = path.join(__dirname, "../../../.temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, {recursive: true});
    }
    this.logFile = path.join(tempDir, `diagnostic-${Date.now()}.log`);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DiagnosticLogger {
    if (!DiagnosticLogger.instance) {
      DiagnosticLogger.instance = new DiagnosticLogger();
    }
    return DiagnosticLogger.instance;
  }

  /**
   * Log diagnostic information
   */
  log(
    level: LogLevel,
    category: string,
    operation: string,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    const entry: DiagnosticLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      operation,
      message,
      context,
      error,
    };

    // Add to memory logs
    this.logs.push(entry);

    // Trim logs if too many
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    // Write to file if configured
    if (this.logFile) {
      this.writeToFile(entry);
    }

    // Console output for important logs
    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      console.error(`[${level.toUpperCase()}] ${category}: ${message}`);
      if (context) {
        console.error("Context:", JSON.stringify(context, null, 2));
      }
    } else if (level === LogLevel.WARN) {
      console.warn(`[${level.toUpperCase()}] ${category}: ${message}`);
    }
  }

  /**
   * Log service startup attempt
   */
  logServiceStartup(serviceName: string, config?: Record<string, any>): void {
    this.log(
      LogLevel.INFO,
      "SERVICE_STARTUP",
      `start_${serviceName}`,
      `Starting ${serviceName} service`,
      {serviceName, config, startTime: Date.now()}
    );
  }

  /**
   * Log service startup success
   */
  logServiceStartupSuccess(
    serviceName: string,
    duration: number,
    details?: Record<string, any>
  ): void {
    this.log(
      LogLevel.INFO,
      "SERVICE_STARTUP",
      `start_${serviceName}_success`,
      `${serviceName} service started successfully`,
      {serviceName, duration, ...details}
    );
  }

  /**
   * Log service startup failure with detailed diagnostics
   */
  logServiceStartupFailure(
    serviceName: string,
    error: Error,
    duration: number,
    diagnostics?: Record<string, any>
  ): void {
    const classified = ErrorClassifier.classify(error);

    // Capture service logs if available
    const serviceLogs = this.captureServiceLogs(serviceName);

    this.log(
      LogLevel.ERROR,
      "SERVICE_STARTUP",
      `start_${serviceName}_failure`,
      `${serviceName} service startup failed: ${error.message}`,
      {
        serviceName,
        duration,
        errorType: classified.type,
        errorCategory: classified.category,
        serviceLogs,
        ...diagnostics,
      },
      error
    );
  }

  /**
   * Log wallet operation attempt
   */
  logWalletOperation(
    operation: string,
    walletInfo: Record<string, any>,
    details?: Record<string, any>
  ): void {
    this.log(
      LogLevel.INFO,
      "WALLET_OPERATION",
      operation,
      `Wallet operation: ${operation}`,
      {walletInfo, ...details, startTime: Date.now()}
    );
  }

  /**
   * Log wallet funding attempt with balance information
   */
  logWalletFunding(
    walletAddress: string,
    amount: string,
    masterWalletBalance?: string,
    tokenBalances?: Record<string, string>
  ): void {
    this.log(
      LogLevel.INFO,
      "WALLET_FUNDING",
      "fund_wallet",
      `Funding wallet ${walletAddress} with ${amount}`,
      {
        walletAddress,
        amount,
        masterWalletBalance,
        tokenBalances,
        timestamp: Date.now(),
      }
    );
  }

  /**
   * Log wallet funding failure with detailed balance and transaction info
   */
  logWalletFundingFailure(
    walletAddress: string,
    amount: string,
    error: Error,
    balanceInfo?: Record<string, any>,
    transactionDetails?: Record<string, any>
  ): void {
    const classified = ErrorClassifier.classify(error);

    this.log(
      LogLevel.ERROR,
      "WALLET_FUNDING",
      "fund_wallet_failure",
      `Wallet funding failed for ${walletAddress}: ${error.message}`,
      {
        walletAddress,
        requestedAmount: amount,
        errorType: classified.type,
        errorCategory: classified.category,
        balanceInfo,
        transactionDetails,
        suggestedFix: classified.suggestedFix,
      },
      error
    );
  }

  /**
   * Log timeout occurrence with timing information
   */
  logTimeout(
    operation: string,
    timeoutValue: number,
    actualDuration: number,
    context?: Record<string, any>
  ): void {
    this.log(
      LogLevel.WARN,
      "TIMEOUT",
      operation,
      `Operation timed out after ${actualDuration}ms (limit: ${timeoutValue}ms)`,
      {
        operation,
        timeoutValue,
        actualDuration,
        overrun: actualDuration - timeoutValue,
        ...context,
      }
    );
  }

  /**
   * Log health check attempt
   */
  logHealthCheck(
    serviceName: string,
    url: string,
    timeout: number,
    startTime: number = Date.now()
  ): void {
    this.log(
      LogLevel.DEBUG,
      "HEALTH_CHECK",
      `health_${serviceName}`,
      `Health check for ${serviceName}`,
      {serviceName, url, timeout, startTime}
    );
  }

  /**
   * Log health check result
   */
  logHealthCheckResult(
    serviceName: string,
    success: boolean,
    duration: number,
    response?: any,
    error?: Error
  ): void {
    const level = success ? LogLevel.DEBUG : LogLevel.WARN;
    const message = success
      ? `Health check passed for ${serviceName}`
      : `Health check failed for ${serviceName}`;

    this.log(
      level,
      "HEALTH_CHECK",
      `health_${serviceName}_result`,
      message,
      {
        serviceName,
        success,
        duration,
        response: success ? "OK" : response,
        errorMessage: error?.message,
      },
      error
    );
  }

  /**
   * Capture service logs from stdout/stderr
   */
  private captureServiceLogs(
    serviceName: string,
    maxLines: number = 50
  ): string[] {
    // This is a simplified implementation - in a real scenario,
    // you might capture logs from actual service log files or process output
    const logs: string[] = [];

    try {
      // Try to read from common log locations
      const possibleLogPaths = [
        `/tmp/${serviceName}.log`,
        `./logs/${serviceName}.log`,
        `./apps/indexer/logs/${serviceName}.log`,
      ];

      for (const logPath of possibleLogPaths) {
        if (fs.existsSync(logPath)) {
          const content = fs.readFileSync(logPath, "utf8");
          const lines = content.split("\n").slice(-maxLines);
          logs.push(...lines.filter((line) => line.trim()));
          break;
        }
      }

      // If no log files found, return placeholder
      if (logs.length === 0) {
        logs.push(`No log files found for ${serviceName}`);
        logs.push("Check console output for service logs");
      }
    } catch (error) {
      logs.push(`Error reading logs for ${serviceName}: ${error.message}`);
    }

    return logs;
  }

  /**
   * Write log entry to file
   */
  private writeToFile(entry: DiagnosticLogEntry): void {
    if (!this.logFile) return;

    try {
      const logLine = JSON.stringify(entry) + "\n";
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: string): DiagnosticLogEntry[] {
    return this.logs.filter((log) => log.category === category);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): DiagnosticLogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get recent logs (last N entries)
   */
  getRecentLogs(count: number = 50): DiagnosticLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get error logs with context
   */
  getErrorLogs(): DiagnosticLogEntry[] {
    return this.logs.filter(
      (log) => log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL
    );
  }

  /**
   * Generate diagnostic report
   */
  generateDiagnosticReport(): string {
    const errorLogs = this.getErrorLogs();
    const serviceStartupLogs = this.getLogsByCategory("SERVICE_STARTUP");
    const walletLogs = this.getLogsByCategory("WALLET_FUNDING");
    const timeoutLogs = this.getLogsByCategory("TIMEOUT");

    let report = `\n${"=".repeat(80)}\n`;
    report += `📊 DIAGNOSTIC REPORT\n`;
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Session Duration: ${Date.now() - this.startTime}ms\n`;
    report += `Total Log Entries: ${this.logs.length}\n`;
    report += `${"=".repeat(80)}\n\n`;

    // Error summary
    report += `🚨 ERROR SUMMARY\n`;
    report += `Total Errors: ${errorLogs.length}\n`;
    if (errorLogs.length > 0) {
      const errorsByCategory = errorLogs.reduce(
        (acc, log) => {
          const category = log.context?.errorCategory || "unknown";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      for (const [category, count] of Object.entries(errorsByCategory)) {
        report += `  ${category}: ${count}\n`;
      }
    }
    report += `\n`;

    // Service startup analysis
    report += `🚀 SERVICE STARTUP ANALYSIS\n`;
    const startupFailures = serviceStartupLogs.filter((log) =>
      log.operation.includes("failure")
    );
    report += `Startup Attempts: ${serviceStartupLogs.length}\n`;
    report += `Startup Failures: ${startupFailures.length}\n`;

    if (startupFailures.length > 0) {
      report += `Recent Startup Failures:\n`;
      startupFailures.slice(-3).forEach((log) => {
        report += `  - ${log.timestamp}: ${log.message}\n`;
        if (log.context?.duration) {
          report += `    Duration: ${log.context.duration}ms\n`;
        }
      });
    }
    report += `\n`;

    // Wallet operation analysis
    report += `💰 WALLET OPERATION ANALYSIS\n`;
    const walletFailures = walletLogs.filter((log) =>
      log.operation.includes("failure")
    );
    report += `Wallet Operations: ${walletLogs.length}\n`;
    report += `Wallet Failures: ${walletFailures.length}\n`;

    if (walletFailures.length > 0) {
      report += `Recent Wallet Failures:\n`;
      walletFailures.slice(-3).forEach((log) => {
        report += `  - ${log.timestamp}: ${log.message}\n`;
        if (log.context?.requestedAmount) {
          report += `    Amount: ${log.context.requestedAmount}\n`;
        }
      });
    }
    report += `\n`;

    // Timeout analysis
    report += `⏱️ TIMEOUT ANALYSIS\n`;
    report += `Timeout Events: ${timeoutLogs.length}\n`;

    if (timeoutLogs.length > 0) {
      const avgOverrun =
        timeoutLogs.reduce((sum, log) => sum + (log.context?.overrun || 0), 0) /
        timeoutLogs.length;

      report += `Average Timeout Overrun: ${Math.round(avgOverrun)}ms\n`;
      report += `Recent Timeouts:\n`;
      timeoutLogs.slice(-3).forEach((log) => {
        report += `  - ${log.operation}: ${log.context?.overrun}ms overrun\n`;
      });
    }
    report += `\n`;

    // Recent critical events
    const criticalLogs = this.logs
      .filter(
        (log) => log.level === LogLevel.CRITICAL || log.level === LogLevel.ERROR
      )
      .slice(-5);

    if (criticalLogs.length > 0) {
      report += `🔴 RECENT CRITICAL EVENTS\n`;
      criticalLogs.forEach((log) => {
        report += `${log.timestamp} [${log.level.toUpperCase()}] ${log.category}: ${log.message}\n`;
      });
      report += `\n`;
    }

    report += `${"=".repeat(80)}\n`;

    return report;
  }

  /**
   * Export logs to file
   */
  exportLogs(filePath?: string): string {
    const exportPath =
      filePath ||
      path.join(__dirname, "../../../.temp", `logs-export-${Date.now()}.json`);

    const exportData = {
      metadata: {
        exportTime: new Date().toISOString(),
        sessionDuration: Date.now() - this.startTime,
        totalEntries: this.logs.length,
      },
      logs: this.logs,
      diagnosticReport: this.generateDiagnosticReport(),
    };

    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    return exportPath;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    console.log("Diagnostic logs cleared");
  }

  /**
   * Get log file path
   */
  getLogFilePath(): string | undefined {
    return this.logFile;
  }

  /**
   * Set maximum log entries to keep in memory
   */
  setMaxLogEntries(max: number): void {
    this.maxLogEntries = max;
    if (this.logs.length > max) {
      this.logs = this.logs.slice(-max);
    }
  }
}

// Singleton instance for easy access
export const diagnosticLogger = DiagnosticLogger.getInstance();

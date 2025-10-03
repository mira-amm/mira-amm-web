import {WalletUnlocked, Provider} from "fuels";
import * as fs from "fs";
import * as path from "path";

/**
 * Cleanup operation result
 */
export interface CleanupResult {
  operation: string;
  success: boolean;
  error?: string;
  details?: any;
}

/**
 * Test data cleanup configuration
 */
export interface CleanupConfig {
  cleanupWallets: boolean;
  cleanupTempFiles: boolean;
  cleanupLogs: boolean;
  cleanupTestData: boolean;
  preserveContracts: boolean;
}

/**
 * Cleanup manager for test data and environment teardown
 */
export class CleanupManager {
  private provider: Provider;
  private createdWallets: Set<string> = new Set();
  private tempFiles: Set<string> = new Set();
  private testDataPaths: Set<string> = new Set();
  private cleanupOperations: Array<() => Promise<CleanupResult>> = [];

  constructor(provider: Provider) {
    this.provider = provider;
    this.setupCleanupHandlers();
  }

  /**
   * Setup cleanup handlers for process exit
   */
  private setupCleanupHandlers(): void {
    const cleanup = async () => {
      console.log(
        "🧹 CleanupManager: Process exit detected, performing cleanup..."
      );
      await this.performCleanup({
        cleanupWallets: false, // Don't cleanup wallets on exit (they're just test wallets)
        cleanupTempFiles: true,
        cleanupLogs: false, // Preserve logs for debugging
        cleanupTestData: true,
        preserveContracts: true,
      });
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("beforeExit", cleanup);
  }

  /**
   * Register a wallet for cleanup tracking
   */
  registerWallet(wallet: WalletUnlocked): void {
    this.createdWallets.add(wallet.address.toB256());
    console.log(
      `📝 CleanupManager: Registered wallet ${wallet.address.toB256().slice(0, 10)}... for cleanup`
    );
  }

  /**
   * Register a temporary file for cleanup
   */
  registerTempFile(filePath: string): void {
    this.tempFiles.add(filePath);
    console.log(
      `📝 CleanupManager: Registered temp file ${filePath} for cleanup`
    );
  }

  /**
   * Register test data path for cleanup
   */
  registerTestData(dataPath: string): void {
    this.testDataPaths.add(dataPath);
    console.log(
      `📝 CleanupManager: Registered test data ${dataPath} for cleanup`
    );
  }

  /**
   * Register a custom cleanup operation
   */
  registerCleanupOperation(name: string, operation: () => Promise<void>): void {
    this.cleanupOperations.push(async () => {
      try {
        await operation();
        return {
          operation: name,
          success: true,
        };
      } catch (error: any) {
        return {
          operation: name,
          success: false,
          error: error.message,
        };
      }
    });
    console.log(
      `📝 CleanupManager: Registered custom cleanup operation: ${name}`
    );
  }

  /**
   * Perform comprehensive cleanup
   */
  async performCleanup(config: CleanupConfig): Promise<CleanupResult[]> {
    console.log("🧹 CleanupManager: Starting cleanup operations...");

    const results: CleanupResult[] = [];

    // Cleanup wallets (drain funds back to main wallet if needed)
    if (config.cleanupWallets) {
      const walletResults = await this.cleanupWallets();
      results.push(...walletResults);
    }

    // Cleanup temporary files
    if (config.cleanupTempFiles) {
      const fileResults = await this.cleanupTempFiles();
      results.push(...fileResults);
    }

    // Cleanup logs
    if (config.cleanupLogs) {
      const logResults = await this.cleanupLogs();
      results.push(...logResults);
    }

    // Cleanup test data
    if (config.cleanupTestData) {
      const dataResults = await this.cleanupTestData();
      results.push(...dataResults);
    }

    // Run custom cleanup operations
    const customResults = await this.runCustomCleanupOperations();
    results.push(...customResults);

    // Log cleanup summary
    this.logCleanupSummary(results);

    return results;
  }

  /**
   * Cleanup created wallets
   */
  private async cleanupWallets(): Promise<CleanupResult[]> {
    const results: CleanupResult[] = [];

    console.log(
      `🧹 CleanupManager: Cleaning up ${this.createdWallets.size} wallets...`
    );

    for (const walletAddress of this.createdWallets) {
      try {
        // For test wallets, we don't need to drain funds since they're just test tokens
        // Just remove from tracking
        results.push({
          operation: `cleanup-wallet-${walletAddress.slice(0, 10)}`,
          success: true,
          details: {address: walletAddress},
        });
      } catch (error: any) {
        results.push({
          operation: `cleanup-wallet-${walletAddress.slice(0, 10)}`,
          success: false,
          error: error.message,
        });
      }
    }

    this.createdWallets.clear();
    return results;
  }

  /**
   * Cleanup temporary files
   */
  private async cleanupTempFiles(): Promise<CleanupResult[]> {
    const results: CleanupResult[] = [];

    console.log(
      `🧹 CleanupManager: Cleaning up ${this.tempFiles.size} temp files...`
    );

    for (const filePath of this.tempFiles) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          results.push({
            operation: `cleanup-file-${path.basename(filePath)}`,
            success: true,
            details: {path: filePath},
          });
        } else {
          results.push({
            operation: `cleanup-file-${path.basename(filePath)}`,
            success: true,
            details: {path: filePath, note: "File already removed"},
          });
        }
      } catch (error: any) {
        results.push({
          operation: `cleanup-file-${path.basename(filePath)}`,
          success: false,
          error: error.message,
        });
      }
    }

    this.tempFiles.clear();
    return results;
  }

  /**
   * Cleanup log files
   */
  private async cleanupLogs(): Promise<CleanupResult[]> {
    const results: CleanupResult[] = [];

    try {
      // Find project root
      let currentDir = __dirname;
      while (
        currentDir !== "/" &&
        !fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))
      ) {
        currentDir = path.dirname(currentDir);
      }

      // Common log directories
      const logDirs = [
        path.join(currentDir, "logs"),
        path.join(currentDir, "apps/indexer/logs"),
        path.join(currentDir, "libs/ts-sdk/logs"),
      ];

      for (const logDir of logDirs) {
        if (fs.existsSync(logDir)) {
          const files = fs.readdirSync(logDir);

          for (const file of files) {
            if (file.endsWith(".log") || file.startsWith("test-")) {
              const filePath = path.join(logDir, file);
              try {
                fs.unlinkSync(filePath);
                results.push({
                  operation: `cleanup-log-${file}`,
                  success: true,
                  details: {path: filePath},
                });
              } catch (error: any) {
                results.push({
                  operation: `cleanup-log-${file}`,
                  success: false,
                  error: error.message,
                });
              }
            }
          }
        }
      }
    } catch (error: any) {
      results.push({
        operation: "cleanup-logs",
        success: false,
        error: error.message,
      });
    }

    return results;
  }

  /**
   * Cleanup test data
   */
  private async cleanupTestData(): Promise<CleanupResult[]> {
    const results: CleanupResult[] = [];

    console.log(
      `🧹 CleanupManager: Cleaning up ${this.testDataPaths.size} test data paths...`
    );

    for (const dataPath of this.testDataPaths) {
      try {
        if (fs.existsSync(dataPath)) {
          const stats = fs.statSync(dataPath);

          if (stats.isDirectory()) {
            fs.rmSync(dataPath, {recursive: true, force: true});
          } else {
            fs.unlinkSync(dataPath);
          }

          results.push({
            operation: `cleanup-data-${path.basename(dataPath)}`,
            success: true,
            details: {
              path: dataPath,
              type: stats.isDirectory() ? "directory" : "file",
            },
          });
        } else {
          results.push({
            operation: `cleanup-data-${path.basename(dataPath)}`,
            success: true,
            details: {path: dataPath, note: "Path already removed"},
          });
        }
      } catch (error: any) {
        results.push({
          operation: `cleanup-data-${path.basename(dataPath)}`,
          success: false,
          error: error.message,
        });
      }
    }

    this.testDataPaths.clear();
    return results;
  }

  /**
   * Run custom cleanup operations
   */
  private async runCustomCleanupOperations(): Promise<CleanupResult[]> {
    const results: CleanupResult[] = [];

    console.log(
      `🧹 CleanupManager: Running ${this.cleanupOperations.length} custom cleanup operations...`
    );

    for (const operation of this.cleanupOperations) {
      const result = await operation();
      results.push(result);
    }

    this.cleanupOperations.length = 0; // Clear operations
    return results;
  }

  /**
   * Quick cleanup for test isolation
   */
  async quickCleanup(): Promise<void> {
    console.log(
      "🧹 CleanupManager: Performing quick cleanup for test isolation..."
    );

    await this.performCleanup({
      cleanupWallets: false, // Keep wallets for reuse
      cleanupTempFiles: true,
      cleanupLogs: false, // Keep logs for debugging
      cleanupTestData: true,
      preserveContracts: true,
    });
  }

  /**
   * Full cleanup for test suite completion
   */
  async fullCleanup(): Promise<void> {
    console.log("🧹 CleanupManager: Performing full cleanup...");

    await this.performCleanup({
      cleanupWallets: true,
      cleanupTempFiles: true,
      cleanupLogs: true,
      cleanupTestData: true,
      preserveContracts: true,
    });
  }

  /**
   * Emergency cleanup (for error scenarios)
   */
  async emergencyCleanup(): Promise<void> {
    console.log("🚨 CleanupManager: Performing emergency cleanup...");

    try {
      await this.performCleanup({
        cleanupWallets: false, // Don't risk wallet operations in emergency
        cleanupTempFiles: true,
        cleanupLogs: false, // Preserve logs for debugging
        cleanupTestData: true,
        preserveContracts: true,
      });
    } catch (error) {
      console.error("❌ CleanupManager: Emergency cleanup failed:", error);
    }
  }

  /**
   * Log cleanup summary
   */
  private logCleanupSummary(results: CleanupResult[]): void {
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(
      `📊 CleanupManager: Cleanup completed - ${successful} successful, ${failed} failed`
    );

    if (failed > 0) {
      console.log("❌ CleanupManager: Failed operations:");
      results
        .filter((r) => !r.success)
        .forEach((result) => {
          console.log(`  - ${result.operation}: ${result.error}`);
        });
    }

    if (successful > 0) {
      console.log("✅ CleanupManager: Successful operations:");
      results
        .filter((r) => r.success)
        .forEach((result) => {
          console.log(`  - ${result.operation}`);
        });
    }
  }

  /**
   * Get cleanup statistics
   */
  getCleanupStats(): {
    walletsTracked: number;
    tempFilesTracked: number;
    testDataPathsTracked: number;
    customOperationsRegistered: number;
  } {
    return {
      walletsTracked: this.createdWallets.size,
      tempFilesTracked: this.tempFiles.size,
      testDataPathsTracked: this.testDataPaths.size,
      customOperationsRegistered: this.cleanupOperations.length,
    };
  }

  /**
   * Clear all tracking without performing cleanup
   */
  clearTracking(): void {
    this.createdWallets.clear();
    this.tempFiles.clear();
    this.testDataPaths.clear();
    this.cleanupOperations.length = 0;
    console.log("🧹 CleanupManager: Cleared all tracking");
  }
}

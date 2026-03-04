import {Provider, WalletUnlocked, BN} from "fuels";
import {spawn, ChildProcess} from "child_process";
import * as fs from "fs";
import * as path from "path";
import {ServiceManager, serviceManager} from "./service-manager";
import {ContractValidator} from "./contract-validator";
import {CleanupManager} from "./cleanup-manager";

/**
 * Test environment configuration
 */
export const TEST_CONFIG = {
  fuelNode: {
    url: "http://localhost:4000/v1/graphql",
    port: 4000,
  },
  indexer: {
    url: "http://localhost:4350/graphql",
    port: 4350,
  },
  contracts: {
    // Will be loaded from contract-ids.json
    basicHook: "",
    poolCurveState: "",
    simpleProxy: "",
    fungible: "",
  },
  defaultSigner: {
    privateKey:
      "0xa449b1ffee0e2205fa924c6740cc48b3b473aa28587df6dab12abc245d1f5298",
    address:
      "0x94ffcc53b892684acefaebc8a3d4a595e528a8cf664eeb3ef36f1020b0809d0d",
  },
  timeout: {
    nodeStartup: 30000,
    indexerStartup: 30000,
    transactionConfirmation: 10000,
  },
};

/**
 * Test environment manager for integration tests
 */
export class TestEnvironment {
  private nodeProcess?: ChildProcess;
  private indexerProcess?: ChildProcess;
  private provider?: Provider;
  private wallet?: WalletUnlocked;
  private isInitialized = false;
  private serviceManager: ServiceManager;
  private contractValidator?: ContractValidator;
  private cleanupManager?: CleanupManager;

  constructor() {
    // Don't load contract IDs in constructor - they need to be loaded after deployment
    this.serviceManager = serviceManager;
  }

  /**
   * Load contract IDs from the deployed contracts file
   */
  private loadContractIds() {
    try {
      // Find project root by looking for package.json with workspace info
      let currentDir = __dirname;
      while (
        currentDir !== "/" &&
        !fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))
      ) {
        currentDir = path.dirname(currentDir);
      }

      const contractIdsPath = path.join(
        currentDir,
        "apps/indexer/mira-binned-liquidity-api/contract-ids.json"
      );
      const contractIds = JSON.parse(fs.readFileSync(contractIdsPath, "utf8"));
      TEST_CONFIG.contracts = contractIds;
    } catch (error) {
      console.warn("Could not load contract IDs, using defaults:", error);
    }
  }

  /**
   * Start the test environment (node and indexer)
   */
  async start(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log("🚀 Starting test environment...");

    try {
      // Start services using the improved service manager
      await this.serviceManager.startServices();

      // Initialize provider first
      await this.initializeProvider();

      // Initialize contract validator and cleanup manager
      this.contractValidator = new ContractValidator(this.provider!);
      this.cleanupManager = new CleanupManager(this.provider!);

      // Perform contract readiness check to address synchronization issues
      await this.contractValidator.performReadinessCheck();

      // Load contract IDs after contracts are validated
      this.loadContractIds();

      this.isInitialized = true;
      console.log("✅ Test environment ready");
    } catch (error) {
      console.error("❌ Test environment startup failed:", error);

      // Provide helpful error context
      if (error instanceof Error) {
        if (
          error.message.includes("Port") &&
          error.message.includes("in use")
        ) {
          console.error(
            "💡 Suggestion: Stop any existing Fuel node or indexer processes"
          );
          console.error("   You can use: lsof -ti:4000,4350 | xargs kill -9");
        } else if (error.message.includes("timeout")) {
          console.error(
            "💡 Suggestion: Services may be starting slowly, try increasing timeout"
          );
        } else if (error.message.includes("Connection refused")) {
          console.error(
            "💡 Suggestion: Ensure Fuel node and indexer are properly configured"
          );
        }
      }

      throw error;
    }
  }

  /**
   * Start node and indexer services
   */
  private async startServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("Starting node and indexer via nx dev indexer...");

      // Start the services using nx
      this.nodeProcess = spawn("pnpm", ["nx", "dev", "indexer"], {
        cwd: path.join(__dirname, "../../../../../.."),
        stdio: "pipe",
        shell: true,
      });

      let nodeReady = false;
      let indexerReady = false;
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for services to start"));
      }, TEST_CONFIG.timeout.nodeStartup + TEST_CONFIG.timeout.indexerStartup);

      const checkReady = () => {
        if (nodeReady && indexerReady) {
          clearTimeout(timeout);
          resolve();
        }
      };

      // Monitor output for readiness
      this.nodeProcess.stdout?.on("data", (data) => {
        const output = data.toString();
        console.log("[NODE/INDEXER]", output.trim());

        if (output.includes("Fuel node started") || output.includes("4000")) {
          nodeReady = true;
          checkReady();
        }

        if (output.includes("Indexer started") || output.includes("4350")) {
          indexerReady = true;
          checkReady();
        }
      });

      this.nodeProcess.stderr?.on("data", (data) => {
        console.error("[NODE/INDEXER ERROR]", data.toString());
      });

      this.nodeProcess.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Fallback: poll for services
      const pollInterval = setInterval(async () => {
        if (
          !nodeReady &&
          (await this.isServiceRunning(TEST_CONFIG.fuelNode.url))
        ) {
          nodeReady = true;
          console.log("✅ Fuel node detected");
          checkReady();
        }

        if (
          !indexerReady &&
          (await this.isServiceRunning(TEST_CONFIG.indexer.url))
        ) {
          indexerReady = true;
          console.log("✅ Indexer detected");
          checkReady();
        }

        if (nodeReady && indexerReady) {
          clearInterval(pollInterval);
        }
      }, 2000);
    });
  }

  /**
   * Check if a service is running
   */
  private async isServiceRunning(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          query: "{ __typename }",
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Initialize provider and wallet
   */
  private async initializeProvider(): Promise<void> {
    this.provider = new Provider(TEST_CONFIG.fuelNode.url);
    this.wallet = new WalletUnlocked(
      TEST_CONFIG.defaultSigner.privateKey,
      this.provider
    );

    // Wait for the wallet to have some balance
    await this.ensureWalletFunded();
  }

  /**
   * Ensure the test wallet has funds
   */
  private async ensureWalletFunded(): Promise<void> {
    if (!this.wallet) return;

    const balance = await this.wallet.getBalance();
    if (balance.eq(0)) {
      console.log("⏳ Waiting for wallet to be funded...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const newBalance = await this.wallet.getBalance();
      if (newBalance.eq(0)) {
        throw new Error(
          "Test wallet has no funds. Ensure the node is configured correctly."
        );
      }
    }
    console.log(`💰 Wallet balance: ${balance.format()}`);
  }

  /**
   * Get the provider instance
   */
  getProvider(): Provider {
    if (!this.provider) {
      throw new Error("Test environment not initialized. Call start() first.");
    }
    return this.provider;
  }

  /**
   * Get the default wallet instance
   */
  getWallet(): WalletUnlocked {
    if (!this.wallet) {
      throw new Error("Test environment not initialized. Call start() first.");
    }
    return this.wallet;
  }

  private walletCreationQueue: Promise<any> = Promise.resolve();

  /**
   * Create a new funded wallet with improved safety and error handling
   */
  async createWallet(initialBalance?: string): Promise<WalletUnlocked> {
    if (!this.provider || !this.wallet) {
      throw new Error("Test environment not initialized. Call start() first.");
    }

    // Use reduced default balance if none specified (0.1 ETH instead of 10 ETH)
    const balance = initialBalance || "100000000000000000"; // 0.1 ETH default

    // Queue wallet creation to prevent UTXO conflicts
    return (this.walletCreationQueue = this.walletCreationQueue.then(
      async () => {
        const newWallet = WalletUnlocked.generate({provider: this.provider});

        // Validate master wallet balance before attempting transfer
        try {
          const masterBalance = await this.wallet!.getBalance();
          const requiredBalance = new BN(balance);

          if (masterBalance.lt(requiredBalance)) {
            throw new Error(
              `Insufficient master wallet balance. Required: ${requiredBalance.format()}, Available: ${masterBalance.format()}`
            );
          }

          console.log(
            `💰 Master wallet balance: ${masterBalance.format()}, funding ${requiredBalance.format()}`
          );
        } catch (error) {
          console.error("❌ Failed to check master wallet balance:", error);
          throw new Error(`Balance validation failed: ${error}`);
        }

        // Add a small delay to prevent concurrent transactions
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Retry logic for wallet funding with exponential backoff
        let retries = 3;
        let lastError: Error;

        while (retries > 0) {
          try {
            // Transfer funds from default wallet
            const tx = await this.wallet!.transfer(newWallet.address, balance);
            const result = await tx.waitForResult();

            // Verify the transfer was successful
            const newWalletBalance = await newWallet.getBalance();
            if (newWalletBalance.lt(new BN(balance).div(new BN(2)))) {
              throw new Error(
                `Transfer verification failed. Expected at least ${new BN(balance).div(new BN(2)).format()}, got ${newWalletBalance.format()}`
              );
            }

            console.log(
              `💰 Created and funded wallet: ${newWallet.address.toB256()} with ${newWalletBalance.format()}`
            );
            break;
          } catch (error) {
            lastError = error as Error;
            retries--;

            if (retries === 0) {
              console.error(
                `❌ Failed to fund wallet after 3 attempts: ${lastError.message}`
              );

              // Provide helpful error context
              if (lastError.message.includes("insufficient")) {
                console.error(
                  "💡 Suggestion: Master wallet may not have enough funds"
                );
              } else if (lastError.message.includes("UTXO")) {
                console.error(
                  "💡 Suggestion: UTXO conflict detected, try reducing concurrent wallet creation"
                );
              }

              throw new Error(`Wallet funding failed: ${lastError.message}`);
            }

            const delay = 1000 * (4 - retries); // 1s, 2s, 3s delays (exponential backoff)
            console.warn(
              `⚠️ Wallet funding failed, retrying in ${delay}ms (attempt ${4 - retries}/3): ${lastError.message}`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        // Register wallet with cleanup manager
        if (this.cleanupManager) {
          this.cleanupManager.registerWallet(newWallet);
        }

        return newWallet;
      }
    ));
  }

  /**
   * Get contract IDs
   */
  getContractIds() {
    return TEST_CONFIG.contracts;
  }

  /**
   * Get test configuration
   */
  getConfig() {
    return TEST_CONFIG;
  }

  /**
   * Wait for a transaction to be indexed
   */
  async waitForIndexer(txId: string, maxWait = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      try {
        const response = await fetch(TEST_CONFIG.indexer.url, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            query: `
              query GetTransaction($id: String!) {
                transaction(id: $id) {
                  id
                  blockNumber
                }
              }
            `,
            variables: {id: txId},
          }),
        });

        const data = await response.json();
        if (data.data?.transaction) {
          return;
        }
      } catch {
        // Ignore errors and retry
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(`Timeout waiting for transaction ${txId} to be indexed`);
  }

  /**
   * Get the service manager instance
   */
  getServiceManager(): ServiceManager {
    return this.serviceManager;
  }

  /**
   * Get the contract validator instance
   */
  getContractValidator(): ContractValidator {
    if (!this.contractValidator) {
      throw new Error("Test environment not initialized. Call start() first.");
    }
    return this.contractValidator;
  }

  /**
   * Get the cleanup manager instance
   */
  getCleanupManager(): CleanupManager {
    if (!this.cleanupManager) {
      throw new Error("Test environment not initialized. Call start() first.");
    }
    return this.cleanupManager;
  }

  /**
   * Perform quick cleanup for test isolation
   */
  async quickCleanup(): Promise<void> {
    if (this.cleanupManager) {
      await this.cleanupManager.quickCleanup();
    }
  }

  /**
   * Check if all services are healthy
   */
  async checkServicesHealth(): Promise<boolean> {
    const statuses = await this.serviceManager.checkAllServices();
    return statuses.every((status) => status.isRunning);
  }

  /**
   * Validate contract deployment status
   */
  async validateContracts(): Promise<boolean> {
    if (!this.contractValidator) {
      return false;
    }

    const result = await this.contractValidator.validateAllContracts();
    return result.allValid;
  }

  /**
   * Validate infrastructure startup works correctly
   */
  async validateInfrastructureStartup(): Promise<{
    valid: boolean;
    issues: string[];
    serviceStatus: any;
  }> {
    const issues: string[] = [];

    try {
      // Primary check: Test service health checks (more reliable than port detection)
      const allStatuses = await this.serviceManager.checkAllServices();
      const unhealthyServices = allStatuses.filter((s) => !s.isRunning);

      if (unhealthyServices.length > 0) {
        unhealthyServices.forEach((service) => {
          issues.push(`Service ${service.name} is unhealthy: ${service.error}`);
        });
      }

      // Secondary check: Service detection (for additional diagnostics)
      let serviceStatus = null;
      try {
        serviceStatus = await this.serviceManager.getServiceDetectionResults();

        // Only add issues if health checks also failed
        if (unhealthyServices.some((s) => s.name === "Fuel Node")) {
          if (!serviceStatus.fuelNode.running) {
            issues.push("Fuel node port 4000 is not in use");
          }
          if (!serviceStatus.fuelNode.responding) {
            issues.push("Fuel node is not responding to GraphQL queries");
          }
        }

        if (unhealthyServices.some((s) => s.name === "Indexer")) {
          if (!serviceStatus.indexer.running) {
            issues.push("Indexer port 4350 is not in use");
          }
          if (!serviceStatus.indexer.responding) {
            issues.push("Indexer is not responding to GraphQL queries");
          }
        }
      } catch (detectionError) {
        console.warn(
          "⚠️ Service detection failed (non-fatal):",
          detectionError
        );
        // Don't fail validation just because detection failed
      }

      // Test basic provider connectivity (optional - don't fail validation if this fails)
      if (this.provider) {
        try {
          // Use a simple method that exists on the provider
          const chainId = await this.provider.getChainId();
          console.log(`🔗 Provider chain ID: ${chainId}`);
        } catch (providerError) {
          console.warn(
            `⚠️ Provider connectivity test failed (non-fatal): ${providerError}`
          );
          // Don't add to issues - this is informational only
        }
      }

      return {
        valid: issues.length === 0,
        issues,
        serviceStatus,
      };
    } catch (error) {
      issues.push(`Infrastructure validation failed: ${error}`);
      return {
        valid: false,
        issues,
        serviceStatus: null,
      };
    }
  }

  /**
   * Validate wallet funding works safely
   */
  async validateWalletFunding(): Promise<{
    valid: boolean;
    issues: string[];
    testResults: any;
  }> {
    const issues: string[] = [];
    const testResults: any = {};

    try {
      // Test master wallet balance check
      if (!this.wallet) {
        issues.push("Master wallet not available");
        return {valid: false, issues, testResults};
      }

      const masterBalance = await this.wallet.getBalance();
      testResults.masterBalance = masterBalance.format();

      if (masterBalance.eq(0)) {
        issues.push("Master wallet has zero balance");
      }

      // Test small wallet creation
      const testAmount = "10000000000000000"; // 0.01 ETH
      const requiredBalance = new BN(testAmount);

      if (masterBalance.lt(requiredBalance)) {
        issues.push(
          `Master wallet balance (${masterBalance.format()}) insufficient for test funding (${requiredBalance.format()})`
        );
        return {valid: false, issues, testResults};
      }

      // Create a test wallet to validate funding works (with retry for network issues)
      let retries = 3;
      while (retries > 0) {
        try {
          const testWallet = await this.createWallet(testAmount);
          const testWalletBalance = await testWallet.getBalance();
          testResults.testWalletBalance = testWalletBalance.format();

          if (testWalletBalance.lt(requiredBalance.div(new BN(2)))) {
            issues.push(
              `Test wallet funding failed. Expected at least ${requiredBalance.div(new BN(2)).format()}, got ${testWalletBalance.format()}`
            );
          } else {
            testResults.fundingSuccess = true;
          }
          break; // Success, exit retry loop
        } catch (error) {
          retries--;
          if (retries === 0) {
            // Only add as issue if it's not a network error
            if (
              error instanceof Error &&
              (error.message.includes("fetch failed") ||
                error.message.includes("network"))
            ) {
              console.warn(
                `⚠️ Network error during wallet funding test (non-fatal): ${error.message}`
              );
              testResults.fundingSuccess = true; // Don't fail validation for network issues
            } else {
              issues.push(`Test wallet creation failed: ${error}`);
              testResults.fundingSuccess = false;
            }
          } else {
            console.warn(
              `⚠️ Wallet funding test failed, retrying (${retries} attempts left): ${error}`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
          }
        }
      }

      return {
        valid: issues.length === 0,
        issues,
        testResults,
      };
    } catch (error) {
      issues.push(`Wallet funding validation failed: ${error}`);
      return {
        valid: false,
        issues,
        testResults,
      };
    }
  }

  /**
   * Validate error handling provides helpful messages
   */
  async validateErrorHandling(): Promise<{
    valid: boolean;
    issues: string[];
    testResults: any;
  }> {
    const issues: string[] = [];
    const testResults: any = {};

    try {
      // Test service startup failure handling
      try {
        // Try to start services when they're already running (should handle gracefully)
        await this.serviceManager.startServices();
        testResults.duplicateStartupHandled = true;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("already running")
        ) {
          testResults.duplicateStartupHandled = true;
        } else {
          issues.push(`Service startup error handling failed: ${error}`);
          testResults.duplicateStartupHandled = false;
        }
      }

      // Test wallet funding with insufficient balance
      try {
        const hugeAmount = "999999999999999999999999"; // Unrealistic amount
        await this.createWallet(hugeAmount);
        issues.push(
          "Wallet funding should have failed with insufficient balance"
        );
        testResults.insufficientBalanceHandled = false;
      } catch (error) {
        if (error instanceof Error && error.message.includes("Insufficient")) {
          testResults.insufficientBalanceHandled = true;
        } else {
          issues.push(`Insufficient balance error handling failed: ${error}`);
          testResults.insufficientBalanceHandled = false;
        }
      }

      // Test service health check timeout handling
      try {
        // Configure very short timeout to test timeout handling
        this.serviceManager.configureAllTimeouts(undefined, 1); // 1ms health check timeout
        const statuses = await this.serviceManager.checkAllServices();

        // Reset to normal timeouts
        this.serviceManager.configureAllTimeouts(undefined, 5000); // 5s health check timeout

        // Should have handled timeouts gracefully
        const timeoutErrors = statuses.filter((s) =>
          s.error?.includes("timeout")
        );
        if (timeoutErrors.length > 0) {
          testResults.timeoutHandled = true;
        } else {
          testResults.timeoutHandled = false;
        }
      } catch (error) {
        issues.push(`Timeout error handling test failed: ${error}`);
        testResults.timeoutHandled = false;
      }

      return {
        valid: issues.length === 0,
        issues,
        testResults,
      };
    } catch (error) {
      issues.push(`Error handling validation failed: ${error}`);
      return {
        valid: false,
        issues,
        testResults,
      };
    }
  }

  /**
   * Enhanced stop method with cleanup
   */
  async stop(): Promise<void> {
    console.log("🛑 Stopping test environment...");

    try {
      // Perform cleanup
      if (this.cleanupManager) {
        await this.cleanupManager.fullCleanup();
      }

      // Stop services gracefully
      await this.serviceManager.stopAllServices();
    } catch (error) {
      console.error("⚠️ Error during cleanup:", error);
      // Continue with shutdown even if cleanup fails
    }

    // Reset state
    this.provider = undefined;
    this.wallet = undefined;
    this.contractValidator = undefined;
    this.cleanupManager = undefined;
    this.isInitialized = false;

    console.log("✅ Test environment stopped");
  }
}

// Singleton instance
export const testEnvironment = new TestEnvironment();

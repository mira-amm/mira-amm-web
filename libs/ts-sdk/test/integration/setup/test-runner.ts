import {testEnvironment} from "./test-environment";
import {serviceManager} from "./service-manager";

/**
 * Test suite configuration
 */
export interface TestSuiteConfig {
  name: string;
  timeout: number;
  retries: number;
  isolateTests: boolean;
  validateContracts: boolean;
  cleanupBetweenTests: boolean;
}

/**
 * Test execution result
 */
export interface TestExecutionResult {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  errors: string[];
}

/**
 * Enhanced test runner for integration tests
 */
export class TestRunner {
  private config: TestSuiteConfig;
  private isSetup = false;

  constructor(config: Partial<TestSuiteConfig> = {}) {
    this.config = {
      name: "Integration Test Suite",
      timeout: 120000, // 2 minutes default
      retries: 1,
      isolateTests: true,
      validateContracts: true,
      cleanupBetweenTests: true,
      ...config,
    };
  }

  /**
   * Setup test environment
   */
  async setup(): Promise<void> {
    if (this.isSetup) {
      return;
    }

    console.log(`🚀 TestRunner: Setting up ${this.config.name}...`);

    try {
      // Start test environment with enhanced infrastructure
      await testEnvironment.start();

      // Validate contracts if required
      if (this.config.validateContracts) {
        const contractsValid = await testEnvironment.validateContracts();
        if (!contractsValid) {
          throw new Error(
            "Contract validation failed - contracts not properly deployed or accessible"
          );
        }
        console.log("✅ TestRunner: Contract validation passed");
      }

      // Check service health
      const servicesHealthy = await testEnvironment.checkServicesHealth();
      if (!servicesHealthy) {
        console.warn(
          "⚠️ TestRunner: Some services are not healthy, tests may fail"
        );
      } else {
        console.log("✅ TestRunner: All services are healthy");
      }

      this.isSetup = true;
      console.log("✅ TestRunner: Setup completed successfully");
    } catch (error) {
      console.error("❌ TestRunner: Setup failed:", error);
      throw error;
    }
  }

  /**
   * Teardown test environment
   */
  async teardown(): Promise<void> {
    if (!this.isSetup) {
      return;
    }

    console.log("🛑 TestRunner: Tearing down test environment...");

    try {
      await testEnvironment.stop();
      this.isSetup = false;
      console.log("✅ TestRunner: Teardown completed");
    } catch (error) {
      console.error("❌ TestRunner: Teardown failed:", error);
      throw error;
    }
  }

  /**
   * Run a test with enhanced error handling and cleanup
   */
  async runTest<T>(
    testName: string,
    testFunction: () => Promise<T>,
    options: {
      timeout?: number;
      retries?: number;
      skipCleanup?: boolean;
    } = {}
  ): Promise<T> {
    const timeout = options.timeout || this.config.timeout;
    const retries =
      options.retries !== undefined ? options.retries : this.config.retries;
    const skipCleanup = options.skipCleanup || !this.config.cleanupBetweenTests;

    console.log(`🧪 TestRunner: Running test "${testName}"...`);

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(
            `🔄 TestRunner: Retry attempt ${attempt} for "${testName}"`
          );

          // Perform cleanup before retry
          if (!skipCleanup) {
            await testEnvironment.quickCleanup();
          }
        }

        // Run test with timeout
        const result = await this.runWithTimeout(testFunction, timeout);

        // Cleanup after successful test
        if (!skipCleanup && this.config.cleanupBetweenTests) {
          await testEnvironment.quickCleanup();
        }

        console.log(`✅ TestRunner: Test "${testName}" passed`);
        return result;
      } catch (error: any) {
        lastError = error;
        console.error(
          `❌ TestRunner: Test "${testName}" failed (attempt ${attempt + 1}):`,
          error.message
        );

        // Emergency cleanup on error
        try {
          if (!skipCleanup) {
            await testEnvironment.getCleanupManager().emergencyCleanup();
          }
        } catch (cleanupError) {
          console.warn(
            "⚠️ TestRunner: Emergency cleanup failed:",
            cleanupError
          );
        }
      }
    }

    throw (
      lastError ||
      new Error(`Test "${testName}" failed after ${retries + 1} attempts`)
    );
  }

  /**
   * Run function with timeout
   */
  private async runWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Test timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Create isolated test environment for a specific test
   */
  async createIsolatedEnvironment(): Promise<{
    wallet: any;
    tokenFactory: any;
    poolFactory: any;
    walletFactory: any;
    transactionUtilities: any;
    balanceChecker: any;
    cleanup: () => Promise<void>;
  }> {
    if (!this.isSetup) {
      throw new Error("TestRunner not setup. Call setup() first.");
    }

    // Create isolated wallet
    const wallet = await testEnvironment.createWallet("100000000000"); // 100,000 ETH

    // Import factories dynamically to avoid circular dependencies
    const {TokenFactory} = await import("./token-factory");
    const {PoolFactory} = await import("./pool-factory");
    const {WalletFactory} = await import("./wallet-factory");
    const {TransactionUtilities} = await import("./transaction-utilities");
    const {BalanceChecker} = await import("./balance-checker");

    const contractIds = testEnvironment.getContractIds();
    const provider = testEnvironment.getProvider();

    // Initialize all utilities
    const tokenFactory = new TokenFactory(wallet, contractIds.fungible);
    const poolFactory = new PoolFactory(wallet, contractIds.simpleProxy);
    const walletFactory = new WalletFactory(provider, wallet, tokenFactory);
    const transactionUtilities = new TransactionUtilities(provider);
    const balanceChecker = new BalanceChecker(provider, tokenFactory);

    const cleanup = async () => {
      console.log("🧹 TestRunner: Cleaning up isolated environment...");
      // Reset factory states
      walletFactory.reset();
      balanceChecker.clearHistory();
      // Cleanup is handled by the CleanupManager automatically
    };

    return {
      wallet,
      tokenFactory,
      poolFactory,
      walletFactory,
      transactionUtilities,
      balanceChecker,
      cleanup,
    };
  }

  /**
   * Validate test prerequisites
   */
  async validatePrerequisites(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check if environment is setup
      if (!this.isSetup) {
        issues.push("Test environment not setup");
      }

      // Check service health
      const servicesHealthy = await testEnvironment.checkServicesHealth();
      if (!servicesHealthy) {
        issues.push("Some services are not healthy");
      }

      // Check contract validation
      if (this.config.validateContracts) {
        const contractsValid = await testEnvironment.validateContracts();
        if (!contractsValid) {
          issues.push("Contract validation failed");
        }
      }

      // Check if we can create wallets
      try {
        const testWallet = await testEnvironment.createWallet("1000000000"); // 1 ETH
        if (!testWallet) {
          issues.push("Cannot create test wallets");
        }
      } catch (error) {
        issues.push(`Wallet creation failed: ${error}`);
      }
    } catch (error: any) {
      issues.push(`Prerequisite validation failed: ${error.message}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get test runner configuration
   */
  getConfig(): TestSuiteConfig {
    return {...this.config};
  }

  /**
   * Update test runner configuration
   */
  updateConfig(updates: Partial<TestSuiteConfig>): void {
    this.config = {...this.config, ...updates};
  }

  /**
   * Get test environment status
   */
  async getEnvironmentStatus(): Promise<{
    isSetup: boolean;
    servicesHealthy: boolean;
    contractsValid: boolean;
    cleanupStats: any;
  }> {
    return {
      isSetup: this.isSetup,
      servicesHealthy: this.isSetup
        ? await testEnvironment.checkServicesHealth()
        : false,
      contractsValid: this.isSetup
        ? await testEnvironment.validateContracts()
        : false,
      cleanupStats: this.isSetup
        ? testEnvironment.getCleanupManager().getCleanupStats()
        : null,
    };
  }
}

// Default test runner instance
export const defaultTestRunner = new TestRunner();

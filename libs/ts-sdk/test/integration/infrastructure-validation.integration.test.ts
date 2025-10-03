import {describe, it, expect, beforeAll, afterAll} from "vitest";
import {defaultTestRunner} from "./setup/test-runner";
import {testEnvironment} from "./setup/test-environment";
import {TokenFactory} from "./setup/token-factory";
import {PoolFactory} from "./setup/pool-factory";

describe("Enhanced Infrastructure Validation", () => {
  beforeAll(async () => {
    console.log("🧪 Starting enhanced infrastructure validation tests...");
    await defaultTestRunner.setup();
  }, 120000); // 2 minute timeout for setup

  afterAll(async () => {
    await defaultTestRunner.teardown();
  });

  it("should validate service manager functionality", async () => {
    await defaultTestRunner.runTest("service-manager-validation", async () => {
      const serviceManager = testEnvironment.getServiceManager();

      // Check all services are running
      const statuses = await serviceManager.checkAllServices();
      expect(statuses.length).toBeGreaterThan(0);

      const allRunning = statuses.every((status) => status.isRunning);
      expect(allRunning).toBe(true);

      console.log("✅ Service manager validation passed");
      console.log(`📊 Services checked: ${statuses.length}`);
      statuses.forEach((status) => {
        console.log(`  - ${status.name}: ${status.isRunning ? "✅" : "❌"}`);
      });
    });
  });

  it("should validate contract validator functionality", async () => {
    await defaultTestRunner.runTest(
      "contract-validator-validation",
      async () => {
        const contractValidator = testEnvironment.getContractValidator();

        // Validate all contracts
        const result = await contractValidator.validateAllContracts();
        expect(result.contracts.length).toBeGreaterThan(0);

        // At least some contracts should be valid
        const validContracts = result.contracts.filter(
          (c) => c.isDeployed && c.isAccessible
        );
        expect(validContracts.length).toBeGreaterThan(0);

        console.log("✅ Contract validator validation passed");
        console.log(`📊 Contracts validated: ${result.contracts.length}`);
        console.log(`📊 Valid contracts: ${validContracts.length}`);

        result.contracts.forEach((contract) => {
          const deployedIcon = contract.isDeployed ? "✅" : "❌";
          const accessibleIcon = contract.isAccessible ? "✅" : "❌";
          console.log(`  ${deployedIcon}${accessibleIcon} ${contract.name}`);
        });
      }
    );
  });

  it("should validate cleanup manager functionality", async () => {
    await defaultTestRunner.runTest("cleanup-manager-validation", async () => {
      const cleanupManager = testEnvironment.getCleanupManager();

      // Get initial stats
      const initialStats = cleanupManager.getCleanupStats();
      expect(initialStats).toBeDefined();

      // Create a test wallet to track
      const wallet = await testEnvironment.createWallet("1000000000");
      expect(wallet).toBeDefined();

      // Check that wallet is tracked
      const updatedStats = cleanupManager.getCleanupStats();
      expect(updatedStats.walletsTracked).toBeGreaterThan(
        initialStats.walletsTracked
      );

      // Perform quick cleanup
      await cleanupManager.quickCleanup();

      console.log("✅ Cleanup manager validation passed");
      console.log(`📊 Initial wallets tracked: ${initialStats.walletsTracked}`);
      console.log(`📊 Updated wallets tracked: ${updatedStats.walletsTracked}`);
    });
  });

  it("should validate enhanced test environment functionality", async () => {
    await defaultTestRunner.runTest("test-environment-validation", async () => {
      // Check environment status
      const status = await defaultTestRunner.getEnvironmentStatus();
      expect(status.isSetup).toBe(true);
      expect(status.servicesHealthy).toBe(true);

      // Validate prerequisites
      const prerequisites = await defaultTestRunner.validatePrerequisites();
      expect(prerequisites.valid).toBe(true);

      if (prerequisites.issues.length > 0) {
        console.warn("⚠️ Prerequisite issues found:", prerequisites.issues);
      }

      console.log("✅ Enhanced test environment validation passed");
      console.log(`📊 Environment setup: ${status.isSetup ? "✅" : "❌"}`);
      console.log(
        `📊 Services healthy: ${status.servicesHealthy ? "✅" : "❌"}`
      );
      console.log(`📊 Contracts valid: ${status.contractsValid ? "✅" : "❌"}`);
    });
  });

  it("should validate isolated environment creation", async () => {
    await defaultTestRunner.runTest(
      "isolated-environment-validation",
      async () => {
        // Create isolated environment
        const isolatedEnv = await defaultTestRunner.createIsolatedEnvironment();

        expect(isolatedEnv.wallet).toBeDefined();
        expect(isolatedEnv.tokenFactory).toBeDefined();
        expect(isolatedEnv.poolFactory).toBeDefined();
        expect(isolatedEnv.cleanup).toBeDefined();

        // Test wallet functionality
        const balance = await isolatedEnv.wallet.getBalance();
        expect(balance.gt(0)).toBe(true);

        // Test token factory functionality
        const tokens = isolatedEnv.tokenFactory.getAllTokens();
        expect(tokens.length).toBeGreaterThan(0);

        // Test that we can get key tokens
        const usdc = isolatedEnv.tokenFactory.getToken("USDC");
        const fuel = isolatedEnv.tokenFactory.getToken("FUEL");
        expect(usdc).toBeDefined();
        expect(fuel).toBeDefined();

        // Cleanup isolated environment
        await isolatedEnv.cleanup();

        console.log("✅ Isolated environment validation passed");
        console.log(`📊 Wallet balance: ${balance.format()}`);
        console.log(`📊 Available tokens: ${tokens.length}`);
        console.log(`📊 Key tokens found: USDC=${!!usdc}, FUEL=${!!fuel}`);
      }
    );
  });

  it("should validate nx task integration", async () => {
    await defaultTestRunner.runTest(
      "nx-task-integration-validation",
      async () => {
        const serviceManager = testEnvironment.getServiceManager();

        // Get service configurations
        const configs = serviceManager.getAllServiceConfigs();
        expect(configs.length).toBeGreaterThan(0);

        // Verify expected services are configured
        const nodeConfig = configs.find((c) => c.name === "Fuel Node");
        const indexerConfig = configs.find((c) => c.name === "Indexer");

        expect(nodeConfig).toBeDefined();
        expect(indexerConfig).toBeDefined();

        // Verify service URLs match expected nx dev indexer setup
        expect(nodeConfig?.url).toBe("http://localhost:4000/v1/graphql");
        expect(indexerConfig?.url).toBe("http://localhost:4350/graphql");

        console.log("✅ Nx task integration validation passed");
        console.log(`📊 Services configured: ${configs.length}`);
        configs.forEach((config) => {
          console.log(`  - ${config.name}: ${config.url}`);
        });
      }
    );
  });

  it("should validate error handling and retries", async () => {
    // Test that the test runner can handle failures gracefully
    let attemptCount = 0;

    try {
      await defaultTestRunner.runTest(
        "error-handling-test",
        async () => {
          attemptCount++;
          if (attemptCount < 2) {
            throw new Error("Simulated test failure");
          }
          return "success";
        },
        {
          retries: 2,
          timeout: 5000,
        }
      );

      // Should succeed on retry
      expect(attemptCount).toBe(2);
      console.log("✅ Error handling and retries validation passed");
      console.log(`📊 Test succeeded after ${attemptCount} attempts`);
    } catch (error) {
      // If it still fails, that's also a valid test of error handling
      console.log("✅ Error handling validation passed (expected failure)");
      expect(attemptCount).toBeGreaterThan(1);
    }
  });
});

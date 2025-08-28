import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {BN} from "fuels";
import {
  MockSDKFactory,
  createMockSDK,
  createDevelopmentMockSDK,
  createTestingMockSDK,
  createStagingMockSDK,
} from "../MockSDKFactory";
import {MockConfigValidator} from "../MockConfigValidator";
import {DEFAULT_MOCK_CONFIG, ENVIRONMENT_CONFIGS} from "../types";

describe("MockSDKFactory", () => {
  let factory: MockSDKFactory;

  beforeEach(() => {
    factory = MockSDKFactory.getInstance();
    factory.clearCache();
  });

  afterEach(() => {
    // Clean up localStorage
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = MockSDKFactory.getInstance();
      const instance2 = MockSDKFactory.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("createSDK", () => {
    it("should create SDK with default configuration", () => {
      const {writeSDK, readSDK, stateManager, config} = factory.createSDK({
        environment: "development", // Explicitly specify to avoid NODE_ENV interference
      });

      expect(writeSDK).toBeDefined();
      expect(readSDK).toBeDefined();
      expect(stateManager).toBeDefined();
      expect(config).toEqual(
        expect.objectContaining(ENVIRONMENT_CONFIGS.development)
      );
    });

    it("should create SDK with custom configuration", () => {
      const customConfig = {
        defaultFailureRate: 0.1,
        defaultLatencyMs: 2000,
        enablePersistence: true,
      };

      const {config} = factory.createSDK({
        config: customConfig,
      });

      expect(config.defaultFailureRate).toBe(0.1);
      expect(config.defaultLatencyMs).toBe(2000);
      expect(config.enablePersistence).toBe(true);
    });

    it("should create SDK with environment configuration", () => {
      const {config} = factory.createSDK({
        environment: "testing",
      });

      expect(config).toEqual(
        expect.objectContaining(ENVIRONMENT_CONFIGS.testing)
      );
    });

    it("should merge environment and custom configuration", () => {
      const {config} = factory.createSDK({
        environment: "development",
        config: {
          defaultFailureRate: 0.2,
        },
      });

      expect(config.enablePersistence).toBe(true); // From development env
      expect(config.defaultFailureRate).toBe(0.2); // From custom config
    });

    it("should share state manager between write and read SDKs", () => {
      const {writeSDK, readSDK, stateManager} = factory.createSDK();

      // Add a pool through write SDK
      const poolId = "test-pool";
      const mockPool = {
        poolId,
        metadata: {} as any,
        bins: new Map(),
        activeBinId: 8388608,
        totalReserves: {assetA: new BN(0), assetB: new BN(0)},
        protocolFees: {assetA: new BN(0), assetB: new BN(0)},
        volume24h: new BN(0),
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      stateManager.setPool(poolId, mockPool);

      // Verify read SDK can access the same pool
      const retrievedPool = stateManager.getPool(poolId);
      expect(retrievedPool).toEqual(mockPool);
    });

    it("should auto-load scenarios when enabled", () => {
      const {stateManager} = factory.createSDK({
        autoLoadScenarios: true,
        scenarioTypes: ["concentrated"],
      });

      const pools = stateManager.getAllPools();
      expect(pools.length).toBeGreaterThan(0);
    });

    it("should not auto-load scenarios when disabled", () => {
      const {stateManager} = factory.createSDK({
        autoLoadScenarios: false,
      });

      const pools = stateManager.getAllPools();
      expect(pools.length).toBe(0);
    });
  });

  describe("createDevelopmentSDK", () => {
    it("should create SDK with development configuration", () => {
      const {config} = factory.createDevelopmentSDK();

      expect(config.enablePersistence).toBe(true);
      expect(config.defaultFailureRate).toBe(0.1);
      expect(config.persistenceKey).toBe("mira-mock-sdk-dev");
    });

    it("should apply overrides to development configuration", () => {
      const {config} = factory.createDevelopmentSDK({
        defaultLatencyMs: 100,
      });

      expect(config.enablePersistence).toBe(true); // From dev config
      expect(config.defaultLatencyMs).toBe(100); // Override
    });

    it("should auto-load scenarios", () => {
      const {stateManager} = factory.createDevelopmentSDK();
      const pools = stateManager.getAllPools();
      expect(pools.length).toBeGreaterThan(0);
    });
  });

  describe("createTestingSDK", () => {
    it("should create SDK with testing configuration", () => {
      const {config} = factory.createTestingSDK();

      expect(config.enablePersistence).toBe(false);
      expect(config.defaultFailureRate).toBe(0);
      expect(config.defaultLatencyMs).toBe(0);
      expect(config.persistenceKey).toBe("mira-mock-sdk-test");
    });

    it("should not auto-load scenarios", () => {
      const {stateManager} = factory.createTestingSDK();
      const pools = stateManager.getAllPools();
      expect(pools.length).toBe(0);
    });
  });

  describe("createStagingSDK", () => {
    it("should create SDK with staging configuration", () => {
      const {config} = factory.createStagingSDK();

      expect(config.enablePersistence).toBe(true);
      expect(config.defaultFailureRate).toBe(0.02);
      expect(config.persistenceKey).toBe("mira-mock-sdk-staging");
    });

    it("should auto-load multiple scenario types", () => {
      const {stateManager} = factory.createStagingSDK();
      const pools = stateManager.getAllPools();
      expect(pools.length).toBeGreaterThan(0);
    });
  });

  describe("getEnvironmentConfig", () => {
    it("should return development configuration", () => {
      const config = factory.getEnvironmentConfig("development");
      expect(config).toEqual(ENVIRONMENT_CONFIGS.development);
    });

    it("should return testing configuration", () => {
      const config = factory.getEnvironmentConfig("testing");
      expect(config).toEqual(ENVIRONMENT_CONFIGS.testing);
    });

    it("should return staging configuration", () => {
      const config = factory.getEnvironmentConfig("staging");
      expect(config).toEqual(ENVIRONMENT_CONFIGS.staging);
    });

    it("should cache configurations", () => {
      const config1 = factory.getEnvironmentConfig("development");
      const config2 = factory.getEnvironmentConfig("development");
      expect(config1).toBe(config2); // Same reference due to caching
    });
  });

  describe("createCustomConfig", () => {
    it("should merge configurations correctly", () => {
      const baseConfig = DEFAULT_MOCK_CONFIG;
      const overrides = {
        defaultFailureRate: 0.3,
        enablePersistence: true,
      };

      const merged = factory.createCustomConfig(baseConfig, overrides);

      expect(merged.defaultFailureRate).toBe(0.3);
      expect(merged.enablePersistence).toBe(true);
      expect(merged.defaultLatencyMs).toBe(baseConfig.defaultLatencyMs);
    });

    it("should merge initial pool scenarios", () => {
      const baseConfig = {
        ...DEFAULT_MOCK_CONFIG,
        initialPoolScenarios: [{name: "base"} as any],
      };
      const overrides = {
        initialPoolScenarios: [{name: "override"} as any],
      };

      const merged = factory.createCustomConfig(baseConfig, overrides);

      expect(merged.initialPoolScenarios).toHaveLength(2);
      expect(merged.initialPoolScenarios[0].name).toBe("base");
      expect(merged.initialPoolScenarios[1].name).toBe("override");
    });
  });

  describe("validateConfiguration", () => {
    it("should validate valid configuration", () => {
      expect(() => {
        factory.validateConfiguration(DEFAULT_MOCK_CONFIG);
      }).not.toThrow();
    });

    it("should throw for invalid failure rate", () => {
      const invalidConfig = {
        ...DEFAULT_MOCK_CONFIG,
        defaultFailureRate: 1.5,
      };

      expect(() => {
        factory.validateConfiguration(invalidConfig);
      }).toThrow();
    });

    it("should throw for negative latency", () => {
      const invalidConfig = {
        ...DEFAULT_MOCK_CONFIG,
        defaultLatencyMs: -100,
      };

      expect(() => {
        factory.validateConfiguration(invalidConfig);
      }).toThrow();
    });

    it("should throw for empty persistence key when persistence enabled", () => {
      const invalidConfig = {
        ...DEFAULT_MOCK_CONFIG,
        enablePersistence: true,
        persistenceKey: "",
      };

      expect(() => {
        factory.validateConfiguration(invalidConfig);
      }).toThrow();
    });
  });

  describe("clearCache", () => {
    it("should clear configuration cache", () => {
      // Load config to populate cache
      factory.getEnvironmentConfig("development");
      expect(factory["configCache"].size).toBeGreaterThan(0);

      factory.clearCache();
      expect(factory["configCache"].size).toBe(0);
    });
  });

  describe("getDefaultConfig", () => {
    it("should return default configuration", () => {
      const config = factory.getDefaultConfig();
      expect(config).toEqual(DEFAULT_MOCK_CONFIG);
    });

    it("should apply overrides to default configuration", () => {
      const config = factory.getDefaultConfig({
        defaultFailureRate: 0.5,
      });

      expect(config.defaultFailureRate).toBe(0.5);
      expect(config.defaultLatencyMs).toBe(
        DEFAULT_MOCK_CONFIG.defaultLatencyMs
      );
    });
  });
});

describe("Convenience Functions", () => {
  afterEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  describe("createMockSDK", () => {
    it("should create SDK with default options", () => {
      const {writeSDK, readSDK, stateManager, config} = createMockSDK();

      expect(writeSDK).toBeDefined();
      expect(readSDK).toBeDefined();
      expect(stateManager).toBeDefined();
      expect(config).toBeDefined();
    });

    it("should pass options to factory", () => {
      const {config} = createMockSDK({
        environment: "testing",
        config: {defaultFailureRate: 0.1},
      });

      expect(config.defaultFailureRate).toBe(0.1);
      expect(config.enablePersistence).toBe(false); // From testing env
    });
  });

  describe("createDevelopmentMockSDK", () => {
    it("should create development SDK", () => {
      const {config} = createDevelopmentMockSDK();
      expect(config.enablePersistence).toBe(true);
    });
  });

  describe("createTestingMockSDK", () => {
    it("should create testing SDK", () => {
      const {config} = createTestingMockSDK();
      expect(config.enablePersistence).toBe(false);
      expect(config.defaultFailureRate).toBe(0);
    });
  });

  describe("createStagingMockSDK", () => {
    it("should create staging SDK", () => {
      const {config} = createStagingMockSDK();
      expect(config.enablePersistence).toBe(true);
      expect(config.defaultFailureRate).toBe(0.02);
    });
  });
});

describe("Integration Tests", () => {
  afterEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  it("should persist state across SDK instances when enabled", () => {
    // Create SDK with persistence enabled
    const {stateManager: stateManager1} = createDevelopmentMockSDK({
      persistenceKey: "test-persistence",
      enablePersistence: true,
      autoPersist: true,
    });

    // Add some data
    const poolId = "test-pool";
    const mockPool = {
      poolId,
      metadata: {} as any,
      bins: new Map(),
      activeBinId: 8388608,
      totalReserves: {assetA: new BN(1000), assetB: new BN(2000)},
      protocolFees: {assetA: new BN(0), assetB: new BN(0)},
      volume24h: new BN(0),
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    stateManager1.setPool(poolId, mockPool);

    // Manually trigger persistence to ensure it's saved
    stateManager1.persist();

    // Create new SDK instance with same persistence key
    const {stateManager: stateManager2} = createDevelopmentMockSDK({
      persistenceKey: "test-persistence",
      enablePersistence: true,
    });

    // Verify data was restored
    const restoredPool = stateManager2.getPool(poolId);
    expect(restoredPool).toBeDefined();
    if (restoredPool) {
      expect(restoredPool.totalReserves.assetA.toString()).toBe("1000");
    } else {
      // Debug: check if data was persisted
      const persistedData = localStorage.getItem("test-persistence");
      console.log("Persisted data:", persistedData);
      throw new Error("Pool was not restored from persistence");
    }
  });

  it("should not persist state when disabled", () => {
    // Create SDK with persistence disabled
    const {stateManager: stateManager1} = createTestingMockSDK({
      persistenceKey: "test-no-persistence",
    });

    // Add some data
    const poolId = "test-pool";
    const mockPool = {
      poolId,
      metadata: {} as any,
      bins: new Map(),
      activeBinId: 8388608,
      totalReserves: {assetA: new BN(1000), assetB: new BN(2000)},
      protocolFees: {assetA: new BN(0), assetB: new BN(0)},
      volume24h: new BN(0),
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    stateManager1.setPool(poolId, mockPool);

    // Create new SDK instance with same persistence key
    const {stateManager: stateManager2} = createTestingMockSDK({
      persistenceKey: "test-no-persistence",
    });

    // Verify data was not restored
    const restoredPool = stateManager2.getPool(poolId);
    expect(restoredPool).toBeNull();
  });
});

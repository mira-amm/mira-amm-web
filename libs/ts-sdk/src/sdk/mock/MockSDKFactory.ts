import {BN} from "fuels";
import {
  MockSDKConfig,
  MockSDKInitOptions,
  MockEnvironmentConfig,
  ENVIRONMENT_CONFIGS,
  DEFAULT_MOCK_CONFIG,
  MockAccount,
  MockProvider,
} from "./types";
import {MockStateManager} from "./MockStateManager";
import {MockMiraAmmV2} from "./MockMiraAmmV2";
import {MockReadonlyMiraAmmV2} from "./MockReadonlyMiraAmmV2";
import {MockConfigValidator} from "./MockConfigValidator";

/**
 * Factory class for creating and configuring mock SDK instances
 */
export class MockSDKFactory {
  private static instance: MockSDKFactory;
  private configCache: Map<string, MockSDKConfig> = new Map();

  private constructor() {}

  /**
   * Get singleton instance of the factory
   */
  static getInstance(): MockSDKFactory {
    if (!MockSDKFactory.instance) {
      MockSDKFactory.instance = new MockSDKFactory();
    }
    return MockSDKFactory.instance;
  }

  /**
   * Create a new mock SDK instance with configuration
   * @param options - Initialization options
   * @returns Configured mock SDK instance
   */
  createSDK(options: MockSDKInitOptions = {}): {
    writeSDK: MockMiraAmmV2;
    readSDK: MockReadonlyMiraAmmV2;
    stateManager: MockStateManager;
    config: MockSDKConfig;
  } {
    // Resolve configuration
    const config = this.resolveConfiguration(options);

    // Validate configuration
    this.validateConfiguration(config);

    // Create account if not provided
    const account = options.account || this.createDefaultAccount();

    // Create provider if not provided
    const provider = options.provider || this.createDefaultProvider();

    // Create state manager
    const stateManager = new MockStateManager(config);

    // Auto-load scenarios if requested
    if (options.autoLoadScenarios !== false) {
      this.loadInitialScenarios(stateManager, options.scenarioTypes);
    }

    // Create SDK instances
    const writeSDK = new MockMiraAmmV2(account, config, stateManager);
    const readSDK = new MockReadonlyMiraAmmV2(
      provider,
      undefined,
      stateManager
    );

    return {
      writeSDK,
      readSDK,
      stateManager,
      config,
    };
  }

  /**
   * Create a development-optimized SDK instance
   */
  createDevelopmentSDK(overrides: Partial<MockSDKConfig> = {}): {
    writeSDK: MockMiraAmmV2;
    readSDK: MockReadonlyMiraAmmV2;
    stateManager: MockStateManager;
    config: MockSDKConfig;
  } {
    return this.createSDK({
      environment: "development",
      config: overrides,
      autoLoadScenarios: true,
      scenarioTypes: ["concentrated", "wide"],
    });
  }

  /**
   * Create a testing-optimized SDK instance
   */
  createTestingSDK(overrides: Partial<MockSDKConfig> = {}): {
    writeSDK: MockMiraAmmV2;
    readSDK: MockReadonlyMiraAmmV2;
    stateManager: MockStateManager;
    config: MockSDKConfig;
  } {
    return this.createSDK({
      environment: "testing",
      config: overrides,
      autoLoadScenarios: false, // Tests should set up their own scenarios
    });
  }

  /**
   * Create a staging-optimized SDK instance
   */
  createStagingSDK(overrides: Partial<MockSDKConfig> = {}): {
    writeSDK: MockMiraAmmV2;
    readSDK: MockReadonlyMiraAmmV2;
    stateManager: MockStateManager;
    config: MockSDKConfig;
  } {
    return this.createSDK({
      environment: "staging",
      config: overrides,
      autoLoadScenarios: true,
      scenarioTypes: ["concentrated", "wide", "asymmetric"],
    });
  }

  /**
   * Get configuration for a specific environment
   * @param environment - Environment name
   * @returns Environment configuration
   */
  getEnvironmentConfig(
    environment: keyof MockEnvironmentConfig
  ): MockSDKConfig {
    const cacheKey = `env_${environment}`;
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey)!;
    }

    const config = ENVIRONMENT_CONFIGS[environment];
    this.configCache.set(cacheKey, config);
    return config;
  }

  /**
   * Create a custom configuration by merging base config with overrides
   * @param baseConfig - Base configuration
   * @param overrides - Configuration overrides
   * @returns Merged configuration
   */
  createCustomConfig(
    baseConfig: MockSDKConfig,
    overrides: Partial<MockSDKConfig>
  ): MockSDKConfig {
    return {
      ...baseConfig,
      ...overrides,
      // Merge arrays properly
      initialPoolScenarios: [
        ...baseConfig.initialPoolScenarios,
        ...(overrides.initialPoolScenarios || []),
      ],
    };
  }

  /**
   * Validate configuration and throw errors for invalid settings
   * @param config - Configuration to validate
   */
  validateConfiguration(config: MockSDKConfig): void {
    MockConfigValidator.validateAndThrow(config);
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache.clear();
  }

  /**
   * Get default configuration with optional overrides
   * @param overrides - Configuration overrides
   * @returns Default configuration with overrides applied
   */
  getDefaultConfig(overrides: Partial<MockSDKConfig> = {}): MockSDKConfig {
    return {
      ...DEFAULT_MOCK_CONFIG,
      ...overrides,
    };
  }

  // ===== Private Helper Methods =====

  /**
   * Resolve configuration from options
   */
  private resolveConfiguration(options: MockSDKInitOptions): MockSDKConfig {
    let baseConfig: MockSDKConfig;

    if (options.environment) {
      baseConfig = this.getEnvironmentConfig(options.environment);
    } else {
      // Try to detect environment from NODE_ENV or default to development
      const env = this.detectEnvironment();
      baseConfig = this.getEnvironmentConfig(env);
    }

    // Apply custom overrides
    if (options.config) {
      return this.createCustomConfig(baseConfig, options.config);
    }

    return baseConfig;
  }

  /**
   * Detect environment from NODE_ENV or other indicators
   */
  private detectEnvironment(): keyof MockEnvironmentConfig {
    if (typeof process !== "undefined" && process.env) {
      const nodeEnv = process.env.NODE_ENV?.toLowerCase();
      switch (nodeEnv) {
        case "test":
        case "testing":
          return "testing";
        case "staging":
        case "stage":
          return "staging";
        case "production":
        case "prod":
          return "staging"; // Use staging config for production
        case "development":
        case "dev":
        default:
          return "development";
      }
    }

    // Browser environment - default to development
    return "development";
  }

  /**
   * Create a default mock account with initial balances
   */
  private createDefaultAccount(): MockAccount {
    const balances = new Map<string, BN>();

    // Add some default balances for common test assets
    balances.set(
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      new BN("1000000000000000000")
    ); // ETH
    balances.set(
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      new BN("1000000000000")
    ); // USDC (6 decimals)

    return {
      address:
        "0x1234567890123456789012345678901234567890123456789012345678901234",
      balances,
      getBalance(assetId: string): BN {
        return this.balances.get(assetId) || new BN(0);
      },
      updateBalance(assetId: string, amount: BN): void {
        this.balances.set(assetId, amount);
      },
      hasBalance(assetId: string, amount: BN): boolean {
        const balance = this.getBalance(assetId);
        return balance.gte(amount);
      },
    };
  }

  /**
   * Create a default mock provider
   */
  private createDefaultProvider(): MockProvider {
    return {
      url: "http://localhost:4000/graphql",
      network: {
        chainId: 0,
        name: "fuel-testnet",
      },
      async getBlockNumber(): Promise<number> {
        return Math.floor(Date.now() / 1000); // Use timestamp as block number
      },
      async getGasPrice(): Promise<BN> {
        return new BN("1000000000"); // 1 gwei
      },
    };
  }

  /**
   * Load initial scenarios based on configuration
   */
  private loadInitialScenarios(
    stateManager: MockStateManager,
    scenarioTypes?: Array<"uniform" | "concentrated" | "wide" | "asymmetric">
  ): void {
    if (!scenarioTypes || scenarioTypes.length === 0) {
      // Load default scenarios
      stateManager.loadEthUsdcScenarios(["concentrated"]);
      stateManager.loadUsdcEthScenarios(["wide"]);
    } else {
      // Load ETH/USDC scenarios
      const ethUsdcTypes = scenarioTypes.filter((type) =>
        ["concentrated", "wide"].includes(type)
      ) as Array<"uniform" | "concentrated" | "wide" | "asymmetric">;

      if (ethUsdcTypes.length > 0) {
        stateManager.loadEthUsdcScenarios(ethUsdcTypes);
      }

      // Load USDC/ETH scenarios
      const usdcEthTypes = scenarioTypes.filter((type) =>
        ["wide", "asymmetric"].includes(type)
      ) as Array<"uniform" | "concentrated" | "wide" | "asymmetric">;

      if (usdcEthTypes.length > 0) {
        stateManager.loadUsdcEthScenarios(usdcEthTypes);
      }
    }
  }
}

/**
 * Convenience function to create a development SDK instance
 */
export function createMockSDK(options: MockSDKInitOptions = {}) {
  return MockSDKFactory.getInstance().createSDK(options);
}

/**
 * Convenience function to create a development-optimized SDK instance
 */
export function createDevelopmentMockSDK(
  overrides: Partial<MockSDKConfig> = {}
) {
  return MockSDKFactory.getInstance().createDevelopmentSDK(overrides);
}

/**
 * Convenience function to create a testing-optimized SDK instance
 */
export function createTestingMockSDK(overrides: Partial<MockSDKConfig> = {}) {
  return MockSDKFactory.getInstance().createTestingSDK(overrides);
}

/**
 * Convenience function to create a staging-optimized SDK instance
 */
export function createStagingMockSDK(overrides: Partial<MockSDKConfig> = {}) {
  return MockSDKFactory.getInstance().createStagingSDK(overrides);
}

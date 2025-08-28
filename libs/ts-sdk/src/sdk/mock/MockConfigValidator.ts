import {MockSDKConfig, MockEnvironmentConfig} from "./types";

/**
 * Configuration validation errors
 */
export class MockConfigValidationError extends Error {
  constructor(
    public readonly errors: string[],
    message = `Configuration validation failed: ${errors.join(", ")}`
  ) {
    super(message);
    this.name = "MockConfigValidationError";
  }
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Configuration validator for mock SDK
 */
export class MockConfigValidator {
  /**
   * Validate a mock SDK configuration
   * @param config - Configuration to validate
   * @returns Validation result
   */
  static validate(config: MockSDKConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate failure rate
    if (config.defaultFailureRate < 0 || config.defaultFailureRate > 1) {
      errors.push("defaultFailureRate must be between 0 and 1");
    }

    // Validate latency
    if (config.defaultLatencyMs < 0) {
      errors.push("defaultLatencyMs must be non-negative");
    }

    if (config.defaultLatencyMs > 10000) {
      warnings.push(
        "defaultLatencyMs is very high (>10s), this may slow down tests"
      );
    }

    // Validate persistence settings
    if (config.enablePersistence) {
      if (!config.persistenceKey || !config.persistenceKey.trim()) {
        errors.push(
          "persistenceKey cannot be empty when persistence is enabled"
        );
      }

      if (config.persistenceKey.length > 100) {
        warnings.push(
          "persistenceKey is very long, this may cause issues in some browsers"
        );
      }

      if (!config.autoPersist && config.enablePersistence) {
        warnings.push(
          "Persistence is enabled but autoPersist is false - state may not be saved automatically"
        );
      }
    }

    // Validate max persisted transactions
    if (config.maxPersistedTransactions < 0) {
      errors.push("maxPersistedTransactions must be non-negative");
    }

    if (config.maxPersistedTransactions > 10000) {
      warnings.push(
        "maxPersistedTransactions is very high, this may cause performance issues"
      );
    }

    // Validate persistence version
    if (!config.persistenceVersion || !config.persistenceVersion.trim()) {
      errors.push("persistenceVersion cannot be empty");
    }

    if (!/^\d+\.\d+\.\d+$/.test(config.persistenceVersion)) {
      warnings.push(
        "persistenceVersion should follow semantic versioning (x.y.z)"
      );
    }

    // Validate initial pool scenarios
    if (config.initialPoolScenarios.length > 50) {
      warnings.push(
        "Large number of initial pool scenarios may slow down initialization"
      );
    }

    // Cross-validation checks
    if (config.enableRealisticGas && config.defaultLatencyMs === 0) {
      warnings.push(
        "Realistic gas is enabled but latency is 0 - gas calculations may not be realistic"
      );
    }

    if (config.enableSlippageSimulation && config.defaultFailureRate === 0) {
      warnings.push(
        "Slippage simulation is enabled but failure rate is 0 - slippage failures won't occur"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate and throw if configuration is invalid
   * @param config - Configuration to validate
   * @throws MockConfigValidationError if configuration is invalid
   */
  static validateAndThrow(config: MockSDKConfig): void {
    const result = this.validate(config);
    if (!result.isValid) {
      throw new MockConfigValidationError(result.errors);
    }
  }

  /**
   * Validate environment configuration
   * @param envConfig - Environment configuration to validate
   * @returns Validation result with environment-specific checks
   */
  static validateEnvironmentConfig(
    envConfig: MockEnvironmentConfig
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate each environment
    for (const [envName, config] of Object.entries(envConfig)) {
      const envResult = this.validate(config);

      // Prefix errors with environment name
      errors.push(...envResult.errors.map((error) => `${envName}: ${error}`));
      warnings.push(
        ...envResult.warnings.map((warning) => `${envName}: ${warning}`)
      );

      // Environment-specific validations
      if (envName === "testing") {
        if (config.enablePersistence) {
          warnings.push(
            `${envName}: Persistence is enabled in testing environment - this may cause test interference`
          );
        }

        if (config.defaultFailureRate > 0.1) {
          warnings.push(
            `${envName}: High failure rate in testing environment may cause test flakiness`
          );
        }

        if (config.defaultLatencyMs > 100) {
          warnings.push(
            `${envName}: High latency in testing environment may slow down tests`
          );
        }
      }

      if (envName === "development") {
        if (!config.enablePersistence) {
          warnings.push(
            `${envName}: Persistence is disabled in development - state won't persist across sessions`
          );
        }
      }

      if (envName === "staging") {
        if (config.defaultFailureRate > 0.05) {
          warnings.push(
            `${envName}: High failure rate in staging may interfere with demos`
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get recommended configuration for a specific use case
   * @param useCase - Use case identifier
   * @returns Recommended configuration
   */
  static getRecommendedConfig(
    useCase: "unit-testing" | "integration-testing" | "development" | "demo"
  ): Partial<MockSDKConfig> {
    switch (useCase) {
      case "unit-testing":
        return {
          enablePersistence: false,
          autoPersist: false,
          defaultFailureRate: 0,
          defaultLatencyMs: 0,
          enableRealisticGas: false,
          enablePriceImpact: true,
          enableSlippageSimulation: false,
          maxPersistedTransactions: 10,
          initialPoolScenarios: [],
        };

      case "integration-testing":
        return {
          enablePersistence: false,
          autoPersist: false,
          defaultFailureRate: 0.01,
          defaultLatencyMs: 50,
          enableRealisticGas: true,
          enablePriceImpact: true,
          enableSlippageSimulation: true,
          maxPersistedTransactions: 100,
          initialPoolScenarios: [],
        };

      case "development":
        return {
          enablePersistence: true,
          autoPersist: true,
          defaultFailureRate: 0.05,
          defaultLatencyMs: 500,
          enableRealisticGas: true,
          enablePriceImpact: true,
          enableSlippageSimulation: true,
          maxPersistedTransactions: 500,
        };

      case "demo":
        return {
          enablePersistence: true,
          autoPersist: true,
          defaultFailureRate: 0.02,
          defaultLatencyMs: 800,
          enableRealisticGas: true,
          enablePriceImpact: true,
          enableSlippageSimulation: true,
          maxPersistedTransactions: 1000,
        };

      default:
        return {};
    }
  }

  /**
   * Merge configurations with validation
   * @param baseConfig - Base configuration
   * @param overrides - Configuration overrides
   * @returns Merged and validated configuration
   */
  static mergeAndValidate(
    baseConfig: MockSDKConfig,
    overrides: Partial<MockSDKConfig>
  ): MockSDKConfig {
    const merged = {
      ...baseConfig,
      ...overrides,
      // Handle array merging properly
      initialPoolScenarios: [
        ...baseConfig.initialPoolScenarios,
        ...(overrides.initialPoolScenarios || []),
      ],
    };

    this.validateAndThrow(merged);
    return merged;
  }
}

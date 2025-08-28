import {describe, it, expect} from "vitest";
import {
  MockConfigValidator,
  MockConfigValidationError,
} from "../MockConfigValidator";
import {DEFAULT_MOCK_CONFIG, ENVIRONMENT_CONFIGS} from "../types";

describe("MockConfigValidator", () => {
  describe("validate", () => {
    it("should validate valid configuration", () => {
      const result = MockConfigValidator.validate(DEFAULT_MOCK_CONFIG);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect invalid failure rate", () => {
      const invalidConfig = {
        ...DEFAULT_MOCK_CONFIG,
        defaultFailureRate: 1.5,
      };

      const result = MockConfigValidator.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "defaultFailureRate must be between 0 and 1"
      );
    });

    it("should detect negative failure rate", () => {
      const invalidConfig = {
        ...DEFAULT_MOCK_CONFIG,
        defaultFailureRate: -0.1,
      };

      const result = MockConfigValidator.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "defaultFailureRate must be between 0 and 1"
      );
    });

    it("should detect negative latency", () => {
      const invalidConfig = {
        ...DEFAULT_MOCK_CONFIG,
        defaultLatencyMs: -100,
      };

      const result = MockConfigValidator.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("defaultLatencyMs must be non-negative");
    });

    it("should warn about high latency", () => {
      const configWithHighLatency = {
        ...DEFAULT_MOCK_CONFIG,
        defaultLatencyMs: 15000,
      };

      const result = MockConfigValidator.validate(configWithHighLatency);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "defaultLatencyMs is very high (>10s), this may slow down tests"
      );
    });

    it("should detect empty persistence key when persistence enabled", () => {
      const invalidConfig = {
        ...DEFAULT_MOCK_CONFIG,
        enablePersistence: true,
        persistenceKey: "",
      };

      const result = MockConfigValidator.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "persistenceKey cannot be empty when persistence is enabled"
      );
    });

    it("should detect whitespace-only persistence key", () => {
      const invalidConfig = {
        ...DEFAULT_MOCK_CONFIG,
        enablePersistence: true,
        persistenceKey: "   ",
      };

      const result = MockConfigValidator.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "persistenceKey cannot be empty when persistence is enabled"
      );
    });

    it("should warn about long persistence key", () => {
      const configWithLongKey = {
        ...DEFAULT_MOCK_CONFIG,
        enablePersistence: true,
        persistenceKey: "a".repeat(150),
      };

      const result = MockConfigValidator.validate(configWithLongKey);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "persistenceKey is very long, this may cause issues in some browsers"
      );
    });

    it("should warn when persistence enabled but autoPersist disabled", () => {
      const config = {
        ...DEFAULT_MOCK_CONFIG,
        enablePersistence: true,
        autoPersist: false,
      };

      const result = MockConfigValidator.validate(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "Persistence is enabled but autoPersist is false - state may not be saved automatically"
      );
    });

    it("should detect negative maxPersistedTransactions", () => {
      const invalidConfig = {
        ...DEFAULT_MOCK_CONFIG,
        maxPersistedTransactions: -10,
      };

      const result = MockConfigValidator.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "maxPersistedTransactions must be non-negative"
      );
    });

    it("should warn about high maxPersistedTransactions", () => {
      const config = {
        ...DEFAULT_MOCK_CONFIG,
        maxPersistedTransactions: 15000,
      };

      const result = MockConfigValidator.validate(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "maxPersistedTransactions is very high, this may cause performance issues"
      );
    });

    it("should detect empty persistence version", () => {
      const invalidConfig = {
        ...DEFAULT_MOCK_CONFIG,
        persistenceVersion: "",
      };

      const result = MockConfigValidator.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("persistenceVersion cannot be empty");
    });

    it("should warn about non-semver persistence version", () => {
      const config = {
        ...DEFAULT_MOCK_CONFIG,
        persistenceVersion: "v1.0",
      };

      const result = MockConfigValidator.validate(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "persistenceVersion should follow semantic versioning (x.y.z)"
      );
    });

    it("should warn about many initial pool scenarios", () => {
      const config = {
        ...DEFAULT_MOCK_CONFIG,
        initialPoolScenarios: new Array(60).fill({name: "test"}),
      };

      const result = MockConfigValidator.validate(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "Large number of initial pool scenarios may slow down initialization"
      );
    });

    it("should warn about realistic gas with zero latency", () => {
      const config = {
        ...DEFAULT_MOCK_CONFIG,
        enableRealisticGas: true,
        defaultLatencyMs: 0,
      };

      const result = MockConfigValidator.validate(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "Realistic gas is enabled but latency is 0 - gas calculations may not be realistic"
      );
    });

    it("should warn about slippage simulation with zero failure rate", () => {
      const config = {
        ...DEFAULT_MOCK_CONFIG,
        enableSlippageSimulation: true,
        defaultFailureRate: 0,
      };

      const result = MockConfigValidator.validate(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "Slippage simulation is enabled but failure rate is 0 - slippage failures won't occur"
      );
    });

    it("should collect multiple errors and warnings", () => {
      const invalidConfig = {
        ...DEFAULT_MOCK_CONFIG,
        defaultFailureRate: 2.0,
        defaultLatencyMs: -500,
        enablePersistence: true,
        persistenceKey: "",
        maxPersistedTransactions: -1,
        persistenceVersion: "",
      };

      const result = MockConfigValidator.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe("validateAndThrow", () => {
    it("should not throw for valid configuration", () => {
      expect(() => {
        MockConfigValidator.validateAndThrow(DEFAULT_MOCK_CONFIG);
      }).not.toThrow();
    });

    it("should throw MockConfigValidationError for invalid configuration", () => {
      const invalidConfig = {
        ...DEFAULT_MOCK_CONFIG,
        defaultFailureRate: 1.5,
      };

      expect(() => {
        MockConfigValidator.validateAndThrow(invalidConfig);
      }).toThrow(MockConfigValidationError);
    });

    it("should include all errors in thrown exception", () => {
      const invalidConfig = {
        ...DEFAULT_MOCK_CONFIG,
        defaultFailureRate: 1.5,
        defaultLatencyMs: -100,
      };

      try {
        MockConfigValidator.validateAndThrow(invalidConfig);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(MockConfigValidationError);
        const validationError = error as MockConfigValidationError;
        expect(validationError.errors).toHaveLength(2);
        expect(validationError.errors).toContain(
          "defaultFailureRate must be between 0 and 1"
        );
        expect(validationError.errors).toContain(
          "defaultLatencyMs must be non-negative"
        );
      }
    });
  });

  describe("validateEnvironmentConfig", () => {
    it("should validate all environment configurations", () => {
      const result =
        MockConfigValidator.validateEnvironmentConfig(ENVIRONMENT_CONFIGS);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect errors in specific environments", () => {
      const invalidEnvConfig = {
        development: {
          ...ENVIRONMENT_CONFIGS.development,
          defaultFailureRate: 1.5,
        },
        testing: ENVIRONMENT_CONFIGS.testing,
        staging: ENVIRONMENT_CONFIGS.staging,
      };

      const result =
        MockConfigValidator.validateEnvironmentConfig(invalidEnvConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "development: defaultFailureRate must be between 0 and 1"
      );
    });

    it("should warn about persistence in testing environment", () => {
      const envConfigWithTestPersistence = {
        development: ENVIRONMENT_CONFIGS.development,
        testing: {
          ...ENVIRONMENT_CONFIGS.testing,
          enablePersistence: true,
        },
        staging: ENVIRONMENT_CONFIGS.staging,
      };

      const result = MockConfigValidator.validateEnvironmentConfig(
        envConfigWithTestPersistence
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "testing: Persistence is enabled in testing environment - this may cause test interference"
      );
    });

    it("should warn about high failure rate in testing", () => {
      const envConfigWithHighTestFailure = {
        development: ENVIRONMENT_CONFIGS.development,
        testing: {
          ...ENVIRONMENT_CONFIGS.testing,
          defaultFailureRate: 0.2,
        },
        staging: ENVIRONMENT_CONFIGS.staging,
      };

      const result = MockConfigValidator.validateEnvironmentConfig(
        envConfigWithHighTestFailure
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "testing: High failure rate in testing environment may cause test flakiness"
      );
    });

    it("should warn about high latency in testing", () => {
      const envConfigWithHighTestLatency = {
        development: ENVIRONMENT_CONFIGS.development,
        testing: {
          ...ENVIRONMENT_CONFIGS.testing,
          defaultLatencyMs: 500,
        },
        staging: ENVIRONMENT_CONFIGS.staging,
      };

      const result = MockConfigValidator.validateEnvironmentConfig(
        envConfigWithHighTestLatency
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "testing: High latency in testing environment may slow down tests"
      );
    });

    it("should warn about disabled persistence in development", () => {
      const envConfigWithoutDevPersistence = {
        development: {
          ...ENVIRONMENT_CONFIGS.development,
          enablePersistence: false,
        },
        testing: ENVIRONMENT_CONFIGS.testing,
        staging: ENVIRONMENT_CONFIGS.staging,
      };

      const result = MockConfigValidator.validateEnvironmentConfig(
        envConfigWithoutDevPersistence
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "development: Persistence is disabled in development - state won't persist across sessions"
      );
    });

    it("should warn about high failure rate in staging", () => {
      const envConfigWithHighStagingFailure = {
        development: ENVIRONMENT_CONFIGS.development,
        testing: ENVIRONMENT_CONFIGS.testing,
        staging: {
          ...ENVIRONMENT_CONFIGS.staging,
          defaultFailureRate: 0.1,
        },
      };

      const result = MockConfigValidator.validateEnvironmentConfig(
        envConfigWithHighStagingFailure
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "staging: High failure rate in staging may interfere with demos"
      );
    });
  });

  describe("getRecommendedConfig", () => {
    it("should return unit testing configuration", () => {
      const config = MockConfigValidator.getRecommendedConfig("unit-testing");

      expect(config.enablePersistence).toBe(false);
      expect(config.defaultFailureRate).toBe(0);
      expect(config.defaultLatencyMs).toBe(0);
      expect(config.enableRealisticGas).toBe(false);
      expect(config.enableSlippageSimulation).toBe(false);
    });

    it("should return integration testing configuration", () => {
      const config = MockConfigValidator.getRecommendedConfig(
        "integration-testing"
      );

      expect(config.enablePersistence).toBe(false);
      expect(config.defaultFailureRate).toBe(0.01);
      expect(config.defaultLatencyMs).toBe(50);
      expect(config.enableRealisticGas).toBe(true);
      expect(config.enableSlippageSimulation).toBe(true);
    });

    it("should return development configuration", () => {
      const config = MockConfigValidator.getRecommendedConfig("development");

      expect(config.enablePersistence).toBe(true);
      expect(config.defaultFailureRate).toBe(0.05);
      expect(config.defaultLatencyMs).toBe(500);
      expect(config.enableRealisticGas).toBe(true);
    });

    it("should return demo configuration", () => {
      const config = MockConfigValidator.getRecommendedConfig("demo");

      expect(config.enablePersistence).toBe(true);
      expect(config.defaultFailureRate).toBe(0.02);
      expect(config.defaultLatencyMs).toBe(800);
      expect(config.enableRealisticGas).toBe(true);
    });

    it("should return empty config for unknown use case", () => {
      const config = MockConfigValidator.getRecommendedConfig("unknown" as any);
      expect(config).toEqual({});
    });
  });

  describe("mergeAndValidate", () => {
    it("should merge configurations and validate", () => {
      const baseConfig = DEFAULT_MOCK_CONFIG;
      const overrides = {
        defaultFailureRate: 0.1,
        enablePersistence: true,
      };

      const merged = MockConfigValidator.mergeAndValidate(
        baseConfig,
        overrides
      );

      expect(merged.defaultFailureRate).toBe(0.1);
      expect(merged.enablePersistence).toBe(true);
      expect(merged.defaultLatencyMs).toBe(baseConfig.defaultLatencyMs);
    });

    it("should throw for invalid merged configuration", () => {
      const baseConfig = DEFAULT_MOCK_CONFIG;
      const invalidOverrides = {
        defaultFailureRate: 1.5,
      };

      expect(() => {
        MockConfigValidator.mergeAndValidate(baseConfig, invalidOverrides);
      }).toThrow(MockConfigValidationError);
    });

    it("should merge initial pool scenarios arrays", () => {
      const baseConfig = {
        ...DEFAULT_MOCK_CONFIG,
        initialPoolScenarios: [{name: "base"} as any],
      };
      const overrides = {
        initialPoolScenarios: [{name: "override"} as any],
      };

      const merged = MockConfigValidator.mergeAndValidate(
        baseConfig,
        overrides
      );

      expect(merged.initialPoolScenarios).toHaveLength(2);
      expect(merged.initialPoolScenarios[0].name).toBe("base");
      expect(merged.initialPoolScenarios[1].name).toBe("override");
    });
  });
});

describe("MockConfigValidationError", () => {
  it("should create error with errors array", () => {
    const errors = ["error1", "error2"];
    const error = new MockConfigValidationError(errors);

    expect(error.name).toBe("MockConfigValidationError");
    expect(error.errors).toEqual(errors);
    expect(error.message).toContain("error1");
    expect(error.message).toContain("error2");
  });

  it("should create error with custom message", () => {
    const errors = ["error1"];
    const customMessage = "Custom validation message";
    const error = new MockConfigValidationError(errors, customMessage);

    expect(error.message).toBe(customMessage);
    expect(error.errors).toEqual(errors);
  });
});

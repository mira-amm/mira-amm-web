import {BN, BigNumberish} from "fuels";
import {MockErrorType, MockError, MockSDKConfig} from "./types";
import {PoolIdV2} from "../model";

/**
 * Configuration for operation-specific error rates
 */
export interface OperationErrorConfig {
  /** Base failure rate for this operation (0-1) */
  failureRate: number;
  /** Specific error type probabilities */
  errorDistribution: {
    [key in MockErrorType]?: number;
  };
}

/**
 * Configuration for error simulation scenarios
 */
export interface ErrorScenarioConfig {
  /** Scenario name for identification */
  name: string;
  /** Description of the scenario */
  description: string;
  /** Operation-specific configurations */
  operations: {
    [operation: string]: OperationErrorConfig;
  };
  /** Global error conditions */
  globalConditions?: {
    /** Simulate network instability */
    networkInstability?: boolean;
    /** Simulate high gas prices */
    highGasPrices?: boolean;
    /** Simulate low liquidity conditions */
    lowLiquidity?: boolean;
  };
}

/**
 * MockErrorSimulator provides realistic error condition simulation
 *
 * Features:
 * - Configurable failure rates per operation type
 * - Realistic error messages matching real SDK patterns
 * - Context-aware error generation based on operation parameters
 * - Predefined error scenarios for common testing cases
 */
export class MockErrorSimulator {
  private config: MockSDKConfig;
  private operationConfigs: Map<string, OperationErrorConfig> = new Map();
  private currentScenario?: ErrorScenarioConfig;

  constructor(config: MockSDKConfig) {
    this.config = config;
    this.initializeDefaultConfigurations();
  }

  /**
   * Check if an error should be simulated for the given operation
   * @param operation - Operation name (addLiquidity, removeLiquidity, swap, createPool)
   * @param context - Operation context for contextual error generation
   * @returns True if an error should be simulated
   */
  shouldSimulateError(operation: string, context?: any): boolean {
    const operationConfig = this.operationConfigs.get(operation);
    const failureRate =
      operationConfig?.failureRate ?? this.config.defaultFailureRate;

    // Apply scenario-specific conditions
    if (this.currentScenario?.globalConditions) {
      const adjustedRate = this.applyScenarioConditions(
        failureRate,
        operation,
        context
      );
      return Math.random() < adjustedRate;
    }

    return Math.random() < failureRate;
  }

  /**
   * Generate a realistic error for the given operation
   * @param operation - Operation name
   * @param context - Operation context for error customization
   * @returns MockError with realistic message and context
   */
  generateError(operation: string, context: any = {}): MockError {
    const operationConfig = this.operationConfigs.get(operation);
    const errorType = this.selectErrorType(operation, operationConfig, context);
    const message = this.generateErrorMessage(errorType, operation, context);

    return new MockError(errorType, message, {
      operation,
      ...context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Set error rate for a specific operation
   * @param operation - Operation name
   * @param rate - Failure rate (0-1)
   */
  setErrorRate(operation: string, rate: number): void {
    if (rate < 0 || rate > 1) {
      throw new Error("Error rate must be between 0 and 1");
    }

    const existing = this.operationConfigs.get(operation) || {
      failureRate: rate,
      errorDistribution: {},
    };

    this.operationConfigs.set(operation, {
      ...existing,
      failureRate: rate,
    });
  }

  /**
   * Set error distribution for a specific operation
   * @param operation - Operation name
   * @param distribution - Map of error types to their probabilities
   */
  setErrorDistribution(
    operation: string,
    distribution: {[key in MockErrorType]?: number}
  ): void {
    const existing = this.operationConfigs.get(operation) || {
      failureRate: this.config.defaultFailureRate,
      errorDistribution: {},
    };

    this.operationConfigs.set(operation, {
      ...existing,
      errorDistribution: distribution,
    });
  }

  /**
   * Load a predefined error scenario
   * @param scenario - Error scenario configuration
   */
  loadScenario(scenario: ErrorScenarioConfig): void {
    this.currentScenario = scenario;

    // Apply scenario configurations
    for (const [operation, config] of Object.entries(scenario.operations)) {
      this.operationConfigs.set(operation, config);
    }
  }

  /**
   * Clear current scenario and reset to defaults
   */
  clearScenario(): void {
    this.currentScenario = undefined;
    this.initializeDefaultConfigurations();
  }

  /**
   * Get current error configuration for an operation
   * @param operation - Operation name
   * @returns Current error configuration
   */
  getErrorConfig(operation: string): OperationErrorConfig | undefined {
    return this.operationConfigs.get(operation);
  }

  /**
   * Get all available predefined scenarios
   * @returns Array of predefined error scenarios
   */
  static getPredefinedScenarios(): ErrorScenarioConfig[] {
    return [
      {
        name: "network_instability",
        description: "Simulates network connection issues and timeouts",
        operations: {
          addLiquidity: {
            failureRate: 0.15,
            errorDistribution: {
              [MockErrorType.NETWORK_ERROR]: 0.7,
              [MockErrorType.GAS_ESTIMATION_FAILED]: 0.3,
            },
          },
          removeLiquidity: {
            failureRate: 0.12,
            errorDistribution: {
              [MockErrorType.NETWORK_ERROR]: 0.8,
              [MockErrorType.DEADLINE_EXCEEDED]: 0.2,
            },
          },
          swap: {
            failureRate: 0.1,
            errorDistribution: {
              [MockErrorType.NETWORK_ERROR]: 0.6,
              [MockErrorType.SLIPPAGE_EXCEEDED]: 0.4,
            },
          },
          createPool: {
            failureRate: 0.2,
            errorDistribution: {
              [MockErrorType.NETWORK_ERROR]: 0.9,
              [MockErrorType.GAS_ESTIMATION_FAILED]: 0.1,
            },
          },
        },
        globalConditions: {
          networkInstability: true,
        },
      },
      {
        name: "low_liquidity",
        description:
          "Simulates low liquidity conditions with frequent slippage",
        operations: {
          addLiquidity: {
            failureRate: 0.05,
            errorDistribution: {
              [MockErrorType.INSUFFICIENT_LIQUIDITY]: 0.6,
              [MockErrorType.SLIPPAGE_EXCEEDED]: 0.4,
            },
          },
          removeLiquidity: {
            failureRate: 0.08,
            errorDistribution: {
              [MockErrorType.INSUFFICIENT_LIQUIDITY]: 0.7,
              [MockErrorType.SLIPPAGE_EXCEEDED]: 0.3,
            },
          },
          swap: {
            failureRate: 0.25,
            errorDistribution: {
              [MockErrorType.INSUFFICIENT_LIQUIDITY]: 0.5,
              [MockErrorType.SLIPPAGE_EXCEEDED]: 0.5,
            },
          },
          createPool: {
            failureRate: 0.02,
            errorDistribution: {
              [MockErrorType.INSUFFICIENT_BALANCE]: 1.0,
            },
          },
        },
        globalConditions: {
          lowLiquidity: true,
        },
      },
      {
        name: "high_gas_environment",
        description:
          "Simulates high gas price environment with estimation failures",
        operations: {
          addLiquidity: {
            failureRate: 0.1,
            errorDistribution: {
              [MockErrorType.GAS_ESTIMATION_FAILED]: 0.8,
              [MockErrorType.INSUFFICIENT_BALANCE]: 0.2,
            },
          },
          removeLiquidity: {
            failureRate: 0.08,
            errorDistribution: {
              [MockErrorType.GAS_ESTIMATION_FAILED]: 0.9,
              [MockErrorType.INSUFFICIENT_BALANCE]: 0.1,
            },
          },
          swap: {
            failureRate: 0.06,
            errorDistribution: {
              [MockErrorType.GAS_ESTIMATION_FAILED]: 0.7,
              [MockErrorType.INSUFFICIENT_BALANCE]: 0.3,
            },
          },
          createPool: {
            failureRate: 0.15,
            errorDistribution: {
              [MockErrorType.GAS_ESTIMATION_FAILED]: 1.0,
            },
          },
        },
        globalConditions: {
          highGasPrices: true,
        },
      },
      {
        name: "stable_environment",
        description:
          "Stable environment with minimal errors for baseline testing",
        operations: {
          addLiquidity: {
            failureRate: 0.01,
            errorDistribution: {
              [MockErrorType.NETWORK_ERROR]: 0.5,
              [MockErrorType.DEADLINE_EXCEEDED]: 0.5,
            },
          },
          removeLiquidity: {
            failureRate: 0.01,
            errorDistribution: {
              [MockErrorType.NETWORK_ERROR]: 0.5,
              [MockErrorType.DEADLINE_EXCEEDED]: 0.5,
            },
          },
          swap: {
            failureRate: 0.02,
            errorDistribution: {
              [MockErrorType.SLIPPAGE_EXCEEDED]: 0.7,
              [MockErrorType.NETWORK_ERROR]: 0.3,
            },
          },
          createPool: {
            failureRate: 0.005,
            errorDistribution: {
              [MockErrorType.NETWORK_ERROR]: 1.0,
            },
          },
        },
      },
    ];
  }

  // ===== Private Helper Methods =====

  /**
   * Initialize default error configurations for all operations
   */
  private initializeDefaultConfigurations(): void {
    const defaultConfig: OperationErrorConfig = {
      failureRate: this.config.defaultFailureRate,
      errorDistribution: {
        [MockErrorType.NETWORK_ERROR]: 0.3,
        [MockErrorType.GAS_ESTIMATION_FAILED]: 0.2,
        [MockErrorType.INSUFFICIENT_BALANCE]: 0.2,
        [MockErrorType.SLIPPAGE_EXCEEDED]: 0.15,
        [MockErrorType.DEADLINE_EXCEEDED]: 0.1,
        [MockErrorType.INSUFFICIENT_LIQUIDITY]: 0.05,
      },
    };

    // Set default configurations for all operations
    const operations = [
      "addLiquidity",
      "removeLiquidity",
      "swap",
      "createPool",
    ];
    for (const operation of operations) {
      this.operationConfigs.set(operation, {...defaultConfig});
    }

    // Customize distributions for specific operations
    this.operationConfigs.set("swap", {
      ...defaultConfig,
      errorDistribution: {
        [MockErrorType.SLIPPAGE_EXCEEDED]: 0.4,
        [MockErrorType.INSUFFICIENT_LIQUIDITY]: 0.3,
        [MockErrorType.NETWORK_ERROR]: 0.2,
        [MockErrorType.DEADLINE_EXCEEDED]: 0.1,
      },
    });

    this.operationConfigs.set("addLiquidity", {
      ...defaultConfig,
      errorDistribution: {
        [MockErrorType.INSUFFICIENT_BALANCE]: 0.4,
        [MockErrorType.SLIPPAGE_EXCEEDED]: 0.25,
        [MockErrorType.NETWORK_ERROR]: 0.2,
        [MockErrorType.GAS_ESTIMATION_FAILED]: 0.15,
      },
    });
  }

  /**
   * Apply scenario-specific conditions to adjust failure rates
   */
  private applyScenarioConditions(
    baseRate: number,
    operation: string,
    context: any
  ): number {
    if (!this.currentScenario?.globalConditions) {
      return baseRate;
    }

    let adjustedRate = baseRate;
    const conditions = this.currentScenario.globalConditions;

    // Network instability increases all failure rates
    if (conditions.networkInstability) {
      adjustedRate *= 1.5;
    }

    // High gas prices affect gas-sensitive operations more
    if (
      conditions.highGasPrices &&
      ["addLiquidity", "createPool"].includes(operation)
    ) {
      adjustedRate *= 1.3;
    }

    // Low liquidity affects swap operations more
    if (conditions.lowLiquidity && operation === "swap") {
      adjustedRate *= 2.0;
    }

    return Math.min(adjustedRate, 1.0); // Cap at 100%
  }

  /**
   * Select error type based on operation and configuration
   */
  private selectErrorType(
    operation: string,
    config?: OperationErrorConfig,
    context?: any
  ): MockErrorType {
    const distribution = config?.errorDistribution || {};

    // Context-aware error selection
    if (context) {
      // Check for specific conditions that should trigger certain errors
      if (this.shouldTriggerInsufficientBalance(context)) {
        return MockErrorType.INSUFFICIENT_BALANCE;
      }

      if (this.shouldTriggerSlippageError(context)) {
        return MockErrorType.SLIPPAGE_EXCEEDED;
      }

      if (this.shouldTriggerDeadlineError(context)) {
        return MockErrorType.DEADLINE_EXCEEDED;
      }
    }

    // Random selection based on distribution
    const random = Math.random();
    let cumulative = 0;

    for (const [errorType, probability] of Object.entries(distribution)) {
      cumulative += probability || 0;
      if (random < cumulative) {
        return errorType as MockErrorType;
      }
    }

    // Fallback to network error
    return MockErrorType.NETWORK_ERROR;
  }

  /**
   * Generate realistic error message for the given error type and context
   */
  private generateErrorMessage(
    errorType: MockErrorType,
    operation: string,
    context: any
  ): string {
    const messages = {
      [MockErrorType.INSUFFICIENT_LIQUIDITY]: [
        "Insufficient liquidity for this trade size",
        "Not enough liquidity in the selected price range",
        "Liquidity exhausted in target bins",
        `Pool ${context.poolId || "unknown"} has insufficient liquidity`,
      ],
      [MockErrorType.SLIPPAGE_EXCEEDED]: [
        "Price moved beyond acceptable slippage tolerance",
        "Slippage tolerance exceeded due to market movement",
        "Trade would result in excessive slippage",
        `Slippage of ${(Math.random() * 5 + 1).toFixed(2)}% exceeds maximum tolerance`,
      ],
      [MockErrorType.DEADLINE_EXCEEDED]: [
        "Transaction deadline has passed",
        "Deadline exceeded while waiting for confirmation",
        "Transaction expired before execution",
        "Block timestamp exceeds specified deadline",
      ],
      [MockErrorType.INSUFFICIENT_BALANCE]: [
        "Insufficient balance for transaction",
        `Insufficient ${context.assetIn?.bits || "token"} balance`,
        "Account balance too low for this operation",
        "Not enough tokens to complete transaction",
      ],
      [MockErrorType.POOL_NOT_FOUND]: [
        "Pool does not exist",
        `Pool ${context.poolId || "unknown"} not found`,
        "Invalid pool identifier",
        "Pool has not been created yet",
      ],
      [MockErrorType.INVALID_BIN_RANGE]: [
        "Invalid bin range specified",
        "Bin IDs out of valid range",
        "Active bin ID is invalid",
        "Bin configuration is malformed",
      ],
      [MockErrorType.NETWORK_ERROR]: [
        "Network connection failed",
        "RPC endpoint unavailable",
        "Connection timeout",
        "Failed to connect to blockchain network",
        "Network request failed with status 500",
      ],
      [MockErrorType.GAS_ESTIMATION_FAILED]: [
        "Failed to estimate gas for transaction",
        "Gas estimation returned invalid result",
        "Unable to calculate gas requirements",
        "Gas limit estimation failed",
        "Transaction simulation failed during gas estimation",
      ],
    };

    const messageList = messages[errorType] || ["Unknown error occurred"];
    const randomMessage =
      messageList[Math.floor(Math.random() * messageList.length)];

    return randomMessage;
  }

  /**
   * Check if insufficient balance error should be triggered based on context
   */
  private shouldTriggerInsufficientBalance(context: any): boolean {
    // Check if amounts are suspiciously large
    if (context.amountADesired || context.amountBDesired) {
      const amountA = new BN(context.amountADesired?.toString() || "0");
      const amountB = new BN(context.amountBDesired?.toString() || "0");
      const largeAmount = new BN("1000000000000000000"); // 1 ETH equivalent

      return amountA.gt(largeAmount) || amountB.gt(largeAmount);
    }

    return false;
  }

  /**
   * Check if slippage error should be triggered based on context
   */
  private shouldTriggerSlippageError(context: any): boolean {
    // Trigger slippage error for large trades or tight slippage tolerance
    if (context.amountIn) {
      const amountIn = new BN(context.amountIn.toString());
      const largeTradeThreshold = new BN("100000000000000000"); // 0.1 ETH equivalent

      return amountIn.gt(largeTradeThreshold);
    }

    return false;
  }

  /**
   * Check if deadline error should be triggered based on context
   */
  private shouldTriggerDeadlineError(context: any): boolean {
    if (context.deadline) {
      const deadline =
        Number(new BN(context.deadline.toString()).toString()) * 1000;
      const now = Date.now();
      const timeUntilDeadline = deadline - now;

      // Trigger if deadline is very close (within 30 seconds)
      return timeUntilDeadline < 30000;
    }

    return false;
  }
}

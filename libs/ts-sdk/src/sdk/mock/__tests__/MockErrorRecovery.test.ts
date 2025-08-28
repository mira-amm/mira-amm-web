import {BN} from "fuels";
import {MockErrorRecovery} from "../MockErrorRecovery";
import {MockStateManager} from "../MockStateManager";
import {MockError, MockErrorType, DEFAULT_MOCK_CONFIG} from "../types";

describe("MockErrorRecovery", () => {
  let errorRecovery: MockErrorRecovery;
  let stateManager: MockStateManager;

  beforeEach(() => {
    stateManager = new MockStateManager(DEFAULT_MOCK_CONFIG);
    errorRecovery = new MockErrorRecovery(DEFAULT_MOCK_CONFIG, stateManager);
  });

  describe("createStateSnapshot", () => {
    it("should create a state snapshot", () => {
      const snapshotId = errorRecovery.createStateSnapshot(
        "addLiquidity",
        "tx123"
      );

      expect(snapshotId).toBeDefined();
      expect(typeof snapshotId).toBe("string");
      expect(snapshotId).toContain("addLiquidity");
    });

    it("should create unique snapshot IDs", () => {
      const snapshot1 = errorRecovery.createStateSnapshot("addLiquidity");
      const snapshot2 = errorRecovery.createStateSnapshot("addLiquidity");

      expect(snapshot1).not.toBe(snapshot2);
    });
  });

  describe("rollbackToSnapshot", () => {
    it("should rollback to a valid snapshot", () => {
      // Create initial state
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

      // Create snapshot
      const snapshotId = errorRecovery.createStateSnapshot("test");

      // Modify state
      stateManager.setPool("new-pool", {...mockPool, poolId: "new-pool"});

      // Rollback
      const success = errorRecovery.rollbackToSnapshot(snapshotId);

      expect(success).toBe(true);
      expect(stateManager.getPool("new-pool")).toBeNull();
      expect(stateManager.getPool(poolId)).toBeDefined();
    });

    it("should return false for invalid snapshot ID", () => {
      const success = errorRecovery.rollbackToSnapshot("invalid-id");
      expect(success).toBe(false);
    });
  });

  describe("handleError", () => {
    it("should handle recoverable errors", () => {
      const error = new MockError(
        MockErrorType.SLIPPAGE_EXCEEDED,
        "Slippage tolerance exceeded",
        {slippage: 15}
      );

      const errorContext = errorRecovery.handleError(error, "swap", {
        amountIn: "1000000",
        amountOutMin: "950000",
      });

      expect(errorContext.error).toBe(error);
      expect(errorContext.operation).toBe("swap");
      expect(errorContext.isRecoverable).toBe(true);
      expect(errorContext.suggestions.length).toBeGreaterThan(0);
      expect(errorContext.maxRetries).toBeGreaterThan(0);
    });

    it("should handle non-recoverable errors", () => {
      const error = new MockError(
        MockErrorType.POOL_NOT_FOUND,
        "Pool does not exist",
        {poolId: "12345"}
      );

      const errorContext = errorRecovery.handleError(error, "addLiquidity", {
        poolId: "12345",
      });

      expect(errorContext.isRecoverable).toBe(false);
      expect(errorContext.maxRetries).toBe(0);
    });

    it("should generate appropriate recovery suggestions", () => {
      const slippageError = new MockError(
        MockErrorType.SLIPPAGE_EXCEEDED,
        "Slippage exceeded",
        {}
      );

      const errorContext = errorRecovery.handleError(slippageError, "swap", {
        amountOutMin: "950000",
      });

      const adjustParametersSuggestion = errorContext.suggestions.find(
        (s) => s.type === "adjust_parameters"
      );

      expect(adjustParametersSuggestion).toBeDefined();
      expect(adjustParametersSuggestion?.parameterAdjustments).toBeDefined();
    });
  });

  describe("attemptRecovery", () => {
    it("should attempt retry recovery", async () => {
      const error = new MockError(
        MockErrorType.NETWORK_ERROR,
        "Network failed"
      );
      const errorContext = errorRecovery.handleError(error, "swap", {});

      const result = await errorRecovery.attemptRecovery(errorContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain("Retrying");
      expect(errorContext.retryCount).toBe(1);
    });

    it("should attempt parameter adjustment recovery", async () => {
      const error = new MockError(
        MockErrorType.SLIPPAGE_EXCEEDED,
        "Slippage exceeded",
        {}
      );
      const parameters = {
        amountOutMin: "950000",
        amountAMin: "950000",
        amountBMin: "1900000",
      };

      const errorContext = errorRecovery.handleError(error, "swap", parameters);

      const result = await errorRecovery.attemptRecovery(errorContext);

      expect(result.success).toBe(true);
      expect(result.adjustedParameters).toBeDefined();
      expect(result.message).toContain("Adjusted parameters");
    });

    it("should fail recovery for non-recoverable errors", async () => {
      const error = new MockError(
        MockErrorType.POOL_NOT_FOUND,
        "Pool not found"
      );
      const errorContext = errorRecovery.handleError(error, "swap", {});

      const result = await errorRecovery.attemptRecovery(errorContext);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Error is not recoverable");
    });

    it("should fail recovery after max retries", async () => {
      const error = new MockError(
        MockErrorType.NETWORK_ERROR,
        "Network failed"
      );
      const errorContext = errorRecovery.handleError(error, "swap", {});

      // Simulate max retries reached
      errorContext.retryCount = errorContext.maxRetries;

      const result = await errorRecovery.attemptRecovery(errorContext);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Maximum retry attempts");
    });
  });

  describe("getErrorStatistics", () => {
    it("should return empty statistics initially", () => {
      const stats = errorRecovery.getErrorStatistics();

      expect(stats.totalErrors).toBe(0);
      expect(stats.recoverySuccessRate).toBe(0);
      expect(Object.keys(stats.errorsByType)).toHaveLength(0);
      expect(Object.keys(stats.errorsByOperation)).toHaveLength(0);
    });

    it("should track error statistics", () => {
      // Handle some errors
      const error1 = new MockError(MockErrorType.SLIPPAGE_EXCEEDED, "Slippage");
      const error2 = new MockError(MockErrorType.NETWORK_ERROR, "Network");
      const error3 = new MockError(
        MockErrorType.SLIPPAGE_EXCEEDED,
        "Slippage again"
      );

      errorRecovery.handleError(error1, "swap", {});
      errorRecovery.handleError(error2, "addLiquidity", {});
      errorRecovery.handleError(error3, "swap", {});

      const stats = errorRecovery.getErrorStatistics();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType[MockErrorType.SLIPPAGE_EXCEEDED]).toBe(2);
      expect(stats.errorsByType[MockErrorType.NETWORK_ERROR]).toBe(1);
      expect(stats.errorsByOperation["swap"]).toBe(2);
      expect(stats.errorsByOperation["addLiquidity"]).toBe(1);
    });

    it("should identify common failure patterns", () => {
      // Create multiple similar errors
      for (let i = 0; i < 5; i++) {
        const error = new MockError(
          MockErrorType.SLIPPAGE_EXCEEDED,
          "Slippage"
        );
        errorRecovery.handleError(error, "swap", {});
      }

      const stats = errorRecovery.getErrorStatistics();

      expect(stats.commonFailurePatterns.length).toBeGreaterThan(0);
      const swapSlippagePattern = stats.commonFailurePatterns.find(
        (p) => p.pattern === "swap_SLIPPAGE_EXCEEDED"
      );
      expect(swapSlippagePattern).toBeDefined();
      expect(swapSlippagePattern?.count).toBe(5);
    });
  });

  describe("parameter adjustment calculations", () => {
    it("should calculate slippage adjustments correctly", async () => {
      const error = new MockError(MockErrorType.SLIPPAGE_EXCEEDED, "Slippage");
      const parameters = {
        amountAMin: "1000000",
        amountBMin: "2000000",
        amountOutMin: "950000",
      };

      const errorContext = errorRecovery.handleError(error, "swap", parameters);
      const result = await errorRecovery.attemptRecovery(errorContext);

      expect(result.adjustedParameters).toBeDefined();

      if (result.adjustedParameters) {
        // Should reduce minimum amounts by 10% (allowing more slippage)
        expect(new BN(result.adjustedParameters.amountAMin)).toEqual(
          new BN("900000") // 1000000 * 0.9
        );
        expect(new BN(result.adjustedParameters.amountBMin)).toEqual(
          new BN("1800000") // 2000000 * 0.9
        );
        expect(new BN(result.adjustedParameters.amountOutMin)).toEqual(
          new BN("855000") // 950000 * 0.9
        );
      }
    });

    it("should calculate amount reductions for insufficient liquidity", async () => {
      const error = new MockError(
        MockErrorType.INSUFFICIENT_LIQUIDITY,
        "No liquidity"
      );
      const parameters = {
        amountIn: "1000000",
        amountADesired: "2000000",
        amountBDesired: "3000000",
      };

      const errorContext = errorRecovery.handleError(error, "swap", parameters);
      const result = await errorRecovery.attemptRecovery(errorContext);

      expect(result.adjustedParameters).toBeDefined();

      if (result.adjustedParameters) {
        // Should reduce amounts by 20%
        expect(new BN(result.adjustedParameters.amountIn)).toEqual(
          new BN("800000") // 1000000 * 0.8
        );
        expect(new BN(result.adjustedParameters.amountADesired)).toEqual(
          new BN("1600000") // 2000000 * 0.8
        );
        expect(new BN(result.adjustedParameters.amountBDesired)).toEqual(
          new BN("2400000") // 3000000 * 0.8
        );
      }
    });

    it("should calculate gas adjustments", async () => {
      const error = new MockError(
        MockErrorType.GAS_ESTIMATION_FAILED,
        "Gas failed"
      );
      const parameters = {
        txParams: {
          gasLimit: "100000",
        },
      };

      const errorContext = errorRecovery.handleError(error, "swap", parameters);
      const result = await errorRecovery.attemptRecovery(errorContext);

      expect(result.adjustedParameters).toBeDefined();

      if (result.adjustedParameters?.txParams) {
        // Should increase gas limit by 50%
        expect(new BN(result.adjustedParameters.txParams.gasLimit)).toEqual(
          new BN("150000") // 100000 * 1.5
        );
      }
    });
  });

  describe("clearHistory", () => {
    it("should clear all history and snapshots", () => {
      // Create some history
      const error = new MockError(MockErrorType.NETWORK_ERROR, "Network");
      errorRecovery.handleError(error, "swap", {});
      errorRecovery.createStateSnapshot("test");

      // Clear history
      errorRecovery.clearHistory();

      const stats = errorRecovery.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
    });
  });
});

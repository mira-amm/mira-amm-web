import {MockErrorContextTracker} from "../MockErrorContextTracker";
import {MockError, MockErrorType, DEFAULT_MOCK_CONFIG} from "../types";

describe("MockErrorContextTracker", () => {
  let tracker: MockErrorContextTracker;

  beforeEach(() => {
    tracker = new MockErrorContextTracker(DEFAULT_MOCK_CONFIG);
  });

  describe("trackError", () => {
    it("should track an error with comprehensive context", () => {
      const error = new MockError(
        MockErrorType.SLIPPAGE_EXCEEDED,
        "Slippage tolerance exceeded",
        {slippage: 15}
      );

      const systemState = {
        account: {
          balances: new Map([["asset1", "1000000"]]),
        },
        stateManager: {
          pools: new Map([["pool1", {activeBinId: 8388608}]]),
        },
      };

      const context = tracker.trackError(
        error,
        "swap",
        {amountIn: "1000000", amountOutMin: "950000"},
        systemState,
        "user123"
      );

      expect(context.errorId).toBeDefined();
      expect(context.operation).toBe("swap");
      expect(context.userId).toBe("user123");
      expect(context.timestamp).toBeInstanceOf(Date);
      expect(context.parameters).toEqual({
        amountIn: "1000000",
        amountOutMin: "950000",
      });
      expect(context.systemState).toBeDefined();
      expect(context.classification).toBeDefined();
      expect(context.debugInfo).toBeDefined();
    });

    it("should classify errors correctly", () => {
      const networkError = new MockError(
        MockErrorType.NETWORK_ERROR,
        "Network failed"
      );
      const context = tracker.trackError(networkError, "swap", {}, {});

      expect(context.classification.severity).toBe("high");
      expect(context.classification.category).toBe("network_error");
      expect(context.classification.userImpact).toBe("severe");
    });

    it("should capture stack trace", () => {
      const error = new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Invalid params"
      );
      const context = tracker.trackError(error, "addLiquidity", {}, {});

      expect(context.stackTrace).toBeDefined();
      expect(Array.isArray(context.stackTrace)).toBe(true);
      expect(context.stackTrace.length).toBeGreaterThan(0);
    });

    it("should track operation history", () => {
      // Track some successful operations first
      tracker.trackOperation("addLiquidity", {poolId: "123"}, true);
      tracker.trackOperation("swap", {amountIn: "1000"}, true);

      const error = new MockError(MockErrorType.SLIPPAGE_EXCEEDED, "Slippage");
      const context = tracker.trackError(error, "swap", {}, {});

      expect(context.operationHistory).toBeDefined();
      expect(context.operationHistory.length).toBe(2);
      expect(context.operationHistory[0].operation).toBe("addLiquidity");
      expect(context.operationHistory[0].success).toBe(true);
      expect(context.operationHistory[1].operation).toBe("swap");
      expect(context.operationHistory[1].success).toBe(true);
    });
  });

  describe("trackOperation", () => {
    it("should track successful operations", () => {
      tracker.trackOperation("addLiquidity", {poolId: "123"}, true);
      tracker.trackOperation("swap", {amountIn: "1000"}, true);

      // Create an error to access operation history
      const error = new MockError(MockErrorType.NETWORK_ERROR, "Network");
      const context = tracker.trackError(error, "test", {}, {});

      expect(context.operationHistory.length).toBe(2);
      expect(context.operationHistory.every((op) => op.success)).toBe(true);
    });

    it("should track failed operations", () => {
      tracker.trackOperation("swap", {amountIn: "1000"}, false);

      const error = new MockError(MockErrorType.NETWORK_ERROR, "Network");
      const context = tracker.trackError(error, "test", {}, {});

      expect(context.operationHistory.length).toBe(1);
      expect(context.operationHistory[0].success).toBe(false);
    });

    it("should limit operation history size", () => {
      // Track more operations than the limit
      for (let i = 0; i < 600; i++) {
        tracker.trackOperation("test", {index: i}, true);
      }

      const error = new MockError(MockErrorType.NETWORK_ERROR, "Network");
      const context = tracker.trackError(error, "test", {}, {});

      // Should be limited to 500 (maxOperationHistory)
      expect(context.operationHistory.length).toBe(500);
      // Should keep the most recent operations
      expect(context.operationHistory[499].parameters.index).toBe(599);
    });
  });

  describe("getErrorContext", () => {
    it("should retrieve error context by ID", () => {
      const error = new MockError(MockErrorType.SLIPPAGE_EXCEEDED, "Slippage");
      const context = tracker.trackError(error, "swap", {}, {});

      const retrieved = tracker.getErrorContext(context.errorId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.errorId).toBe(context.errorId);
      expect(retrieved?.operation).toBe("swap");
    });

    it("should return undefined for non-existent error ID", () => {
      const retrieved = tracker.getErrorContext("non-existent-id");
      expect(retrieved).toBeUndefined();
    });
  });

  describe("getErrorContextsForOperation", () => {
    it("should return errors for specific operation", () => {
      const swapError1 = new MockError(
        MockErrorType.SLIPPAGE_EXCEEDED,
        "Slippage 1"
      );
      const swapError2 = new MockError(MockErrorType.NETWORK_ERROR, "Network");
      const addLiquidityError = new MockError(
        MockErrorType.INSUFFICIENT_BALANCE,
        "Balance"
      );

      tracker.trackError(swapError1, "swap", {}, {});
      tracker.trackError(addLiquidityError, "addLiquidity", {}, {});
      tracker.trackError(swapError2, "swap", {}, {});

      const swapErrors = tracker.getErrorContextsForOperation("swap");
      const addLiquidityErrors =
        tracker.getErrorContextsForOperation("addLiquidity");

      expect(swapErrors.length).toBe(2);
      expect(addLiquidityErrors.length).toBe(1);
      expect(swapErrors.every((ctx) => ctx.operation === "swap")).toBe(true);
      expect(addLiquidityErrors[0].operation).toBe("addLiquidity");
    });

    it("should return errors sorted by timestamp (newest first)", () => {
      const error1 = new MockError(MockErrorType.NETWORK_ERROR, "Error 1");
      const error2 = new MockError(MockErrorType.NETWORK_ERROR, "Error 2");

      const context1 = tracker.trackError(error1, "swap", {}, {});

      // Wait a bit to ensure different timestamps
      setTimeout(() => {
        const context2 = tracker.trackError(error2, "swap", {}, {});

        const errors = tracker.getErrorContextsForOperation("swap");

        expect(errors.length).toBe(2);
        expect(errors[0].timestamp.getTime()).toBeGreaterThan(
          errors[1].timestamp.getTime()
        );
      }, 10);
    });
  });

  describe("getErrorContextsForUser", () => {
    it("should return errors for specific user", () => {
      const error1 = new MockError(MockErrorType.SLIPPAGE_EXCEEDED, "Error 1");
      const error2 = new MockError(MockErrorType.NETWORK_ERROR, "Error 2");
      const error3 = new MockError(
        MockErrorType.INSUFFICIENT_BALANCE,
        "Error 3"
      );

      tracker.trackError(error1, "swap", {}, {}, "user1");
      tracker.trackError(error2, "addLiquidity", {}, {}, "user2");
      tracker.trackError(error3, "swap", {}, {}, "user1");

      const user1Errors = tracker.getErrorContextsForUser("user1");
      const user2Errors = tracker.getErrorContextsForUser("user2");

      expect(user1Errors.length).toBe(2);
      expect(user2Errors.length).toBe(1);
      expect(user1Errors.every((ctx) => ctx.userId === "user1")).toBe(true);
      expect(user2Errors[0].userId).toBe("user2");
    });
  });

  describe("getErrorContextsForPool", () => {
    it("should return errors for specific pool", () => {
      const error1 = new MockError(MockErrorType.SLIPPAGE_EXCEEDED, "Error 1");
      const error2 = new MockError(MockErrorType.NETWORK_ERROR, "Error 2");

      tracker.trackError(error1, "swap", {poolId: "pool1"}, {});
      tracker.trackError(error2, "addLiquidity", {poolId: "pool2"}, {});

      const pool1Errors = tracker.getErrorContextsForPool("pool1");
      const pool2Errors = tracker.getErrorContextsForPool("pool2");

      expect(pool1Errors.length).toBe(1);
      expect(pool2Errors.length).toBe(1);
      expect(pool1Errors[0].poolId).toBe("pool1");
      expect(pool2Errors[0].poolId).toBe("pool2");
    });
  });

  describe("analyzeErrorPatterns", () => {
    it("should analyze error patterns and trends", () => {
      // Create various errors
      const errors = [
        {type: MockErrorType.SLIPPAGE_EXCEEDED, operation: "swap"},
        {type: MockErrorType.SLIPPAGE_EXCEEDED, operation: "swap"},
        {type: MockErrorType.NETWORK_ERROR, operation: "addLiquidity"},
        {type: MockErrorType.INSUFFICIENT_BALANCE, operation: "swap"},
      ];

      errors.forEach(({type, operation}) => {
        const error = new MockError(type, `${type} error`);
        tracker.trackError(error, operation, {}, {});
      });

      // Track some successful operations
      tracker.trackOperation("swap", {}, true);
      tracker.trackOperation("addLiquidity", {}, true);

      const analysis = tracker.analyzeErrorPatterns();

      expect(analysis.trends.errorRate).toBeGreaterThan(0);
      expect(analysis.trends.mostCommonErrors.length).toBeGreaterThan(0);
      expect(analysis.trends.operationFailureRates).toBeDefined();
      expect(analysis.recommendations.length).toBeGreaterThan(0);

      // Check most common error
      const mostCommon = analysis.trends.mostCommonErrors[0];
      expect(mostCommon.type).toBe(MockErrorType.SLIPPAGE_EXCEEDED);
      expect(mostCommon.count).toBe(2);
    });

    it("should calculate operation failure rates correctly", () => {
      // Create 2 failed swaps and 1 successful swap
      const swapError1 = new MockError(
        MockErrorType.SLIPPAGE_EXCEEDED,
        "Error 1"
      );
      const swapError2 = new MockError(MockErrorType.NETWORK_ERROR, "Error 2");

      tracker.trackError(swapError1, "swap", {}, {});
      tracker.trackError(swapError2, "swap", {}, {});
      tracker.trackOperation("swap", {}, true);

      const analysis = tracker.analyzeErrorPatterns();

      // 2 failures out of 3 total = 66.67% failure rate
      expect(analysis.trends.operationFailureRates["swap"]).toBeCloseTo(
        0.667,
        2
      );
    });

    it("should provide relevant recommendations", () => {
      // Create multiple slippage errors
      for (let i = 0; i < 6; i++) {
        const error = new MockError(
          MockErrorType.SLIPPAGE_EXCEEDED,
          "Slippage"
        );
        tracker.trackError(error, "swap", {}, {});
      }

      const analysis = tracker.analyzeErrorPatterns();

      expect(analysis.recommendations.length).toBeGreaterThan(0);
      const slippageRecommendation = analysis.recommendations.find((r) =>
        r.includes("slippage tolerance")
      );
      expect(slippageRecommendation).toBeDefined();
    });
  });

  describe("generateDebugReport", () => {
    it("should generate comprehensive debug report", () => {
      const error = new MockError(
        MockErrorType.SLIPPAGE_EXCEEDED,
        "Slippage tolerance exceeded",
        {slippage: 15}
      );

      const context = tracker.trackError(
        error,
        "swap",
        {amountIn: "1000000", amountOutMin: "950000"},
        {account: {balances: new Map()}},
        "user123"
      );

      const report = tracker.generateDebugReport(context.errorId);

      expect(report).toContain("ERROR DEBUG REPORT");
      expect(report).toContain(context.errorId);
      expect(report).toContain("swap");
      expect(report).toContain("user123");
      expect(report).toContain("SLIPPAGE_EXCEEDED");
      expect(report).toContain("PARAMETERS");
      expect(report).toContain("SYSTEM STATE");
      expect(report).toContain("STACK TRACE");
    });

    it("should handle non-existent error ID", () => {
      const report = tracker.generateDebugReport("non-existent-id");
      expect(report).toContain("Error context not found");
    });
  });

  describe("exportErrorData", () => {
    it("should export complete error data", () => {
      const error = new MockError(
        MockErrorType.NETWORK_ERROR,
        "Network failed"
      );
      tracker.trackError(error, "swap", {}, {});
      tracker.trackOperation("addLiquidity", {}, true);

      const exportData = tracker.exportErrorData();

      expect(exportData.contexts).toBeDefined();
      expect(exportData.patterns).toBeDefined();
      expect(exportData.operationHistory).toBeDefined();
      expect(exportData.summary).toBeDefined();

      expect(exportData.contexts.length).toBe(1);
      expect(exportData.operationHistory.length).toBe(1);
    });
  });

  describe("clearAll", () => {
    it("should clear all tracked data", () => {
      const error = new MockError(
        MockErrorType.NETWORK_ERROR,
        "Network failed"
      );
      tracker.trackError(error, "swap", {}, {});
      tracker.trackOperation("addLiquidity", {}, true);

      tracker.clearAll();

      const exportData = tracker.exportErrorData();
      expect(exportData.contexts.length).toBe(0);
      expect(exportData.operationHistory.length).toBe(0);
    });
  });

  describe("error classification", () => {
    it("should classify user errors correctly", () => {
      const userError = new MockError(
        MockErrorType.INSUFFICIENT_BALANCE,
        "No balance"
      );
      const context = tracker.trackError(userError, "swap", {}, {});

      expect(context.classification.category).toBe("user_error");
      expect(context.classification.severity).toBe("low");
      expect(context.classification.userImpact).toBe("minor");
    });

    it("should classify system errors correctly", () => {
      const systemError = new MockError(
        MockErrorType.INSUFFICIENT_LIQUIDITY,
        "No liquidity"
      );
      const context = tracker.trackError(systemError, "swap", {}, {});

      expect(context.classification.category).toBe("system_error");
      expect(context.classification.severity).toBe("medium");
      expect(context.classification.userImpact).toBe("moderate");
    });

    it("should classify network errors correctly", () => {
      const networkError = new MockError(
        MockErrorType.NETWORK_ERROR,
        "Network failed"
      );
      const context = tracker.trackError(networkError, "swap", {}, {});

      expect(context.classification.category).toBe("network_error");
      expect(context.classification.severity).toBe("high");
      expect(context.classification.userImpact).toBe("severe");
    });

    it("should classify validation errors correctly", () => {
      const validationError = new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Invalid params"
      );
      const context = tracker.trackError(
        validationError,
        "addLiquidity",
        {},
        {}
      );

      expect(context.classification.category).toBe("validation_error");
      expect(context.classification.severity).toBe("medium");
      expect(context.classification.userImpact).toBe("moderate");
    });

    it("should identify expected errors", () => {
      const expectedError = new MockError(
        MockErrorType.SLIPPAGE_EXCEEDED,
        "Slippage"
      );
      const context = tracker.trackError(expectedError, "swap", {}, {});

      expect(context.classification.isExpected).toBe(true);

      const unexpectedError = new MockError(
        MockErrorType.NETWORK_ERROR,
        "Network"
      );
      const context2 = tracker.trackError(unexpectedError, "swap", {}, {});

      expect(context2.classification.isExpected).toBe(false);
    });
  });
});

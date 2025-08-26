import {describe, it, expect} from "vitest";
import {BN, AssetId} from "fuels";
import {
  EnhancedMiraV2Error,
  parseContractError,
  withErrorHandling,
  createErrorContext,
} from "../../errors/v2-errors";
import {PoolCurveStateError} from "../../model";

describe("V2 Error Handling", () => {
  describe("EnhancedMiraV2Error", () => {
    it("should create error with proper message formatting", () => {
      const context = {
        poolId: new BN(123),
        binId: 456,
        operation: "addLiquidity",
      };

      const error = new EnhancedMiraV2Error(
        PoolCurveStateError.InsufficientAmountIn,
        "Test error message",
        context
      );

      expect(error.errorType).toBe(PoolCurveStateError.InsufficientAmountIn);
      expect(error.message).toContain("[InsufficientAmountIn]");
      expect(error.message).toContain("Test error message");
      expect(error.message).toContain("Pool: 123");
      expect(error.message).toContain("Bin: 456");
      expect(error.message).toContain("Operation: addLiquidity");
    });

    it("should provide user-friendly messages", () => {
      const error = new EnhancedMiraV2Error(
        PoolCurveStateError.PoolNotFound,
        "Pool not found"
      );

      const userMessage = error.getUserFriendlyMessage();
      expect(userMessage).toBe(
        "The requested pool does not exist. Please check the pool ID and try again."
      );
    });

    it("should identify recoverable errors", () => {
      const recoverableError = new EnhancedMiraV2Error(
        PoolCurveStateError.InsufficientAmountIn,
        "Insufficient amount"
      );
      expect(recoverableError.isRecoverable()).toBe(true);

      const nonRecoverableError = new EnhancedMiraV2Error(
        PoolCurveStateError.PoolNotFound,
        "Pool not found"
      );
      expect(nonRecoverableError.isRecoverable()).toBe(false);
    });
  });

  describe("parseContractError", () => {
    it("should parse known contract error types", () => {
      const contractError = new Error(
        "PoolNotFound: Pool with ID 123 not found"
      );
      const context = {poolId: new BN(123)};

      const parsedError = parseContractError(contractError, context);

      expect(parsedError.errorType).toBe(PoolCurveStateError.PoolNotFound);
      expect(parsedError.context?.poolId).toEqual(new BN(123));
      expect(parsedError.context?.originalError).toBe(contractError);
    });

    it("should default to InvalidParameters for unknown errors", () => {
      const unknownError = new Error("Some unknown error");
      const parsedError = parseContractError(unknownError);

      expect(parsedError.errorType).toBe(PoolCurveStateError.InvalidParameters);
    });

    it("should handle string errors", () => {
      const stringError = "InsufficientAmountOut: Not enough output";
      const parsedError = parseContractError(stringError);

      expect(parsedError.errorType).toBe(
        PoolCurveStateError.InsufficientAmountOut
      );
    });
  });

  describe("withErrorHandling", () => {
    it("should pass through successful operations", async () => {
      const result = await withErrorHandling(async () => {
        return "success";
      });

      expect(result).toBe("success");
    });

    it("should wrap thrown errors with context", async () => {
      const context = {operation: "testOperation"};

      await expect(
        withErrorHandling(async () => {
          throw new Error("Test error");
        }, context)
      ).rejects.toThrow(EnhancedMiraV2Error);
    });

    it("should preserve MiraV2Error instances", async () => {
      const originalError = new EnhancedMiraV2Error(
        PoolCurveStateError.PoolNotFound,
        "Original error"
      );

      await expect(
        withErrorHandling(async () => {
          throw originalError;
        })
      ).rejects.toThrow(originalError.message);
    });
  });

  describe("createErrorContext", () => {
    it("should create context with operation and timestamp", () => {
      const context = createErrorContext("testOperation", {
        poolId: new BN(123),
      });

      expect(context.operation).toBe("testOperation");
      expect(context.poolId).toEqual(new BN(123));
      expect(context.timestamp).toBeTypeOf("number");
      expect(context.timestamp).toBeGreaterThan(0);
    });
  });
});

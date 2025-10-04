import {describe, it, expect} from "vitest";
import {
  ErrorClassifier,
  ErrorCategory,
  InfrastructureErrorType,
  ApplicationErrorType,
} from "../error-classifier";

describe("ErrorClassifier", () => {
  describe("Infrastructure Error Classification", () => {
    it("should classify port conflict errors", () => {
      const error = new Error("Port 4000 is already in use");
      const classified = ErrorClassifier.classify(error);

      expect(classified.category).toBe(ErrorCategory.INFRASTRUCTURE);
      expect(classified.type).toBe(InfrastructureErrorType.PORT_CONFLICT);
      expect(classified.isRetryable).toBe(false);
      expect(classified.severity).toBe("high");
      expect(classified.suggestedFix).toContain("lsof");
    });

    it("should classify EADDRINUSE errors", () => {
      const error = new Error("EADDRINUSE: address already in use");
      const classified = ErrorClassifier.classify(error);

      expect(classified.category).toBe(ErrorCategory.INFRASTRUCTURE);
      expect(classified.type).toBe(InfrastructureErrorType.PORT_CONFLICT);
    });

    it("should classify service startup timeouts", () => {
      const error = new Error("Timeout waiting for services to start");
      const classified = ErrorClassifier.classify(error);

      expect(classified.category).toBe(ErrorCategory.INFRASTRUCTURE);
      expect(classified.type).toBe(InfrastructureErrorType.SERVICE_STARTUP);
      expect(classified.isRetryable).toBe(true);
      expect(classified.severity).toBe("high");
    });

    it("should classify fuel node health errors", () => {
      const error = new Error("Fuel node not responding");
      const classified = ErrorClassifier.classify(error);

      expect(classified.category).toBe(ErrorCategory.INFRASTRUCTURE);
      expect(classified.type).toBe(InfrastructureErrorType.SERVICE_HEALTH);
      expect(classified.severity).toBe("critical");
    });

    it("should classify connection refused errors", () => {
      const error = new Error("ECONNREFUSED: Connection refused");
      const classified = ErrorClassifier.classify(error);

      expect(classified.category).toBe(ErrorCategory.INFRASTRUCTURE);
      expect(classified.type).toBe(InfrastructureErrorType.NETWORK_CONNECTION);
      expect(classified.isRetryable).toBe(true);
    });

    it("should classify insufficient balance errors", () => {
      const error = new Error("Insufficient balance for transfer");
      const classified = ErrorClassifier.classify(error);

      expect(classified.category).toBe(ErrorCategory.INFRASTRUCTURE);
      expect(classified.type).toBe(
        InfrastructureErrorType.BALANCE_INSUFFICIENT
      );
      expect(classified.isRetryable).toBe(false);
      expect(classified.suggestedFix).toContain("Fund the master wallet");
    });

    it("should classify wallet funding failures", () => {
      const error = new Error("Wallet funding failed");
      const classified = ErrorClassifier.classify(error);

      expect(classified.category).toBe(ErrorCategory.INFRASTRUCTURE);
      expect(classified.type).toBe(InfrastructureErrorType.WALLET_FUNDING);
      expect(classified.isRetryable).toBe(true);
    });

    it("should classify contract deployment errors", () => {
      const error = new Error("Contract deployment failed");
      const classified = ErrorClassifier.classify(error);

      expect(classified.category).toBe(ErrorCategory.INFRASTRUCTURE);
      expect(classified.type).toBe(InfrastructureErrorType.CONTRACT_DEPLOYMENT);
      expect(classified.isRetryable).toBe(true);
    });
  });

  describe("Application Error Classification", () => {
    it("should classify contract call failures", () => {
      const error = new Error("Contract call failed: revert");
      const classified = ErrorClassifier.classify(error);

      expect(classified.category).toBe(ErrorCategory.APPLICATION);
      expect(classified.type).toBe(ApplicationErrorType.CONTRACT_CALL);
      expect(classified.isRetryable).toBe(false);
      expect(classified.severity).toBe("medium");
    });

    it("should classify transaction failures", () => {
      const error = new Error("Transaction failed");
      const classified = ErrorClassifier.classify(error);

      expect(classified.category).toBe(ErrorCategory.APPLICATION);
      expect(classified.type).toBe(ApplicationErrorType.TRANSACTION_FAILED);
      expect(classified.isRetryable).toBe(true);
    });

    it("should classify slippage errors", () => {
      const error = new Error("Slippage exceeded maximum tolerance");
      const classified = ErrorClassifier.classify(error);

      expect(classified.category).toBe(ErrorCategory.APPLICATION);
      expect(classified.type).toBe(ApplicationErrorType.SLIPPAGE);
      expect(classified.isRetryable).toBe(true);
      expect(classified.severity).toBe("low");
    });

    it("should classify liquidity errors", () => {
      const error = new Error("Insufficient liquidity for trade");
      const classified = ErrorClassifier.classify(error);

      expect(classified.category).toBe(ErrorCategory.APPLICATION);
      expect(classified.type).toBe(ApplicationErrorType.LIQUIDITY);
      expect(classified.isRetryable).toBe(false);
    });

    it("should classify validation errors", () => {
      const error = new Error("Validation failed: invalid parameter");
      const classified = ErrorClassifier.classify(error);

      expect(classified.category).toBe(ErrorCategory.APPLICATION);
      expect(classified.type).toBe(ApplicationErrorType.VALIDATION);
      expect(classified.isRetryable).toBe(false);
      expect(classified.severity).toBe("low");
    });
  });

  describe("Unknown Error Classification", () => {
    it("should classify unknown errors", () => {
      const error = new Error("Some unknown error");
      const classified = ErrorClassifier.classify(error);

      expect(classified.category).toBe(ErrorCategory.UNKNOWN);
      expect(classified.type).toBe("unknown");
      expect(classified.isRetryable).toBe(false);
      expect(classified.severity).toBe("medium");
    });
  });

  describe("Utility Methods", () => {
    it("should identify infrastructure errors", () => {
      const infraError = new Error("Port 4000 already in use");
      const appError = new Error("Contract call failed");

      expect(ErrorClassifier.isInfrastructureError(infraError)).toBe(true);
      expect(ErrorClassifier.isInfrastructureError(appError)).toBe(false);
    });

    it("should identify application errors", () => {
      const infraError = new Error("Port 4000 already in use");
      const appError = new Error("Contract call failed");

      expect(ErrorClassifier.isApplicationError(infraError)).toBe(false);
      expect(ErrorClassifier.isApplicationError(appError)).toBe(true);
    });

    it("should identify retryable errors", () => {
      const retryableError = new Error("Connection timeout");
      const nonRetryableError = new Error("Port already in use");

      expect(ErrorClassifier.isRetryable(retryableError)).toBe(true);
      expect(ErrorClassifier.isRetryable(nonRetryableError)).toBe(false);
    });

    it("should get suggested fixes", () => {
      const error = new Error("Insufficient balance for transfer");
      const fix = ErrorClassifier.getSuggestedFix(error);

      expect(fix).toBeDefined();
      expect(fix).toContain("Fund the master wallet");
    });

    it("should get error severity", () => {
      const criticalError = new Error("Fuel node not responding");
      const lowError = new Error("Validation failed");

      expect(ErrorClassifier.getSeverity(criticalError)).toBe("critical");
      expect(ErrorClassifier.getSeverity(lowError)).toBe("low");
    });
  });

  describe("Error Reporting", () => {
    it("should create detailed error reports", () => {
      const error = new Error("Port 4000 already in use");
      const context = {port: 4000, service: "fuel-node"};
      const report = ErrorClassifier.createErrorReport(error, context);

      expect(report).toContain("Error Classification Report");
      expect(report).toContain("Category: INFRASTRUCTURE");
      expect(report).toContain("Type: port_conflict");
      expect(report).toContain("Severity: HIGH");
      expect(report).toContain("Suggested Fix:");
      expect(report).toContain("Context:");
      expect(report).toContain("port: 4000");
    });

    it("should handle errors with appropriate responses", () => {
      const error = new Error("Wallet funding failed");
      const response = ErrorClassifier.handleError(error);

      expect(response.shouldRetry).toBe(true);
      expect(response.shouldFail).toBe(false);
      expect(response.message).toContain("Error Classification Report");
      expect(response.actions).toContain("Check master wallet balance");
    });

    it("should mark critical errors for failure", () => {
      const error = new Error("Fuel node not responding");
      const response = ErrorClassifier.handleError(error);

      expect(response.shouldFail).toBe(true);
    });
  });

  describe("Context Handling", () => {
    it("should include context in classification", () => {
      const error = new Error("Service timeout");
      const context = {
        service: "indexer",
        timeout: 30000,
        attempt: 3,
      };
      const classified = ErrorClassifier.classify(error, context);

      expect(classified.context).toEqual(context);
    });

    it("should handle empty context", () => {
      const error = new Error("Some error");
      const classified = ErrorClassifier.classify(error);

      expect(classified.context).toBeUndefined();
    });

    it("should include context in error reports", () => {
      const error = new Error("Connection failed");
      const context = {url: "http://localhost:4000", retries: 3};
      const report = ErrorClassifier.createErrorReport(error, context);

      expect(report).toContain("url");
      expect(report).toContain("retries");
    });
  });
});

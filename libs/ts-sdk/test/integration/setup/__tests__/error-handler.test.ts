import {describe, it, expect} from "vitest";
import {ErrorHandler} from "../error-handler";

describe("ErrorHandler", () => {
  describe("Error Formatting", () => {
    it("should format infrastructure errors with helpful context", () => {
      const error = new Error("Port 4000 is already in use");
      const context = {port: 4000, service: "fuel-node"};
      const operation = "Starting Fuel Node";

      const formatted = ErrorHandler.formatError(error, context, operation);

      expect(formatted).toContain("TEST INFRASTRUCTURE ERROR");
      expect(formatted).toContain("Operation: Starting Fuel Node");
      expect(formatted).toContain("Category: 🏗️ INFRASTRUCTURE");
      expect(formatted).toContain("Type: port_conflict");
      expect(formatted).toContain("Severity: 🟠 HIGH");
      expect(formatted).toContain("CONTEXT INFORMATION");
      expect(formatted).toContain("port: 4000");
      expect(formatted).toContain("SUGGESTED FIXES");
      expect(formatted).toContain("NEXT STEPS");
      expect(formatted).toContain("lsof");
    });

    it("should format application errors appropriately", () => {
      const error = new Error("Contract call failed: revert");
      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toContain("Category: 🔧 APPLICATION");
      expect(formatted).toContain("Type: contract_call");
      expect(formatted).toContain("Retryable: ❌ No");
      expect(formatted).toContain("contract parameters");
    });

    it("should include stack trace information", () => {
      const error = new Error("Test error");
      error.stack = "Error: Test error\n    at test.js:1:1\n    at main.js:2:2";

      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toContain("Stack:");
      expect(formatted).toContain("test.js:1:1");
    });

    it("should handle errors without context gracefully", () => {
      const error = new Error("Simple error");
      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toContain("ERROR CLASSIFICATION");
      expect(formatted).toContain("SUGGESTED FIXES");
      expect(formatted).not.toContain("CONTEXT INFORMATION");
    });
  });

  describe("Diagnostic Information", () => {
    it("should provide port conflict diagnostics", () => {
      const error = new Error("EADDRINUSE: port 4000 already in use");
      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toContain("DIAGNOSTIC INFORMATION");
      expect(formatted).toContain("Port conflict detected");
      expect(formatted).toContain("lsof -i :4000");
      expect(formatted).toContain("ps aux | grep fuel");
    });

    it("should provide service startup diagnostics", () => {
      const error = new Error("Timeout waiting for services to start");
      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toContain("Service startup failure");
      expect(formatted).toContain("pnpm and nx are installed");
      expect(formatted).toContain("workspace directory");
    });

    it("should provide wallet funding diagnostics", () => {
      const error = new Error("Wallet funding failed");
      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toContain("Wallet funding failure");
      expect(formatted).toContain("master wallet balance");
      expect(formatted).toContain("UTXO conflicts");
    });

    it("should provide timeout diagnostics", () => {
      const error = new Error("Operation timed out");
      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toContain("Timeout occurred");
      expect(formatted).toContain("system resource usage");
      expect(formatted).toContain("network connectivity");
    });
  });

  describe("Suggested Fixes", () => {
    it("should provide specific fixes for port conflicts", () => {
      const error = new Error("Port already in use");
      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toContain("lsof -ti:4000 | xargs kill -9");
      expect(formatted).toContain("Use different ports");
      expect(formatted).toContain("Restart your development environment");
    });

    it("should provide specific fixes for service startup", () => {
      const error = new Error("Service not ready");
      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toContain("pnpm install");
      expect(formatted).toContain("pnpm nx dev indexer");
      expect(formatted).toContain("workspace directory");
    });

    it("should provide specific fixes for wallet funding", () => {
      const error = new Error("Transfer failed");
      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toContain("0.1 ETH instead of 10 ETH");
      expect(formatted).toContain("delay between wallet");
      expect(formatted).toContain("exponential backoff");
    });

    it("should provide generic fixes for unknown errors", () => {
      const error = new Error("Unknown error type");
      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toContain("Review error message");
      expect(formatted).toContain("Check recent changes");
      expect(formatted).toContain("Consult documentation");
    });
  });

  describe("Error Summary", () => {
    it("should create concise error summaries", () => {
      const error = new Error("Port 4000 already in use");
      const context = {service: "fuel-node"};
      const summary = ErrorHandler.createErrorSummary(error, context);

      expect(summary).toContain("[INFRASTRUCTURE]");
      expect(summary).toContain("port_conflict");
      expect(summary).toContain("Port 4000 already in use");
      expect(summary).toContain("Fix:");
    });

    it("should handle summaries without suggested fixes", () => {
      const error = new Error("Unknown error");
      const summary = ErrorHandler.createErrorSummary(error);

      expect(summary).toContain("[UNKNOWN]");
      expect(summary).not.toContain("Fix:");
    });
  });

  describe("Failure Decision", () => {
    it("should identify critical errors that require immediate failure", () => {
      const criticalError = new Error("Fuel node not responding");
      expect(ErrorHandler.shouldFailImmediately(criticalError)).toBe(true);
    });

    it("should identify non-retryable infrastructure errors", () => {
      const portError = new Error("Port already in use");
      expect(ErrorHandler.shouldFailImmediately(portError)).toBe(true);
    });

    it("should not fail immediately for retryable errors", () => {
      const retryableError = new Error("Timeout waiting for service");
      expect(ErrorHandler.shouldFailImmediately(retryableError)).toBe(false);
    });

    it("should not fail immediately for application errors", () => {
      const appError = new Error("Contract call failed");
      expect(ErrorHandler.shouldFailImmediately(appError)).toBe(false);
    });
  });

  describe("Retry Strategy", () => {
    it("should provide retry strategy for wallet funding errors", () => {
      const error = new Error("Wallet funding failed");
      const strategy = ErrorHandler.getRetryStrategy(error);

      expect(strategy.shouldRetry).toBe(true);
      expect(strategy.maxRetries).toBe(3);
      expect(strategy.baseDelay).toBe(1000);
      expect(strategy.backoffMultiplier).toBe(2);
    });

    it("should provide retry strategy for service startup errors", () => {
      const error = new Error("Service not ready");
      const strategy = ErrorHandler.getRetryStrategy(error);

      expect(strategy.shouldRetry).toBe(true);
      expect(strategy.maxRetries).toBe(2);
      expect(strategy.baseDelay).toBe(5000);
    });

    it("should not retry non-retryable errors", () => {
      const error = new Error("Port already in use");
      const strategy = ErrorHandler.getRetryStrategy(error);

      expect(strategy.shouldRetry).toBe(false);
      expect(strategy.maxRetries).toBe(0);
    });

    it("should provide default retry strategy for unknown retryable errors", () => {
      const error = new Error("Connection timeout");
      const strategy = ErrorHandler.getRetryStrategy(error);

      expect(strategy.shouldRetry).toBe(true);
      expect(strategy.maxRetries).toBe(2);
      expect(strategy.baseDelay).toBe(2000);
    });
  });

  describe("Complete Error Handling", () => {
    it("should handle error with full recovery information", () => {
      const error = new Error("Insufficient balance for transfer");
      const context = {walletAddress: "0x123", requiredAmount: "10 ETH"};
      const operation = "Creating test wallet";

      const result = ErrorHandler.handleErrorWithRecovery(
        error,
        context,
        operation
      );

      expect(result.formattedError).toContain("TEST INFRASTRUCTURE ERROR");
      expect(result.formattedError).toContain("Creating test wallet");
      expect(result.summary).toContain("[INFRASTRUCTURE]");
      expect(result.shouldRetry).toBe(false);
      expect(result.shouldFail).toBe(true);
      expect(result.retryStrategy.shouldRetry).toBe(false);
    });

    it("should handle retryable errors with recovery", () => {
      const error = new Error("Connection timeout");
      const result = ErrorHandler.handleErrorWithRecovery(error);

      expect(result.shouldRetry).toBe(true);
      expect(result.shouldFail).toBe(false);
      expect(result.retryStrategy.shouldRetry).toBe(true);
      expect(result.retryStrategy.maxRetries).toBeGreaterThan(0);
    });
  });

  describe("Context Value Formatting", () => {
    it("should format object context values as JSON", () => {
      const error = new Error("Test error");
      const context = {
        config: {port: 4000, timeout: 30000},
        array: [1, 2, 3],
      };
      const formatted = ErrorHandler.formatError(error, context);

      expect(formatted).toContain('"port": 4000');
      expect(formatted).toContain('"timeout": 30000');
      expect(formatted).toContain("1,");
    });

    it("should format primitive context values as strings", () => {
      const error = new Error("Test error");
      const context = {
        port: 4000,
        service: "fuel-node",
        enabled: true,
      };
      const formatted = ErrorHandler.formatError(error, context);

      expect(formatted).toContain("port: 4000");
      expect(formatted).toContain("service: fuel-node");
      expect(formatted).toContain("enabled: true");
    });
  });
});

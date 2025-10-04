import {describe, it, expect, beforeEach, afterEach} from "vitest";
import * as fs from "fs";
import * as path from "path";
import {DiagnosticLogger, LogLevel} from "../diagnostic-logger";

describe("DiagnosticLogger", () => {
  let logger: DiagnosticLogger;
  const tempDir = path.join(__dirname, "../../../../.temp");

  beforeEach(() => {
    // Create fresh logger instance for each test
    logger = DiagnosticLogger.getInstance();
    logger.clearLogs();

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, {recursive: true});
    }
  });

  afterEach(() => {
    logger.clearLogs();
  });

  describe("Basic Logging", () => {
    it("should log entries with all required fields", () => {
      const context = {testData: "value"};
      const error = new Error("Test error");

      logger.log(
        LogLevel.ERROR,
        "TEST_CATEGORY",
        "test_operation",
        "Test message",
        context,
        error
      );

      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);

      const log = logs[0];
      expect(log.level).toBe(LogLevel.ERROR);
      expect(log.category).toBe("TEST_CATEGORY");
      expect(log.operation).toBe("test_operation");
      expect(log.message).toBe("Test message");
      expect(log.context).toEqual(context);
      expect(log.error).toBe(error);
      expect(log.timestamp).toBeDefined();
    });

    it("should log without context and error", () => {
      logger.log(LogLevel.INFO, "SIMPLE", "simple_op", "Simple message");

      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].context).toBeUndefined();
      expect(logs[0].error).toBeUndefined();
    });

    it("should maintain log order", () => {
      logger.log(LogLevel.INFO, "CAT1", "op1", "First");
      logger.log(LogLevel.WARN, "CAT2", "op2", "Second");
      logger.log(LogLevel.ERROR, "CAT3", "op3", "Third");

      const logs = logger.getRecentLogs(3);
      expect(logs).toHaveLength(3);
      expect(logs[0].message).toBe("First");
      expect(logs[1].message).toBe("Second");
      expect(logs[2].message).toBe("Third");
    });
  });

  describe("Service Startup Logging", () => {
    it("should log service startup attempt", () => {
      const config = {port: 4000, timeout: 30000};
      logger.logServiceStartup("fuel-node", config);

      const logs = logger.getLogsByCategory("SERVICE_STARTUP");
      expect(logs).toHaveLength(1);
      expect(logs[0].operation).toBe("start_fuel-node");
      expect(logs[0].context?.serviceName).toBe("fuel-node");
      expect(logs[0].context?.config).toEqual(config);
    });

    it("should log service startup success", () => {
      const duration = 5000;
      const details = {pid: 12345};
      logger.logServiceStartupSuccess("indexer", duration, details);

      const logs = logger.getLogsByCategory("SERVICE_STARTUP");
      expect(logs).toHaveLength(1);
      expect(logs[0].operation).toBe("start_indexer_success");
      expect(logs[0].context?.duration).toBe(duration);
      expect(logs[0].context?.pid).toBe(12345);
    });

    it("should log service startup failure with diagnostics", () => {
      const error = new Error("Port already in use");
      const duration = 2000;
      const diagnostics = {port: 4000, processId: null};

      logger.logServiceStartupFailure(
        "fuel-node",
        error,
        duration,
        diagnostics
      );

      const logs = logger.getLogsByCategory("SERVICE_STARTUP");
      expect(logs).toHaveLength(1);
      expect(logs[0].operation).toBe("start_fuel-node_failure");
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].context?.duration).toBe(duration);
      expect(logs[0].context?.port).toBe(4000);
      expect(logs[0].error).toBe(error);
    });
  });

  describe("Wallet Operation Logging", () => {
    it("should log wallet operations", () => {
      const walletInfo = {address: "0x123", balance: "10 ETH"};
      const details = {amount: "1 ETH"};

      logger.logWalletOperation("create_wallet", walletInfo, details);

      const logs = logger.getLogsByCategory("WALLET_OPERATION");
      expect(logs).toHaveLength(1);
      expect(logs[0].operation).toBe("create_wallet");
      expect(logs[0].context?.walletInfo).toEqual(walletInfo);
      expect(logs[0].context?.amount).toBe("1 ETH");
    });

    it("should log wallet funding attempts", () => {
      const walletAddress = "0x456";
      const amount = "5 ETH";
      const masterBalance = "100 ETH";
      const tokenBalances = {USDC: "1000", FUEL: "500"};

      logger.logWalletFunding(
        walletAddress,
        amount,
        masterBalance,
        tokenBalances
      );

      const logs = logger.getLogsByCategory("WALLET_FUNDING");
      expect(logs).toHaveLength(1);
      expect(logs[0].context?.walletAddress).toBe(walletAddress);
      expect(logs[0].context?.amount).toBe(amount);
      expect(logs[0].context?.masterWalletBalance).toBe(masterBalance);
      expect(logs[0].context?.tokenBalances).toEqual(tokenBalances);
    });

    it("should log wallet funding failures with detailed info", () => {
      const walletAddress = "0x789";
      const amount = "50 ETH";
      const error = new Error("Insufficient balance");
      const balanceInfo = {available: "10 ETH", required: "50 ETH"};
      const transactionDetails = {gasPrice: "1 gwei", gasLimit: 21000};

      logger.logWalletFundingFailure(
        walletAddress,
        amount,
        error,
        balanceInfo,
        transactionDetails
      );

      const logs = logger.getLogsByCategory("WALLET_FUNDING");
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].context?.requestedAmount).toBe(amount);
      expect(logs[0].context?.balanceInfo).toEqual(balanceInfo);
      expect(logs[0].context?.transactionDetails).toEqual(transactionDetails);
      expect(logs[0].error).toBe(error);
    });
  });

  describe("Timeout Logging", () => {
    it("should log timeout events with timing information", () => {
      const operation = "service_startup";
      const timeoutValue = 30000;
      const actualDuration = 45000;
      const context = {service: "fuel-node"};

      logger.logTimeout(operation, timeoutValue, actualDuration, context);

      const logs = logger.getLogsByCategory("TIMEOUT");
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].context?.timeoutValue).toBe(timeoutValue);
      expect(logs[0].context?.actualDuration).toBe(actualDuration);
      expect(logs[0].context?.overrun).toBe(15000);
      expect(logs[0].context?.service).toBe("fuel-node");
    });
  });

  describe("Health Check Logging", () => {
    it("should log health check attempts", () => {
      const serviceName = "indexer";
      const url = "http://localhost:4350/graphql";
      const timeout = 5000;

      logger.logHealthCheck(serviceName, url, timeout);

      const logs = logger.getLogsByCategory("HEALTH_CHECK");
      expect(logs).toHaveLength(1);
      expect(logs[0].operation).toBe("health_indexer");
      expect(logs[0].context?.url).toBe(url);
      expect(logs[0].context?.timeout).toBe(timeout);
    });

    it("should log successful health check results", () => {
      const serviceName = "fuel-node";
      const duration = 200;
      const response = {status: "ok"};

      logger.logHealthCheckResult(serviceName, true, duration, response);

      const logs = logger.getLogsByCategory("HEALTH_CHECK");
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].context?.success).toBe(true);
      expect(logs[0].context?.duration).toBe(duration);
    });

    it("should log failed health check results", () => {
      const serviceName = "indexer";
      const duration = 5000;
      const error = new Error("Connection refused");

      logger.logHealthCheckResult(serviceName, false, duration, null, error);

      const logs = logger.getLogsByCategory("HEALTH_CHECK");
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].context?.success).toBe(false);
      expect(logs[0].context?.errorMessage).toBe("Connection refused");
      expect(logs[0].error).toBe(error);
    });
  });

  describe("Log Filtering and Retrieval", () => {
    beforeEach(() => {
      // Add test logs
      logger.log(LogLevel.DEBUG, "CAT1", "op1", "Debug message");
      logger.log(LogLevel.INFO, "CAT1", "op2", "Info message");
      logger.log(LogLevel.WARN, "CAT2", "op3", "Warning message");
      logger.log(LogLevel.ERROR, "CAT2", "op4", "Error message");
      logger.log(LogLevel.CRITICAL, "CAT3", "op5", "Critical message");
    });

    it("should filter logs by category", () => {
      const cat1Logs = logger.getLogsByCategory("CAT1");
      expect(cat1Logs).toHaveLength(2);
      expect(cat1Logs[0].message).toBe("Debug message");
      expect(cat1Logs[1].message).toBe("Info message");

      const cat2Logs = logger.getLogsByCategory("CAT2");
      expect(cat2Logs).toHaveLength(2);
      expect(cat2Logs[0].message).toBe("Warning message");
      expect(cat2Logs[1].message).toBe("Error message");
    });

    it("should filter logs by level", () => {
      const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe("Error message");

      const warnLogs = logger.getLogsByLevel(LogLevel.WARN);
      expect(warnLogs).toHaveLength(1);
      expect(warnLogs[0].message).toBe("Warning message");
    });

    it("should get recent logs", () => {
      const recent = logger.getRecentLogs(3);
      expect(recent).toHaveLength(3);
      expect(recent[0].message).toBe("Warning message");
      expect(recent[1].message).toBe("Error message");
      expect(recent[2].message).toBe("Critical message");
    });

    it("should get error logs", () => {
      const errorLogs = logger.getErrorLogs();
      expect(errorLogs).toHaveLength(2);
      expect(errorLogs[0].level).toBe(LogLevel.ERROR);
      expect(errorLogs[1].level).toBe(LogLevel.CRITICAL);
    });
  });

  describe("Diagnostic Report Generation", () => {
    beforeEach(() => {
      // Add various types of logs for report testing
      logger.logServiceStartup("fuel-node");
      logger.logServiceStartupFailure(
        "fuel-node",
        new Error("Port conflict"),
        5000,
        {port: 4000}
      );
      logger.logWalletFunding("0x123", "10 ETH");
      logger.logWalletFundingFailure(
        "0x456",
        "50 ETH",
        new Error("Insufficient balance"),
        {available: "10 ETH"}
      );
      logger.logTimeout("service_startup", 30000, 45000);
    });

    it("should generate comprehensive diagnostic report", () => {
      const report = logger.generateDiagnosticReport();

      expect(report).toContain("DIAGNOSTIC REPORT");
      expect(report).toContain("ERROR SUMMARY");
      expect(report).toContain("SERVICE STARTUP ANALYSIS");
      expect(report).toContain("WALLET OPERATION ANALYSIS");
      expect(report).toContain("TIMEOUT ANALYSIS");
      expect(report).toContain("Total Errors: 2");
      expect(report).toContain("Startup Failures: 1");
      expect(report).toContain("Wallet Failures: 1");
      expect(report).toContain("Timeout Events: 1");
    });

    it("should include timing information in report", () => {
      const report = logger.generateDiagnosticReport();

      expect(report).toContain("Session Duration:");
      expect(report).toContain("Total Log Entries:");
      expect(report).toContain("overrun");
    });
  });

  describe("Log Export", () => {
    it("should export logs to JSON file", () => {
      logger.log(LogLevel.INFO, "TEST", "export_test", "Test export");

      const exportPath = logger.exportLogs();

      expect(fs.existsSync(exportPath)).toBe(true);

      const exportedData = JSON.parse(fs.readFileSync(exportPath, "utf8"));
      expect(exportedData.metadata).toBeDefined();
      expect(exportedData.logs).toHaveLength(1);
      expect(exportedData.diagnosticReport).toContain("DIAGNOSTIC REPORT");

      // Cleanup
      fs.unlinkSync(exportPath);
    });

    it("should export to custom path", () => {
      const customPath = path.join(tempDir, "custom-export.json");
      logger.log(LogLevel.INFO, "TEST", "custom_export", "Custom export test");

      const exportPath = logger.exportLogs(customPath);

      expect(exportPath).toBe(customPath);
      expect(fs.existsSync(customPath)).toBe(true);

      // Cleanup
      fs.unlinkSync(customPath);
    });
  });

  describe("Log Management", () => {
    it("should limit log entries in memory", () => {
      logger.setMaxLogEntries(3);

      // Add more logs than the limit
      for (let i = 0; i < 5; i++) {
        logger.log(LogLevel.INFO, "TEST", `op${i}`, `Message ${i}`);
      }

      const logs = logger.getRecentLogs(10);
      expect(logs).toHaveLength(3);
      expect(logs[0].message).toBe("Message 2");
      expect(logs[2].message).toBe("Message 4");
    });

    it("should clear all logs", () => {
      logger.log(LogLevel.INFO, "TEST", "test", "Test message");
      expect(logger.getRecentLogs(10)).toHaveLength(1);

      logger.clearLogs();
      expect(logger.getRecentLogs(10)).toHaveLength(0);
    });

    it("should provide log file path", () => {
      const logFilePath = logger.getLogFilePath();
      expect(logFilePath).toBeDefined();
      expect(logFilePath).toContain("diagnostic-");
    });
  });
});

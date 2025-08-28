import {describe, it, expect} from "vitest";
import {MockAccount, MockSDKConfig, DEFAULT_MOCK_CONFIG} from "../index";

describe("Mock SDK Integration", () => {
  it("should export all required components", () => {
    // Verify MockAccount is exported
    expect(MockAccount).toBeDefined();
    expect(typeof MockAccount).toBe("function");

    // Verify types are exported
    expect(DEFAULT_MOCK_CONFIG).toBeDefined();
    expect(typeof DEFAULT_MOCK_CONFIG).toBe("object");
  });

  it("should create MockAccount with default config", () => {
    const account = MockAccount.createWithTestBalances();

    expect(account).toBeInstanceOf(MockAccount);
    expect(account.address).toBe("0x1234567890abcdef");
    expect(account.getAllBalances().size).toBe(3);
  });

  it("should have proper default configuration", () => {
    expect(DEFAULT_MOCK_CONFIG.enablePersistence).toBe(false);
    expect(DEFAULT_MOCK_CONFIG.defaultFailureRate).toBe(0.05);
    expect(DEFAULT_MOCK_CONFIG.defaultLatencyMs).toBe(1000);
    expect(DEFAULT_MOCK_CONFIG.enableRealisticGas).toBe(true);
    expect(DEFAULT_MOCK_CONFIG.enablePriceImpact).toBe(true);
    expect(DEFAULT_MOCK_CONFIG.enableSlippageSimulation).toBe(true);
  });
});

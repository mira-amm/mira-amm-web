import {BN} from "fuels";
import {vi} from "vitest";
import {MockTransactionProcessor} from "../MockTransactionProcessor";
import {MockErrorSimulator} from "../MockErrorSimulator";
import {MockLiquidityCalculator} from "../MockLiquidityCalculator";
import {DEFAULT_MOCK_CONFIG} from "../types";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";

describe("MockTransactionProcessor", () => {
  it("should create instance without errors", () => {
    const mockStateManager = {
      getPool: vi.fn(),
      addTransaction: vi.fn(),
    } as any;

    const processor = new MockTransactionProcessor(
      DEFAULT_MOCK_CONFIG,
      mockStateManager
    );

    expect(processor).toBeDefined();
    expect(processor.getErrorSimulator()).toBeInstanceOf(MockErrorSimulator);
  });

  it("should provide access to liquidity calculator", () => {
    const calculator = MockTransactionProcessor.getLiquidityCalculator();
    expect(calculator).toBe(MockLiquidityCalculator);
  });
});

describe("MockErrorSimulator", () => {
  it("should create instance and configure error rates", () => {
    const simulator = new MockErrorSimulator(DEFAULT_MOCK_CONFIG);

    simulator.setErrorRate("addLiquidity", 0.1);
    const config = simulator.getErrorConfig("addLiquidity");

    expect(config?.failureRate).toBe(0.1);
  });

  it("should provide predefined scenarios", () => {
    const scenarios = MockErrorSimulator.getPredefinedScenarios();
    expect(scenarios.length).toBeGreaterThan(0);
    expect(scenarios[0]).toHaveProperty("name");
    expect(scenarios[0]).toHaveProperty("operations");
  });
});

describe("MockLiquidityCalculator", () => {
  it("should calculate bin prices correctly", () => {
    const binId = 0;
    const binStep = 25; // 0.25%

    const price = MockLiquidityCalculator.getBinPrice(binId, binStep);
    expect(price.toString()).toBe(new BN(10).pow(18).toString()); // Should be 1.0 scaled
  });

  it("should calculate price bin ID correctly", () => {
    const price = new BN(10).pow(18); // 1.0 scaled
    const binStep = 25;

    const binId = MockLiquidityCalculator.getPriceBinId(price, binStep);
    expect(binId).toBe(0);
  });

  it("should distribute liquidity across bins", () => {
    const totalAmountX = new BN("1000000");
    const totalAmountY = new BN("2000000");
    const config = {
      centerBinId: 0,
      binCount: 5,
      strategy: "uniform" as const,
    };
    const binStep = 25;

    const bins = MockLiquidityCalculator.distributeLiquidity(
      totalAmountX,
      totalAmountY,
      config,
      binStep
    );

    expect(bins).toHaveLength(5);
    expect(bins[2].isActive).toBe(true); // Center bin should be active
  });
});

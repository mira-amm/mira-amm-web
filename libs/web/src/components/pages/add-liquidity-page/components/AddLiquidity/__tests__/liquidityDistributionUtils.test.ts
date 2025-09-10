import {
  computeIdSlippageFromBps,
  computeDistributionBpsForRaw,
  computeUtilizationRate,
} from "../liquidityDistributionUtils";

describe("liquidityDistributionUtils", () => {
  it("computes id slippage from bps", () => {
    expect(computeIdSlippageFromBps(25, 100)).toBe(4);
    expect(computeIdSlippageFromBps(0, 100)).toBe(0);
    expect(computeIdSlippageFromBps(25, undefined)).toBe(0);
  });

  it("handles zero arrays gracefully", () => {
    expect(computeDistributionBpsForRaw([], 0)).toEqual([]);
  });

  it("computes distributions from raw values using totals", () => {
    const bps = computeDistributionBpsForRaw([1, 1, 2], 4);
    expect(bps.reduce((a, b) => a + b, 0)).toBe(10000);
    // Expected ratios 25%, 25%, 50%
    expect(bps[2]).toBeGreaterThanOrEqual(bps[0]);
    expect(bps[2]).toBeGreaterThanOrEqual(bps[1]);
  });

  it("computes utilization rate with guards", () => {
    expect(computeUtilizationRate(0, 0, 0, 0)).toBe(0);
    expect(computeUtilizationRate(10, 10, 5, 5)).toBe(50);
  });
});

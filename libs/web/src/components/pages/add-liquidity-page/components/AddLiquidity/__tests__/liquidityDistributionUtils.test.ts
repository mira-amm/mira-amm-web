import {
  computeIdSlippageFromBps,
  computeDistributionBpsForRaw,
  computeUtilizationRate,
  renormalizeBps,
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

  describe("renormalizeBps", () => {
    it("handles empty arrays", () => {
      expect(renormalizeBps([])).toEqual([]);
    });

    it("handles arrays with all zeros", () => {
      expect(renormalizeBps([0, 0, 0])).toEqual([0, 0, 0]);
    });

    it("returns unchanged array when sum is already 10000", () => {
      const input = [5000, 3000, 2000];
      expect(renormalizeBps(input)).toEqual(input);
    });

    it("scales values when sum is less than 10000", () => {
      const input = [2500, 2500]; // sum = 5000
      const result = renormalizeBps(input);
      expect(result.reduce((a, b) => a + b, 0)).toBe(10000);
      // Should scale each by 2x
      expect(result[0]).toBe(5000);
      expect(result[1]).toBe(5000);
    });

    it("scales values when sum is greater than 10000", () => {
      const input = [6000, 6000]; // sum = 12000
      const result = renormalizeBps(input);
      expect(result.reduce((a, b) => a + b, 0)).toBe(10000);
      // Should scale down proportionally
      expect(result[0]).toBeCloseTo(5000, -1);
      expect(result[1]).toBeCloseTo(5000, -1);
    });

    it("handles rounding errors by adjusting largest value", () => {
      const input = [3333, 3333, 3333]; // sum = 9999
      const result = renormalizeBps(input);
      expect(result.reduce((a, b) => a + b, 0)).toBe(10000);
      // One value should be adjusted to make sum exactly 10000
      expect(Math.max(...result)).toBeGreaterThan(Math.min(...result));
    });

    it("works with filtered distributions", () => {
      // Simulate filtering: original [5000, 0, 5000] -> filtered [5000, 5000]
      const filtered = [5000, 5000];
      const result = renormalizeBps(filtered);
      expect(result.reduce((a, b) => a + b, 0)).toBe(10000);
      expect(result[0]).toBe(5000);
      expect(result[1]).toBe(5000);
    });

    it("handles asymmetric distributions after filtering", () => {
      // Simulate: original [7000, 0, 2000, 0, 1000] -> filtered [7000, 2000, 1000]
      const filtered = [7000, 2000, 1000]; // sum = 10000 already
      const result = renormalizeBps(filtered);
      expect(result.reduce((a, b) => a + b, 0)).toBe(10000);
      expect(result).toEqual([7000, 2000, 1000]);
    });
  });
});

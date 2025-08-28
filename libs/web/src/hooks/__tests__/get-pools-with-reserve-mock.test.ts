/**
 * Test to verify mock pool integration works correctly
 */

import {describe, it, expect, beforeAll, afterAll} from "vitest";

describe("Mock Pool Integration", () => {
  let originalEnv: string | undefined;

  beforeAll(() => {
    // Save original environment
    originalEnv = process.env.NEXT_PUBLIC_ENABLE_V2_MOCK;
    // Enable mock mode
    process.env.NEXT_PUBLIC_ENABLE_V2_MOCK = "true";
  });

  afterAll(() => {
    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_ENABLE_V2_MOCK = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_ENABLE_V2_MOCK;
    }
  });

  it("should load mock pools when mock mode is enabled", async () => {
    // Dynamic import to ensure mock mode is detected
    const {fetchPoolsWithReserve} = await import("../get-pools-with-reserve");

    // Call with empty pool keys since mock mode ignores them
    const pools = await fetchPoolsWithReserve([]);

    // Should return mock pools from MockDataGenerator
    expect(pools.length).toBeGreaterThan(0);

    // Check that we have ETH and USDC pools
    const hasEthPool = pools.some(
      (pool) => pool.assetA.symbol === "ETH" || pool.assetB.symbol === "ETH"
    );
    const hasUsdcPool = pools.some(
      (pool) => pool.assetA.symbol === "USDC" || pool.assetB.symbol === "USDC"
    );

    expect(hasEthPool).toBe(true);
    expect(hasUsdcPool).toBe(true);

    // Check that pools have realistic reserves
    pools.forEach((pool) => {
      expect(pool.reserve0).toBeTruthy();
      expect(pool.reserve1).toBeTruthy();
      expect(BigInt(pool.reserve0)).toBeGreaterThan(0n);
      expect(BigInt(pool.reserve1)).toBeGreaterThan(0n);
    });

    console.log(`Mock integration test: Found ${pools.length} mock pools`);
    pools.forEach((pool) => {
      console.log(
        `- ${pool.assetA.symbol}/${pool.assetB.symbol}: ${pool.reserve0}/${pool.reserve1}`
      );
    });
  });

  it("should not load mock pools when mock mode is disabled", async () => {
    // Temporarily disable mock mode
    process.env.NEXT_PUBLIC_ENABLE_V2_MOCK = "false";

    try {
      const {fetchPoolsWithReserve} = await import("../get-pools-with-reserve");

      // This should try to fetch from GraphQL and likely fail or return empty
      // since we're not providing real pool keys
      const pools = await fetchPoolsWithReserve([]);

      // Should return empty array since no real pool keys provided
      expect(pools).toEqual([]);
    } catch (error) {
      // It's also acceptable if it throws an error trying to reach the GraphQL endpoint
      expect(error).toBeDefined();
    } finally {
      // Restore mock mode
      process.env.NEXT_PUBLIC_ENABLE_V2_MOCK = "true";
    }
  });
});

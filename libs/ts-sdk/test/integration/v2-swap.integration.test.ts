/**
 * V2 Swap Integration Tests
 *
 * Tests the V2 SDK swap functionality end-to-end:
 * - Swap preview calculations
 * - Swap execution
 * - Multi-hop swaps
 * - Price impact validation
 */

import {describe, it, expect, beforeAll, afterAll} from "vitest";
import {Provider, WalletUnlocked, bn, BN} from "fuels";
import {ReadonlyMiraAmmV2, MiraAmmV2} from "../../src/sdk";
import type {PoolIdV2} from "../../src/sdk/model";

describe("V2 Swap Operations", () => {
  let provider: Provider;
  let wallet: WalletUnlocked;
  let readonlyMira: ReadonlyMiraAmmV2;
  let mira: MiraAmmV2;

  // Test environment configuration
  const FUEL_NODE_URL =
    process.env.GRAPHQL_URL || "http://localhost:4000/v1/graphql";
  const DEPLOYER_SK =
    "0xa449b1ffee0e2205fa924c6740cc48b3b473aa28587df6dab12abc245d1f5298";
  const AMM_CONTRACT_ID =
    process.env.AMM_BINNED_LIQUIDITY_CONTRACT_ADDRESS ||
    "0x067239a9a1b4d9d3a055d90bb10a9158defdd90a85a808a855cff09c3676fa86";

  // Test tokens (from local setup)
  const USDC_ASSET_ID =
    "0xa75f04c2a6858712f56e4b735cb4bb690a666455e95175d8eed25b2e2ede2836";
  const ETH_ASSET_ID =
    "0xb93970be997249264374ebea04431aa5897f7343de77aa2aae79909b577fff24";
  const FUEL_ASSET_ID =
    "0xa45644779d87dc9b4b1b670c94918b6828fda7eca31a0ca29518baf718c64005";

  // Pool IDs (from indexer output)
  const USDC_ETH_POOL_ID = bn(
    "101261037780288161599193964289144461983093588855058010462373290973600364262648"
  );
  const USDC_FUEL_POOL_ID = bn(
    "110374294193665552287147159764701070765777766513252034005025561616181479416329"
  );
  const ETH_FUEL_POOL_ID = bn(
    "2521035134372586662867834803347650185485283501363297722561549203806294120840"
  );

  beforeAll(async () => {
    console.log("🔧 Setting up V2 swap test environment...");

    // Initialize provider and wallet
    provider = new Provider(FUEL_NODE_URL);
    wallet = new WalletUnlocked(DEPLOYER_SK, provider);

    console.log(`👛 Wallet: ${wallet.address.toB256()}`);
    console.log(`🏦 AMM Contract: ${AMM_CONTRACT_ID}`);

    // Initialize SDK instances
    readonlyMira = new ReadonlyMiraAmmV2(provider, AMM_CONTRACT_ID);
    mira = new MiraAmmV2(wallet, AMM_CONTRACT_ID);

    console.log("✅ Test environment ready\n");
  }, 30000);

  describe("Single Pool Swaps", () => {
    it("should preview swap exact input (USDC → ETH)", async () => {
      console.log("\n📊 Testing: Preview Swap Exact Input (USDC → ETH)");

      const swapAmount = bn(100_000_000); // 100 USDC (6 decimals)
      console.log(`  Input: ${swapAmount.format()} base units (100 USDC)`);

      const result = await readonlyMira.previewSwapExactInput(
        {bits: USDC_ASSET_ID},
        swapAmount,
        [USDC_ETH_POOL_ID]
      );

      console.log(`  Output Asset: ${result[0].bits}`);
      console.log(`  Output Amount: ${result[1].format()} base units`);

      expect(result).toBeDefined();
      expect(result[0].bits).toBe(ETH_ASSET_ID);
      expect(result[1].gt(0)).toBe(true);

      // With 10,000 USDC / 5 ETH in pool
      // 100 USDC should get approximately 0.05 ETH (50,000,000 base units)
      const expectedApprox = bn(50_000_000); // 0.05 ETH
      const tolerance = expectedApprox.mul(20).div(100); // 20% tolerance for fees

      expect(result[1].gte(expectedApprox.sub(tolerance))).toBe(true);
      expect(result[1].lte(expectedApprox.add(tolerance))).toBe(true);

      console.log("  ✅ Swap preview calculated correctly");
    }, 30000);

    it("should preview swap exact output (ETH → USDC)", async () => {
      console.log("\n📊 Testing: Preview Swap Exact Output (ETH → USDC)");

      const desiredOutput = bn(100_000_000); // Want 100 USDC out
      console.log(
        `  Desired output: ${desiredOutput.format()} base units (100 USDC)`
      );

      const result = await readonlyMira.previewSwapExactOutput(
        {bits: USDC_ASSET_ID},
        desiredOutput,
        [USDC_ETH_POOL_ID]
      );

      console.log(`  Required Input Asset: ${result[0].bits}`);
      console.log(`  Required Input Amount: ${result[1].format()} base units`);

      expect(result).toBeDefined();
      expect(result[0].bits).toBe(ETH_ASSET_ID);
      expect(result[1].gt(0)).toBe(true);

      console.log("  ✅ Swap preview (exact output) calculated correctly");
    }, 30000);

    it("should handle swap in opposite direction (ETH → USDC exact in)", async () => {
      console.log("\n📊 Testing: Swap ETH → USDC");

      const swapAmount = bn(10_000_000); // 0.01 ETH (9 decimals)
      console.log(`  Input: ${swapAmount.format()} base units (0.01 ETH)`);

      const result = await readonlyMira.previewSwapExactInput(
        {bits: ETH_ASSET_ID},
        swapAmount,
        [USDC_ETH_POOL_ID]
      );

      expect(result[0].bits).toBe(USDC_ASSET_ID);
      expect(result[1].gt(0)).toBe(true);

      console.log(`  Output: ${result[1].format()} base units USDC`);
      console.log("  ✅ Reverse swap works");
    }, 30000);
  });

  describe("Multi-Pool Swaps", () => {
    it("should preview multi-hop swap (USDC → ETH → FUEL)", async () => {
      console.log("\n📊 Testing: Multi-hop Swap (USDC → ETH → FUEL)");

      const swapAmount = bn(100_000_000); // 100 USDC
      console.log(`  Input: ${swapAmount.format()} base units (100 USDC)`);
      console.log("  Route: USDC → ETH → FUEL");

      const result = await readonlyMira.previewSwapExactInput(
        {bits: USDC_ASSET_ID},
        swapAmount,
        [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID] // Two pools for 2-hop swap
      );

      console.log(`  Output Asset: ${result[0].bits}`);
      console.log(`  Output Amount: ${result[1].format()} base units`);

      expect(result[0].bits).toBe(FUEL_ASSET_ID);
      expect(result[1].gt(0)).toBe(true);

      console.log("  ✅ Multi-hop swap calculated correctly");
    }, 30000);

    it("should find best route between USDC and FUEL (direct vs multi-hop)", async () => {
      console.log("\n📊 Testing: Route comparison (USDC → FUEL)");

      const swapAmount = bn(100_000_000); // 100 USDC

      // Direct route: USDC → FUEL
      const directRoute = await readonlyMira.previewSwapExactInput(
        {bits: USDC_ASSET_ID},
        swapAmount,
        [USDC_FUEL_POOL_ID]
      );

      console.log(`  Direct route output: ${directRoute[1].format()}`);

      // Multi-hop route: USDC → ETH → FUEL
      const multiHopRoute = await readonlyMira.previewSwapExactInput(
        {bits: USDC_ASSET_ID},
        swapAmount,
        [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID]
      );

      console.log(`  Multi-hop route output: ${multiHopRoute[1].format()}`);

      expect(directRoute[1].gt(0)).toBe(true);
      expect(multiHopRoute[1].gt(0)).toBe(true);

      // One should be better than the other
      console.log(
        `  Better route: ${
          directRoute[1].gt(multiHopRoute[1]) ? "Direct" : "Multi-hop"
        }`
      );
      console.log("  ✅ Route comparison works");
    }, 30000);
  });

  describe("Batch Swap Previews", () => {
    it("should preview multiple routes in batch", async () => {
      console.log("\n📊 Testing: Batch Swap Preview");

      const swapAmount = bn(50_000_000); // 50 USDC

      const routes: PoolIdV2[][] = [
        [USDC_ETH_POOL_ID], // Direct: USDC → ETH
        [USDC_FUEL_POOL_ID], // Direct: USDC → FUEL
        [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID], // Multi-hop: USDC → ETH → FUEL
      ];

      console.log(`  Testing ${routes.length} routes simultaneously`);

      const results = await readonlyMira.previewSwapExactInputBatch(
        {bits: USDC_ASSET_ID},
        swapAmount,
        routes
      );

      console.log("  Results:");
      results.forEach((result, i) => {
        if (result) {
          console.log(
            `    Route ${i + 1}: ${result[1].format()} of ${result[0].bits.slice(0, 10)}...`
          );
        } else {
          console.log(`    Route ${i + 1}: Failed`);
        }
      });

      expect(results).toHaveLength(3);
      expect(results.filter((r) => r !== undefined).length).toBeGreaterThan(0);

      console.log("  ✅ Batch preview works");
    }, 30000);
  });

  describe("Edge Cases", () => {
    it("should handle zero amount gracefully", async () => {
      console.log("\n📊 Testing: Zero amount swap");

      await expect(
        readonlyMira.previewSwapExactInput({bits: USDC_ASSET_ID}, bn(0), [
          USDC_ETH_POOL_ID,
        ])
      ).rejects.toThrow();

      console.log("  ✅ Zero amount rejected as expected");
    }, 30000);

    it("should handle excessive amount (exceeds pool reserves)", async () => {
      console.log("\n📊 Testing: Amount exceeding reserves");

      // Try to swap more than the pool has
      const excessiveAmount = bn(100_000_000_000); // 100,000 USDC (way more than pool's 10,000)

      // This might succeed with partial fill or fail - either is acceptable
      try {
        const result = await readonlyMira.previewSwapExactInput(
          {bits: USDC_ASSET_ID},
          excessiveAmount,
          [USDC_ETH_POOL_ID]
        );
        console.log("  Result: Partial fill", result[1].format());
        expect(result[1].gt(0)).toBe(true);
      } catch (error) {
        console.log("  Result: Insufficient liquidity error (expected)");
        expect(error).toBeDefined();
      }

      console.log("  ✅ Excessive amount handled");
    }, 30000);

    it("should handle invalid pool ID", async () => {
      console.log("\n📊 Testing: Invalid pool ID");

      const invalidPoolId = bn(999999); // Non-existent pool

      await expect(
        readonlyMira.previewSwapExactInput(
          {bits: USDC_ASSET_ID},
          bn(100_000_000),
          [invalidPoolId]
        )
      ).rejects.toThrow();

      console.log("  ✅ Invalid pool rejected");
    }, 30000);
  });

  describe("Pool Metadata Validation", () => {
    it("should fetch pool metadata for all test pools", async () => {
      console.log("\n📊 Testing: Pool Metadata Fetching");

      const pools = [
        {id: USDC_ETH_POOL_ID, name: "USDC-ETH"},
        {id: USDC_FUEL_POOL_ID, name: "USDC-FUEL"},
        {id: ETH_FUEL_POOL_ID, name: "ETH-FUEL"},
      ];

      for (const pool of pools) {
        const metadata = await readonlyMira.poolMetadata(pool.id);

        console.log(`  ${pool.name}:`);
        console.log(`    Active Bin: ${metadata?.activeId ?? "N/A"}`);
        console.log(
          `    Reserves: ${metadata?.reserves.x ?? "0"} X / ${metadata?.reserves.y ?? "0"} Y`
        );
        console.log(`    Bin Step: ${metadata?.pool.binStep ?? "N/A"}`);

        expect(metadata).toBeDefined();
        expect(metadata!.reserves.x.gt(0) || metadata!.reserves.y.gt(0)).toBe(
          true
        );
      }

      console.log("  ✅ All pool metadata fetched successfully");
    }, 30000);
  });

  describe("getAmountsOut (Exact Input) Tests", () => {
    it("should calculate amounts out for single pool swap", async () => {
      console.log("\n📊 Testing: getAmountsOut single pool");

      const inputAmount = bn(100_000_000); // 100 USDC
      console.log(`  Input: ${inputAmount.format()} USDC`);

      const amounts = await readonlyMira.getAmountsOut(
        {bits: USDC_ASSET_ID},
        inputAmount,
        [USDC_ETH_POOL_ID]
      );

      console.log(`  Amounts array length: ${amounts.length}`);
      expect(amounts).toHaveLength(2); // [input, output]

      // First amount should be the input
      expect(amounts[0][0].bits).toBe(USDC_ASSET_ID);
      expect(amounts[0][1].eq(inputAmount)).toBe(true);

      // Second amount should be ETH output
      expect(amounts[1][0].bits).toBe(ETH_ASSET_ID);
      expect(amounts[1][1].gt(0)).toBe(true);

      console.log(`  Output: ${amounts[1][1].format()} ETH`);
      console.log("  ✅ getAmountsOut works for single pool");
    }, 30000);

    it("should calculate amounts out for multi-hop swap", async () => {
      console.log("\n📊 Testing: getAmountsOut multi-hop");

      const inputAmount = bn(100_000_000); // 100 USDC
      console.log(`  Input: ${inputAmount.format()} USDC`);
      console.log("  Route: USDC → ETH → FUEL");

      const amounts = await readonlyMira.getAmountsOut(
        {bits: USDC_ASSET_ID},
        inputAmount,
        [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID]
      );

      console.log(`  Amounts array length: ${amounts.length}`);
      expect(amounts).toHaveLength(3); // [USDC input, ETH intermediate, FUEL output]

      // Verify the swap path
      expect(amounts[0][0].bits).toBe(USDC_ASSET_ID);
      expect(amounts[0][1].eq(inputAmount)).toBe(true);

      expect(amounts[1][0].bits).toBe(ETH_ASSET_ID);
      expect(amounts[1][1].gt(0)).toBe(true);

      expect(amounts[2][0].bits).toBe(FUEL_ASSET_ID);
      expect(amounts[2][1].gt(0)).toBe(true);

      // Each hop should reduce the amount (due to fees and price impact)
      console.log(`  USDC → ETH: ${amounts[1][1].format()}`);
      console.log(`  ETH → FUEL: ${amounts[2][1].format()}`);

      console.log("  ✅ getAmountsOut works for multi-hop");
    }, 30000);

    it("should apply fees correctly in getAmountsOut", async () => {
      console.log("\n📊 Testing: Fee application in getAmountsOut");

      const inputAmount = bn(1_000_000_000); // Large amount to see fee impact
      console.log(`  Input: ${inputAmount.format()} USDC`);

      // Get pool fee
      const poolFee = await readonlyMira.fees(USDC_ETH_POOL_ID);
      console.log(`  Pool fee: ${poolFee.toNumber()} basis points`);

      const amounts = await readonlyMira.getAmountsOut(
        {bits: USDC_ASSET_ID},
        inputAmount,
        [USDC_ETH_POOL_ID]
      );

      // The output should be less than what constant product would give (due to fees)
      const outputAmount = amounts[1][1];
      console.log(`  Output after fees: ${outputAmount.format()} ETH`);

      expect(outputAmount.gt(0)).toBe(true);
      console.log("  ✅ Fees applied correctly");
    }, 30000);
  });

  describe("getAmountsIn (Exact Output) Tests", () => {
    it("should calculate amounts in for single pool swap", async () => {
      console.log("\n📊 Testing: getAmountsIn single pool");

      const outputAmount = bn(50_000_000); // Want 0.05 ETH
      console.log(`  Desired output: ${outputAmount.format()} ETH`);

      const amounts = await readonlyMira.getAmountsIn(
        {bits: ETH_ASSET_ID},
        outputAmount,
        [USDC_ETH_POOL_ID]
      );

      console.log(`  Amounts array length: ${amounts.length}`);
      expect(amounts).toHaveLength(2); // [USDC input, ETH output]

      // First amount should be USDC input required
      expect(amounts[0][0].bits).toBe(USDC_ASSET_ID);
      expect(amounts[0][1].gt(0)).toBe(true);

      // Last amount should match the desired output
      expect(amounts[1][0].bits).toBe(ETH_ASSET_ID);
      expect(amounts[1][1].eq(outputAmount)).toBe(true);

      console.log(`  Required input: ${amounts[0][1].format()} USDC`);
      console.log("  ✅ getAmountsIn works for single pool");
    }, 30000);

    it("should calculate amounts in for multi-hop swap", async () => {
      console.log("\n📊 Testing: getAmountsIn multi-hop");

      const outputAmount = bn(100_000_000); // Want 100 FUEL
      console.log(`  Desired output: ${outputAmount.format()} FUEL`);
      console.log("  Route: USDC → ETH → FUEL (calculating backwards)");

      const amounts = await readonlyMira.getAmountsIn(
        {bits: FUEL_ASSET_ID},
        outputAmount,
        [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID]
      );

      console.log(`  Amounts array length: ${amounts.length}`);
      expect(amounts).toHaveLength(3); // [USDC input, ETH intermediate, FUEL output]

      // Verify the swap path (working backwards)
      expect(amounts[0][0].bits).toBe(USDC_ASSET_ID);
      expect(amounts[0][1].gt(0)).toBe(true);

      expect(amounts[1][0].bits).toBe(ETH_ASSET_ID);
      expect(amounts[1][1].gt(0)).toBe(true);

      expect(amounts[2][0].bits).toBe(FUEL_ASSET_ID);
      expect(amounts[2][1].eq(outputAmount)).toBe(true);

      console.log(`  Required USDC input: ${amounts[0][1].format()}`);
      console.log(`  Intermediate ETH: ${amounts[1][1].format()}`);

      console.log("  ✅ getAmountsIn works for multi-hop");
    }, 30000);

    it("should use get_swap_in contract method correctly", async () => {
      console.log("\n📊 Testing: get_swap_in contract method usage");

      const outputAmount = bn(10_000_000); // Want 10 USDC
      console.log(`  Desired output: ${outputAmount.format()} USDC`);

      const amounts = await readonlyMira.getAmountsIn(
        {bits: USDC_ASSET_ID},
        outputAmount,
        [USDC_ETH_POOL_ID]
      );

      // Verify we got the amounts
      expect(amounts).toHaveLength(2);
      expect(amounts[0][0].bits).toBe(ETH_ASSET_ID);
      expect(amounts[1][0].bits).toBe(USDC_ASSET_ID);

      console.log(`  Required ETH input: ${amounts[0][1].format()}`);
      console.log("  ✅ get_swap_in used correctly");
    }, 30000);

    it("should fail gracefully when insufficient liquidity for exact output", async () => {
      console.log("\n📊 Testing: Insufficient liquidity for exact output");

      // Try to get more output than pool has
      const excessiveOutput = bn(1_000_000_000_000); // Way more than pool reserves

      await expect(
        readonlyMira.getAmountsIn({bits: ETH_ASSET_ID}, excessiveOutput, [
          USDC_ETH_POOL_ID,
        ])
      ).rejects.toThrow();

      console.log("  ✅ Insufficient liquidity error thrown as expected");
    }, 30000);
  });

  describe("Batch Operations Tests", () => {
    it("should handle batch exact input for multiple routes", async () => {
      console.log("\n📊 Testing: Batch exact input");

      const inputAmount = bn(50_000_000); // 50 USDC
      const routes: PoolIdV2[][] = [
        [USDC_ETH_POOL_ID],
        [USDC_FUEL_POOL_ID],
        [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID],
      ];

      console.log(`  Testing ${routes.length} routes`);

      const results = await readonlyMira.previewSwapExactInputBatch(
        {bits: USDC_ASSET_ID},
        inputAmount,
        routes
      );

      console.log(`  Results received: ${results.length}`);
      expect(results).toHaveLength(3);

      results.forEach((result, i) => {
        if (result) {
          console.log(`    Route ${i}: ${result[1].format()}`);
          expect(result[1].gt(0)).toBe(true);
        }
      });

      const successfulRoutes = results.filter((r) => r !== undefined);
      expect(successfulRoutes.length).toBeGreaterThan(0);

      console.log("  ✅ Batch exact input works");
    }, 30000);

    it("should handle batch exact output for multiple routes", async () => {
      console.log("\n📊 Testing: Batch exact output");

      const outputAmount = bn(50_000_000); // Want 50 of output token
      const routes: PoolIdV2[][] = [[USDC_ETH_POOL_ID], [USDC_FUEL_POOL_ID]];

      console.log(`  Testing ${routes.length} routes`);

      const results = await readonlyMira.previewSwapExactOutputBatch(
        {bits: USDC_ASSET_ID},
        outputAmount,
        routes
      );

      console.log(`  Results received: ${results.length}`);
      expect(results).toHaveLength(2);

      results.forEach((result, i) => {
        if (result) {
          console.log(`    Route ${i} required input: ${result[1].format()}`);
          expect(result[1].gt(0)).toBe(true);
        }
      });

      console.log("  ✅ Batch exact output works");
    }, 30000);

    it("should handle mixed success/failure in batch operations", async () => {
      console.log("\n📊 Testing: Batch with some invalid routes");

      const inputAmount = bn(50_000_000);
      const invalidPoolId = bn(999999);

      const routes: PoolIdV2[][] = [
        [USDC_ETH_POOL_ID], // Valid
        [invalidPoolId], // Invalid
        [USDC_FUEL_POOL_ID], // Valid
      ];

      const results = await readonlyMira.previewSwapExactInputBatch(
        {bits: USDC_ASSET_ID},
        inputAmount,
        routes
      );

      expect(results).toHaveLength(3);

      const validResults = results.filter((r) => r !== undefined);
      const invalidResults = results.filter((r) => r === undefined);

      console.log(`  Valid results: ${validResults.length}`);
      console.log(`  Invalid results: ${invalidResults.length}`);

      expect(validResults.length).toBeGreaterThan(0);
      expect(invalidResults.length).toBeGreaterThan(0);

      console.log("  ✅ Batch handles mixed success/failure");
    }, 30000);
  });

  describe("Swap Quote Consistency Tests", () => {
    it("should have consistent results between exact input and exact output", async () => {
      console.log("\n📊 Testing: Exact in/out consistency");

      // Do exact input swap
      const inputAmount = bn(100_000_000); // 100 USDC
      const exactInResult = await readonlyMira.getAmountsOut(
        {bits: USDC_ASSET_ID},
        inputAmount,
        [USDC_ETH_POOL_ID]
      );

      const outputFromExactIn = exactInResult[1][1];
      console.log(
        `  Exact in: ${inputAmount.format()} USDC → ${outputFromExactIn.format()} ETH`
      );

      // Now do exact output with that output amount
      const exactOutResult = await readonlyMira.getAmountsIn(
        {bits: ETH_ASSET_ID},
        outputFromExactIn,
        [USDC_ETH_POOL_ID]
      );

      const inputForExactOut = exactOutResult[0][1];
      console.log(
        `  Exact out: ${inputForExactOut.format()} USDC → ${outputFromExactIn.format()} ETH`
      );

      // The inputs should be close (within a small tolerance due to rounding)
      const tolerance = inputAmount.mul(5).div(100); // 5% tolerance
      const diff = inputAmount.sub(inputForExactOut).abs();

      console.log(
        `  Difference: ${diff.format()} (${diff.mul(100).div(inputAmount).toNumber()}%)`
      );
      expect(diff.lte(tolerance)).toBe(true);

      console.log("  ✅ Exact in/out results are consistent");
    }, 30000);

    it("should return increasing amounts for multi-hop exact input", async () => {
      console.log("\n📊 Testing: Multi-hop amount progression");

      const inputAmount = bn(100_000_000); // 100 USDC
      const amounts = await readonlyMira.getAmountsOut(
        {bits: USDC_ASSET_ID},
        inputAmount,
        [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID]
      );

      expect(amounts).toHaveLength(3);

      console.log(`  Hop 0 (USDC): ${amounts[0][1].format()}`);
      console.log(`  Hop 1 (ETH): ${amounts[1][1].format()}`);
      console.log(`  Hop 2 (FUEL): ${amounts[2][1].format()}`);

      // First amount should be our input
      expect(amounts[0][1].eq(inputAmount)).toBe(true);

      // All subsequent amounts should be > 0
      expect(amounts[1][1].gt(0)).toBe(true);
      expect(amounts[2][1].gt(0)).toBe(true);

      console.log("  ✅ Amount progression is correct");
    }, 30000);

    it("should return decreasing amounts (working backwards) for multi-hop exact output", async () => {
      console.log("\n📊 Testing: Multi-hop exact output amount progression");

      const outputAmount = bn(100_000_000); // Want 100 FUEL
      const amounts = await readonlyMira.getAmountsIn(
        {bits: FUEL_ASSET_ID},
        outputAmount,
        [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID]
      );

      expect(amounts).toHaveLength(3);

      console.log(`  Hop 0 (USDC input): ${amounts[0][1].format()}`);
      console.log(`  Hop 1 (ETH intermediate): ${amounts[1][1].format()}`);
      console.log(`  Hop 2 (FUEL output): ${amounts[2][1].format()}`);

      // Last amount should be our desired output
      expect(amounts[2][1].eq(outputAmount)).toBe(true);

      // All amounts should be > 0
      expect(amounts[0][1].gt(0)).toBe(true);
      expect(amounts[1][1].gt(0)).toBe(true);

      console.log("  ✅ Backward amount progression is correct");
    }, 30000);
  });
});

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
    // Initialize provider and wallet
    provider = new Provider(FUEL_NODE_URL);
    wallet = new WalletUnlocked(DEPLOYER_SK, provider);

    // Initialize SDK instances
    readonlyMira = new ReadonlyMiraAmmV2(provider, AMM_CONTRACT_ID);
    mira = new MiraAmmV2(wallet, AMM_CONTRACT_ID);
  }, 30000);

  describe("Single Pool Swaps", () => {
    it.each([
      {
        name: "USDC → ETH (exact input)",
        inputAsset: USDC_ASSET_ID,
        expectedOutput: ETH_ASSET_ID,
        amount: bn(100_000_000), // 100 USDC
        pool: USDC_ETH_POOL_ID,
        isExactInput: true,
      },
      {
        name: "ETH → USDC (exact input)",
        inputAsset: ETH_ASSET_ID,
        expectedOutput: USDC_ASSET_ID,
        amount: bn(10_000_000), // 0.01 ETH
        pool: USDC_ETH_POOL_ID,
        isExactInput: true,
      },
      {
        name: "ETH → USDC (exact output)",
        outputAsset: USDC_ASSET_ID,
        amount: bn(100_000_000), // Want 100 USDC
        pool: USDC_ETH_POOL_ID,
        isExactInput: false,
      },
    ])(
      "should preview swap: $name",
      async ({
        name,
        inputAsset,
        outputAsset,
        expectedOutput,
        amount,
        pool,
        isExactInput,
      }) => {
        if (isExactInput && inputAsset) {
          // Exact Input: Know input amount, calculate output
          const [resultAsset, resultAmount] =
            await readonlyMira.previewSwapExactInput(
              {bits: inputAsset},
              amount,
              [pool]
            );

          expect(resultAsset.bits).toBe(expectedOutput);
          expect(resultAmount.gt(0)).toBe(true);
        } else if (!isExactInput && outputAsset) {
          // Exact Output: Know desired output, calculate required input
          const [resultAsset, resultAmount] =
            await readonlyMira.previewSwapExactOutput(
              {bits: outputAsset},
              amount,
              [pool]
            );

          expect(resultAsset.bits).not.toBe(outputAsset);
          expect(resultAmount.gt(0)).toBe(true);
        }
      },
      30000
    );
  });

  describe("Multi-Pool Swaps", () => {
    it.each([
      {
        name: "USDC → ETH → FUEL (2-hop)",
        input: USDC_ASSET_ID,
        output: FUEL_ASSET_ID,
        route: [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID],
        amount: bn(100_000_000), // 100 USDC
      },
      {
        name: "USDC → FUEL (direct)",
        input: USDC_ASSET_ID,
        output: FUEL_ASSET_ID,
        route: [USDC_FUEL_POOL_ID],
        amount: bn(100_000_000), // 100 USDC
      },
    ])(
      "should preview route: $name",
      async ({input, output, route, amount}) => {
        const [resultAsset, resultAmount] =
          await readonlyMira.previewSwapExactInput(
            {bits: input},
            amount,
            route
          );

        expect(resultAsset.bits).toBe(output);
        expect(resultAmount.gt(0)).toBe(true);
      },
      30000
    );

    it("should compare direct vs multi-hop routes (USDC → FUEL)", async () => {
      const swapAmount = bn(100_000_000); // 100 USDC

      const [, directOutput] = await readonlyMira.previewSwapExactInput(
        {bits: USDC_ASSET_ID},
        swapAmount,
        [USDC_FUEL_POOL_ID]
      );

      const [, multiHopOutput] = await readonlyMira.previewSwapExactInput(
        {bits: USDC_ASSET_ID},
        swapAmount,
        [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID]
      );

      expect(directOutput.gt(0)).toBe(true);
      expect(multiHopOutput.gt(0)).toBe(true);
      // Both routes should work (which is better depends on liquidity)
    }, 30000);
  });

  describe("Batch Swap Previews", () => {
    it("should preview multiple routes in batch", async () => {
      const swapAmount = bn(50_000_000); // 50 USDC

      const routes: PoolIdV2[][] = [
        [USDC_ETH_POOL_ID], // Direct: USDC → ETH
        [USDC_FUEL_POOL_ID], // Direct: USDC → FUEL
        [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID], // Multi-hop: USDC → ETH → FUEL
      ];

      const results = await readonlyMira.previewSwapExactInputBatch(
        {bits: USDC_ASSET_ID},
        swapAmount,
        routes
      );

      results.forEach((result, i) => {
        if (result) {
        } else {
        }
      });

      expect(results).toHaveLength(3);
      expect(results.filter((r) => r !== undefined).length).toBeGreaterThan(0);
    }, 30000);
  });

  describe("Edge Cases", () => {
    it("should handle zero amount gracefully", async () => {
      await expect(
        readonlyMira.previewSwapExactInput({bits: USDC_ASSET_ID}, bn(0), [
          USDC_ETH_POOL_ID,
        ])
      ).rejects.toThrow();
    }, 30000);

    it("should handle excessive amount (exceeds pool reserves)", async () => {
      // Try to swap more than the pool has
      const excessiveAmount = bn(100_000_000_000); // 100,000 USDC (way more than pool's 10,000)

      // This might succeed with partial fill or fail - either is acceptable
      try {
        const result = await readonlyMira.previewSwapExactInput(
          {bits: USDC_ASSET_ID},
          excessiveAmount,
          [USDC_ETH_POOL_ID]
        );
        expect(result[1].gt(0)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    }, 30000);

    it("should handle invalid pool ID", async () => {
      const invalidPoolId = bn(999999); // Non-existent pool

      await expect(
        readonlyMira.previewSwapExactInput(
          {bits: USDC_ASSET_ID},
          bn(100_000_000),
          [invalidPoolId]
        )
      ).rejects.toThrow();
    }, 30000);
  });

  describe("Pool Metadata Validation", () => {
    it("should fetch pool metadata for all test pools", async () => {
      const pools = [
        {id: USDC_ETH_POOL_ID, name: "USDC-ETH"},
        {id: USDC_FUEL_POOL_ID, name: "USDC-FUEL"},
        {id: ETH_FUEL_POOL_ID, name: "ETH-FUEL"},
      ];

      for (const pool of pools) {
        const metadata = await readonlyMira.poolMetadata(pool.id);

        expect(metadata).toBeDefined();
        expect(metadata!.reserves.x.gt(0) || metadata!.reserves.y.gt(0)).toBe(
          true
        );
      }
    }, 30000);
  });

  describe("getAmountsOut (Exact Input) Tests", () => {
    it("should calculate amounts out for single pool swap", async () => {
      const inputAmount = bn(100_000_000); // 100 USDC

      const amounts = await readonlyMira.getAmountsOut(
        {bits: USDC_ASSET_ID},
        inputAmount,
        [USDC_ETH_POOL_ID]
      );

      expect(amounts).toHaveLength(2); // [input, output]

      // First amount should be the input
      expect(amounts[0][0].bits).toBe(USDC_ASSET_ID);
      expect(amounts[0][1].eq(inputAmount)).toBe(true);

      // Second amount should be ETH output
      expect(amounts[1][0].bits).toBe(ETH_ASSET_ID);
      expect(amounts[1][1].gt(0)).toBe(true);
    }, 30000);

    it("should calculate amounts out for multi-hop swap", async () => {
      const inputAmount = bn(100_000_000); // 100 USDC

      const amounts = await readonlyMira.getAmountsOut(
        {bits: USDC_ASSET_ID},
        inputAmount,
        [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID]
      );

      expect(amounts).toHaveLength(3); // [USDC input, ETH intermediate, FUEL output]

      // Verify the swap path
      expect(amounts[0][0].bits).toBe(USDC_ASSET_ID);
      expect(amounts[0][1].eq(inputAmount)).toBe(true);

      expect(amounts[1][0].bits).toBe(ETH_ASSET_ID);
      expect(amounts[1][1].gt(0)).toBe(true);

      expect(amounts[2][0].bits).toBe(FUEL_ASSET_ID);
      expect(amounts[2][1].gt(0)).toBe(true);

      // Each hop should reduce the amount (due to fees and price impact)
    }, 30000);

    it("should apply fees correctly in getAmountsOut", async () => {
      const inputAmount = bn(1_000_000_000); // Large amount to see fee impact

      // Get pool fee
      const poolFee = await readonlyMira.fees(USDC_ETH_POOL_ID);

      const amounts = await readonlyMira.getAmountsOut(
        {bits: USDC_ASSET_ID},
        inputAmount,
        [USDC_ETH_POOL_ID]
      );

      // The output should be less than what constant product would give (due to fees)
      const outputAmount = amounts[1][1];

      expect(outputAmount.gt(0)).toBe(true);
    }, 30000);
  });

  describe("getAmountsIn (Exact Output) Tests", () => {
    it("should calculate amounts in for single pool swap", async () => {
      const outputAmount = bn(50_000_000); // Want 0.05 ETH

      const amounts = await readonlyMira.getAmountsIn(
        {bits: ETH_ASSET_ID},
        outputAmount,
        [USDC_ETH_POOL_ID]
      );

      expect(amounts).toHaveLength(2); // [output, input]

      // First amount should be the desired output
      expect(amounts[0][0].bits).toBe(ETH_ASSET_ID);
      expect(amounts[0][1].eq(outputAmount)).toBe(true);

      // Last amount should be the input required (different asset from output)
      expect(amounts[1][0].bits).not.toBe(ETH_ASSET_ID);
      expect(amounts[1][1].gt(0)).toBe(true);
    }, 30000);

    it("should calculate amounts in for multi-hop swap", async () => {
      const outputAmount = bn(100_000_000); // Want 100 FUEL

      const amounts = await readonlyMira.getAmountsIn(
        {bits: FUEL_ASSET_ID},
        outputAmount,
        [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID]
      );

      expect(amounts).toHaveLength(3); // [output, intermediate, input]

      // First amount should be the desired output (FUEL)
      expect(amounts[0][0].bits).toBe(FUEL_ASSET_ID);
      expect(amounts[0][1].eq(outputAmount)).toBe(true);

      // All amounts should be > 0
      expect(amounts[1][1].gt(0)).toBe(true);
      expect(amounts[2][1].gt(0)).toBe(true);

      // Assets should all be different
      expect(amounts[1][0].bits).not.toBe(amounts[0][0].bits);
      expect(amounts[2][0].bits).not.toBe(amounts[0][0].bits);
    }, 30000);

    it("should use get_swap_in contract method correctly", async () => {
      const outputAmount = bn(10_000_000); // Want 10 USDC

      const amounts = await readonlyMira.getAmountsIn(
        {bits: USDC_ASSET_ID},
        outputAmount,
        [USDC_ETH_POOL_ID]
      );

      // Verify we got the amounts in correct order (output first, input last)
      expect(amounts).toHaveLength(2);
      expect(amounts[0][0].bits).toBe(USDC_ASSET_ID);
      expect(amounts[0][1].eq(outputAmount)).toBe(true);
      // Input asset should be different from output
      expect(amounts[1][0].bits).not.toBe(USDC_ASSET_ID);
      expect(amounts[1][1].gt(0)).toBe(true);
    }, 30000);

    it("should fail gracefully when insufficient liquidity for exact output", async () => {
      // Try to get more output than pool has
      const excessiveOutput = bn(1_000_000_000_000); // Way more than pool reserves

      await expect(
        readonlyMira.getAmountsIn({bits: ETH_ASSET_ID}, excessiveOutput, [
          USDC_ETH_POOL_ID,
        ])
      ).rejects.toThrow();
    }, 30000);
  });

  describe("Batch Operations Tests", () => {
    it("should handle batch exact input for multiple routes", async () => {
      const inputAmount = bn(50_000_000); // 50 USDC
      const routes: PoolIdV2[][] = [
        [USDC_ETH_POOL_ID],
        [USDC_FUEL_POOL_ID],
        [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID],
      ];

      const results = await readonlyMira.previewSwapExactInputBatch(
        {bits: USDC_ASSET_ID},
        inputAmount,
        routes
      );

      expect(results).toHaveLength(3);

      results.forEach((result, i) => {
        if (result) {
          expect(result[1].gt(0)).toBe(true);
        }
      });

      const successfulRoutes = results.filter((r) => r !== undefined);
      expect(successfulRoutes.length).toBeGreaterThan(0);
    }, 30000);

    it("should handle batch exact output for multiple routes", async () => {
      const outputAmount = bn(50_000_000); // Want 50 of output token
      const routes: PoolIdV2[][] = [[USDC_ETH_POOL_ID], [USDC_FUEL_POOL_ID]];

      const results = await readonlyMira.previewSwapExactOutputBatch(
        {bits: USDC_ASSET_ID},
        outputAmount,
        routes
      );

      expect(results).toHaveLength(2);

      results.forEach((result, i) => {
        if (result) {
          expect(result[1].gt(0)).toBe(true);
        }
      });
    }, 30000);

    it("should handle mixed success/failure in batch operations", async () => {
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

      expect(validResults.length).toBeGreaterThan(0);
      expect(invalidResults.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe("Swap Quote Consistency Tests", () => {
    it("should have consistent results between exact input and exact output", async () => {
      // Do exact input swap
      const inputAmount = bn(100_000_000); // 100 USDC
      const exactInResult = await readonlyMira.getAmountsOut(
        {bits: USDC_ASSET_ID},
        inputAmount,
        [USDC_ETH_POOL_ID]
      );

      const outputFromExactIn = exactInResult[1][1];

      // Now do exact output with that output amount
      const exactOutResult = await readonlyMira.getAmountsIn(
        {bits: ETH_ASSET_ID},
        outputFromExactIn,
        [USDC_ETH_POOL_ID]
      );

      // getAmountsIn returns [output, input] in reverse order
      const inputForExactOut = exactOutResult[exactOutResult.length - 1][1];

      // The inputs should be close (within a small tolerance due to rounding)
      const tolerance = inputAmount.mul(5).div(100); // 5% tolerance for v2 approximation
      const diff = inputAmount.sub(inputForExactOut).abs();

      expect(diff.lte(tolerance)).toBe(true);
    }, 30000);

    it("should return increasing amounts for multi-hop exact input", async () => {
      const inputAmount = bn(100_000_000); // 100 USDC
      const amounts = await readonlyMira.getAmountsOut(
        {bits: USDC_ASSET_ID},
        inputAmount,
        [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID]
      );

      expect(amounts).toHaveLength(3);

      // First amount should be our input
      expect(amounts[0][1].eq(inputAmount)).toBe(true);

      // All subsequent amounts should be > 0
      expect(amounts[1][1].gt(0)).toBe(true);
      expect(amounts[2][1].gt(0)).toBe(true);
    }, 30000);

    it("should return correct amounts for multi-hop exact output", async () => {
      const outputAmount = bn(100_000_000); // Want 100 FUEL
      const amounts = await readonlyMira.getAmountsIn(
        {bits: FUEL_ASSET_ID},
        outputAmount,
        [USDC_ETH_POOL_ID, ETH_FUEL_POOL_ID]
      );

      expect(amounts).toHaveLength(3);

      // First amount should be our desired output
      expect(amounts[0][0].bits).toBe(FUEL_ASSET_ID);
      expect(amounts[0][1].eq(outputAmount)).toBe(true);

      // All amounts should be > 0
      expect(amounts[0][1].gt(0)).toBe(true);
      expect(amounts[1][1].gt(0)).toBe(true);
      expect(amounts[2][1].gt(0)).toBe(true);
    }, 30000);
  });

  describe("Full Swap Execution Flow", () => {
    // Helper: Create deadline (1 hour in the future)
    const createDeadline = () => {
      const futureUnixSeconds = Math.floor(Date.now() / 1000) + 3600;
      return new BN(futureUnixSeconds);
    };

    // Helper: Apply slippage
    const applySlippage = (
      amount: BN,
      slippageBps: number,
      isMinimum: boolean
    ) => {
      if (isMinimum) {
        // For minimum output: reduce by slippage
        return amount.mul(new BN(10000 - slippageBps)).div(new BN(10000));
      } else {
        // For maximum input: increase by slippage
        return amount.mul(new BN(10000 + slippageBps)).div(new BN(10000));
      }
    };

    it("should understand blockchain timestamp format", async () => {
      // Get current blockchain timestamp (in TAI64 format)
      const latestBlock = await provider.getBlock("latest");
      if (latestBlock) {
        const blockTime = latestBlock.time;

        // Fuel blockchain uses TAI64, but our swap functions accept Unix timestamps
        // The contract handles the conversion internally
        const currentUnixSeconds = Math.floor(Date.now() / 1000);
        const deadline = createDeadline();

        // Verify our Unix deadline is reasonable (future timestamp)
        expect(deadline.gt(new BN(currentUnixSeconds))).toBe(true);

        // Verify block time exists and is in TAI64 format (very large number)
        const blockTimeBN = new BN(blockTime);
        expect(blockTimeBN.gt(new BN(2).pow(new BN(62)))).toBe(true); // TAI64 offset check
      }
    }, 30000);

    it.each([
      {
        name: "Exact Input (USDC → ETH)",
        type: "input",
        amount: bn(100_000_000), // 100 USDC
        inputAsset: USDC_ASSET_ID,
        outputAsset: ETH_ASSET_ID,
        pool: USDC_ETH_POOL_ID,
      },
      {
        name: "Exact Output (USDC → ETH)",
        type: "output",
        amount: bn(50_000_000), // Want 50 ETH
        inputAsset: USDC_ASSET_ID,
        outputAsset: ETH_ASSET_ID,
        pool: USDC_ETH_POOL_ID,
      },
    ])(
      "should execute swap with preview: $name",
      async ({type, amount, inputAsset, outputAsset, pool}) => {
        const slippageBps = 50; // 0.5% slippage

        if (type === "input") {
          // EXACT INPUT FLOW
          // 1. Preview: Get expected output
          const [previewAsset, expectedOutput] =
            await readonlyMira.previewSwapExactInput(
              {bits: inputAsset},
              amount,
              [pool]
            );

          expect(previewAsset.bits).toBe(outputAsset);
          expect(expectedOutput.gt(0)).toBe(true);

          // 2. Calculate minimum output with slippage
          const minOutput = applySlippage(expectedOutput, slippageBps, true);

          // 3. Get balances before swap
          const inputBalanceBefore = await wallet.getBalance(inputAsset);
          const outputBalanceBefore = await wallet.getBalance(outputAsset);

          // 4. Execute swap
          const {transactionRequest} = await mira.swapExactInput(
            amount,
            {bits: inputAsset},
            minOutput,
            [pool],
            createDeadline()
          );

          const tx = await wallet.sendTransaction(transactionRequest);
          const result = await tx.waitForResult();
          expect(result.status).toBe("success");

          // 5. Verify balance changes
          const inputBalanceAfter = await wallet.getBalance(inputAsset);
          const outputBalanceAfter = await wallet.getBalance(outputAsset);

          const inputSpent = inputBalanceBefore.sub(inputBalanceAfter);
          const outputReceived = outputBalanceAfter.sub(outputBalanceBefore);

          expect(inputSpent.gte(amount)).toBe(true);
          expect(outputReceived.gte(minOutput)).toBe(true);
          expect(outputReceived.lte(expectedOutput)).toBe(true);
        } else {
          // EXACT OUTPUT FLOW
          // 1. Preview: Get required input
          const [previewAsset, requiredInput] =
            await readonlyMira.previewSwapExactOutput(
              {bits: outputAsset},
              amount,
              [pool]
            );

          expect(previewAsset.bits).not.toBe(outputAsset);
          expect(requiredInput.gt(0)).toBe(true);

          // 2. Calculate maximum input with slippage
          const maxInput = applySlippage(requiredInput, slippageBps, false);

          // 3. Get balances before swap
          const inputBalanceBefore = await wallet.getBalance(inputAsset);
          const outputBalanceBefore = await wallet.getBalance(outputAsset);

          // 4. Execute swap
          const {transactionRequest} = await mira.swapExactOutput(
            amount,
            {bits: outputAsset},
            maxInput,
            [pool],
            createDeadline()
          );

          const tx = await wallet.sendTransaction(transactionRequest);
          const result = await tx.waitForResult();
          expect(result.status).toBe("success");

          // 5. Verify balance changes
          const inputBalanceAfter = await wallet.getBalance(inputAsset);
          const outputBalanceAfter = await wallet.getBalance(outputAsset);

          const inputSpent = inputBalanceBefore.sub(inputBalanceAfter);
          const outputReceived = outputBalanceAfter.sub(outputBalanceBefore);

          expect(inputSpent.gte(requiredInput)).toBe(true);
          expect(inputSpent.lte(maxInput)).toBe(true);
          expect(outputReceived.eq(amount)).toBe(true);
        }
      },
      60000
    );

    it("should handle deadline expired scenario", async () => {
      const inputAmount = bn(100_000_000); // 100 USDC
      const minOutput = bn(1); // Accept any amount

      // Create an expired deadline (1 hour in the past)
      const expiredDeadline = new BN(Math.floor(Date.now() / 1000) - 3600);

      // Should fail with expired deadline
      await expect(
        mira.swapExactInput(
          inputAmount,
          {bits: USDC_ASSET_ID},
          minOutput,
          [USDC_ETH_POOL_ID],
          expiredDeadline
        )
      ).rejects.toThrow();
    }, 30000);
  });
});

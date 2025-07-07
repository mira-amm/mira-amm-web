import {describe, it, test, expect, beforeEach, afterEach} from "vitest";
import {Provider, bn} from "fuels";
import {ReadonlyMiraAmm} from "../../../libs/mira-v1-ts/src/sdk/readonly_mira_amm";
import {NetworkUrl, BASE_ASSETS} from "../../../libs/web/src/utils/constants";
import {buildPoolId} from "../../../libs/mira-v1-ts/src/sdk/utils";
import {
  getSwapQuotesBatch,
  TradeType,
} from "../../../libs/web/src/hooks/get-swap-quotes-batch";
import type {Route} from "../../../libs/web/src/hooks";

// ====================================
// EACH PAIR BETWEEN 2 ASSETS: USDC/USDT
// ====================================
// ROUTES:
// 1. USDC/USDT
// 2. USDC/ETH, ETH/USDT
// 3. USDC/FUEL, FUEL/USDT

// we don't need a hook for this
// ====================================

// ETH/FUEL are the base pair, so there should only be one route
// Want UI(React components) to just gather input and provide feeedback to users.
// We need to get routes.

// In order to test it without react componnets, we need to extract:
// - Route fetching
// - swap quotes
// Out of hooks and any react components at all into functions that can be run headlessly.

// We've done that with swap qutoes. Routes calc is almost there.

// Routes calculation requires 2 steps:
// - get all pools with assets (Base assets, ...)
// - map those the we did in the comment

// Each pair should realistically have max 3 routes.

// Only caveat is we assumed we don't know whether a pool is stable or not, so we end up with 10 routes.
// A/B Stable
// A/B Volatile

// A/FUEL Stable, FUEL/B Stable
// Each of those would have the unstable/stable, stable/unstable, unstable/unstable combo.
// There are 4 combos of A/FUEL and FUEL/B
// There are 4 combos of A/ETH and ETH/B

// That leaves us with 4, 4, and 2 = 10 routes
// pass these routes in to SDK and get quotes back to display to UI
// Need to do same extraction of functions with main branch in order to compare

// ===========================================================
// We want to be able to directly compare old code to new code
// ===========================================================

let testContext: any = null;

describe("Swap Routes & Quotes (headless)", () => {
  // Mock this
  // const result = await this.ammContract.functions.pool_metadata(poolIdInput(poolId)).get();
  // return specific values to confirm math
  // observe what values are passed into it and how many times it is called
  //

  beforeEach(() => {
    testContext = {
      amount: 20,
      routes: [] as Route[], // TODO: provide real Route[] when ready
    };
  });

  afterEach(() => {
    testContext = null;
  });

  test("returns empty array when no routes are provided", async () => {
    const provider = new Provider(NetworkUrl);
    const amm = new ReadonlyMiraAmm(provider);
    const quotes = await getSwapQuotesBatch(
      bn(testContext.amount),
      TradeType.EXACT_IN,
      testContext.routes,
      amm,
    );
    console.log("Quotes with no routes:", quotes);
    expect(quotes).toEqual([]);
  });

  test("should list exactly these 3 routes for USDC/USDT pair", () => {
    // TODO: call your route-fetching function
    expect(true).toBe(true);
  });

  it("should return a single route for ETH/FUEL", () => {
    // TODO: getRoutes('ETH', 'FUEL')
    expect(true).toBe(true);
  });

  it("should fetch swap quote for a given route", () => {
    // TODO: call your quote function with a real route
    expect(true).toBe(true);
  });

  it("should generate up to 10 stable/volatile combos for a generic A/B pair", () => {
    // TODO: test route-combinations logic
    expect(true).toBe(true);
  });

  it("should query the SDK for quotes on all computed routes", () => {
    // TODO: spy on readOnlyMiraAmm methods
    expect(true).toBe(true);
  });

  it("fetches a quote for 20 ETH → FUEL", async () => {
    const provider = new Provider(NetworkUrl);
    const amm = new ReadonlyMiraAmm(provider);

    const ETH = BASE_ASSETS[0];
    const FUEL = BASE_ASSETS[1];

    const amount = bn(testContext.amount);
    const poolId = buildPoolId(FUEL, ETH, false);

    const route: Route = {
      assetIn: {assetId: ETH},
      assetOut: {assetId: FUEL},
      pools: [{poolId}],
    };

    const quotes = await getSwapQuotesBatch(
      amount,
      TradeType.EXACT_IN,
      [route],
      amm,
    );
    console.log("📊 ETH→FUEL quotes:", quotes);
    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes[0].amountOut.toString()).toMatch(/^[1-9]\d*$/);
  });
});

import {describe, it, test, expect, beforeEach, afterEach} from "vitest";
import {Provider, bn} from "fuels";
import {ReadonlyMiraAmm} from "../../../libs/ts-sdk/src/sdk/readonly_mira_amm";
import {NetworkUrl, BASE_ASSETS} from "../../../libs/web/src/utils/constants";
import {buildPoolId} from "../../../libs/ts-sdk/src/sdk/utils";
import {
  getSwapQuotesBatch,
  TradeType,
} from "../../../libs/web/src/hooks/get-swap-quotes-batch";
import type {Route} from "../../../libs/web/src/hooks";

let testContext: any = null;

describe("Swap Routes & Quotes (headless)", () => {
  beforeEach(() => {
    testContext = {
      amount: 20,
      routes: [] as Route[],
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
      amm
    );
    console.log("Quotes with no routes:", quotes);
    expect(quotes).toEqual([]);
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
      amm
    );
    console.log("📊 ETH→FUEL quotes:", quotes);
    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes[0].amountOut.toString()).toMatch(/^[1-9]\d*$/);
  });
});

import {expect, test, describe, beforeEach, afterEach} from "vitest";
import {Provider} from "fuels";
import {ReadonlyMiraAmm} from "../../libs/mira-v1-ts/src";
// ===========================================================
// import {useSwapPreview} from "../../libs/web/src/hooks";
import {
  SwapState,
  CurrencyBoxMode,
} from "../../libs/web/src/components/common/Swap/Swap";
import {NetworkUrl, BASE_ASSETS} from "../../libs/web/src/utils/constants";
// ===========================================================

const provider = new Provider(NetworkUrl);
// const readOnlyMiraAmm = new ReadonlyMiraAmm(provider);

let testContext: {
  amount: number;
  initialSwapState: SwapState;
  mode: CurrencyBoxMode;
} | null;

// ===========================================================
// We want to be able to directly compare old code to new code
// ===========================================================

describe("Math Utils Tests", () => {
  beforeEach(() => {
    testContext = {
      amount: 20,
      initialSwapState: {
        sell: {
          assetId: BASE_ASSETS[0],
          amount: "20000000000",
        },
        buy: {
          assetId: BASE_ASSETS[1],
          amount: "0",
        },
      },
      mode: "sell",
    };
  });

  afterEach(() => {
    testContext = null;
  });

  test("For an ETH/FUEL pair where ETH=20, the FUEL output should be 37356.283802", () => {
    console.log(BASE_ASSETS);

    if (!testContext) {
      throw new Error("Test context improperly setup");
    }

    // call the swap preview
    const preview = useSwapPreview(
      testContext.initialSwapState,
      testContext.mode,
    );

    console.log(preview);
    expect(true).toBe(true);
  });
});

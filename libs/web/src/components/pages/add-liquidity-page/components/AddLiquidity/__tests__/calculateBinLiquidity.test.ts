import {calculateBinLiquidity} from "../liquidityDistributionUtils";
import type {LiquidityShape} from "../V2LiquidityConfig";

describe("calculateBinLiquidity", () => {
  const currentPrice = 2000;
  const totalLiquidity = 10000;
  const numBins = 5;

  function run(
    shape: LiquidityShape,
    binId: number,
    activeBinId: number,
    binPrice: number
  ) {
    return calculateBinLiquidity(
      binId,
      activeBinId,
      binPrice,
      currentPrice,
      shape,
      totalLiquidity,
      numBins
    );
  }

  it("allocates more to active bin for spot", () => {
    const active = run("spot", 10, 10, currentPrice);
    const left = run("spot", 9, 10, currentPrice * 0.99);
    const right = run("spot", 11, 10, currentPrice * 1.01);
    expect(active.liquidityX + active.liquidityY).toBeGreaterThan(
      Math.max(
        left.liquidityX + left.liquidityY,
        right.liquidityX + right.liquidityY
      )
    );
  });

  it("places X below and Y above for spot", () => {
    const below = run("spot", 9, 10, currentPrice * 0.99);
    const above = run("spot", 11, 10, currentPrice * 1.01);
    expect(below.liquidityX).toBeGreaterThan(0);
    expect(below.liquidityY).toBe(0);
    expect(above.liquidityY).toBeGreaterThan(0);
    expect(above.liquidityX).toBe(0);
  });

  it("has bell-shaped allocation for curve around active", () => {
    const left = run("curve", 9, 10, currentPrice * 0.99);
    const right = run("curve", 11, 10, currentPrice * 1.01);
    const farLeft = run("curve", 8, 10, currentPrice * 0.98);
    const farRight = run("curve", 12, 10, currentPrice * 1.02);
    expect(left.liquidityX + left.liquidityY).toBeGreaterThanOrEqual(
      farLeft.liquidityX + farLeft.liquidityY
    );
    expect(right.liquidityX + right.liquidityY).toBeGreaterThanOrEqual(
      farRight.liquidityX + farRight.liquidityY
    );
  });

  it("distributes primarily on both sides for bidask", () => {
    const active = run("bidask", 10, 10, currentPrice);
    const left = run("bidask", 9, 10, currentPrice * 0.99);
    const right = run("bidask", 11, 10, currentPrice * 1.01);
    const activeTotal = active.liquidityX + active.liquidityY;
    const bothSides =
      left.liquidityX + left.liquidityY + right.liquidityX + right.liquidityY;
    // Combined side liquidity should exceed the active bin
    expect(bothSides).toBeGreaterThan(activeTotal);
    // Ensure both sides have non-zero liquidity in expected token
    expect(left.liquidityX).toBeGreaterThan(0);
    expect(right.liquidityY).toBeGreaterThan(0);
  });

  it("handles edge cases: single bin uniform fallback", () => {
    const {liquidityX, liquidityY} = calculateBinLiquidity(
      10,
      10,
      currentPrice,
      currentPrice,
      "unknown" as LiquidityShape,
      totalLiquidity,
      1
    );
    expect(liquidityX).toBeGreaterThanOrEqual(0);
    expect(liquidityY).toBeGreaterThanOrEqual(0);
  });
});

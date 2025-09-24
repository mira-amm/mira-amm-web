import {describe, it, expect} from "vitest";
import {
  priceToSliderPosition,
  sliderPositionToPrice,
  alignPriceToBin,
  calculateBinsBetweenPrices,
} from "../priceSliderUtils";

describe("priceSliderUtils: clamping behavior at slider extremes", () => {
  it("clamps extreme prices to bounds and converts back to bound price", () => {
    const current = 150;
    const binStep = 25; // 0.25%
    const maxBins = 150;

    // Far above working range → position should clamp to 1.0 (right bound)
    const farHighPrice = current * 10_000;
    const posHigh = priceToSliderPosition(
      farHighPrice,
      current,
      binStep,
      maxBins
    );
    expect(posHigh).toBe(1);

    // Roundtrip from the bound is still a valid finite price
    const backHigh = sliderPositionToPrice(posHigh, current, binStep, maxBins);
    expect(backHigh).toBeGreaterThan(0);

    // Far below working range → position should clamp to 0.0 (left bound)
    const farLowPrice = current / 10_000;
    const posLow = priceToSliderPosition(
      farLowPrice,
      current,
      binStep,
      maxBins
    );
    expect(posLow).toBe(0);

    // Roundtrip from the bound is still a valid finite price
    const backLow = sliderPositionToPrice(posLow, current, binStep, maxBins);
    expect(backLow).toBeGreaterThan(0);
  });
});

describe("priceSliderUtils: extended tests", () => {
  it("converts price → slider → price accurately near center", () => {
    const current = 150;
    const stepBps = 25; // 0.25%
    const maxBins = 150;

    const price = 170; // within range
    const pos = priceToSliderPosition(price, current, stepBps, maxBins);
    const back = sliderPositionToPrice(pos, current, stepBps, maxBins);
    expect(Math.abs(back - price)).toBeLessThan(1e-6);
  });

  it("aligns arbitrary price to the nearest discrete bin", () => {
    const current = 150;
    const stepBps = 25;

    const stepMultiplier = 1 + stepBps / 10000; // 1.0025
    const target = current * Math.pow(stepMultiplier, 1); // one bin up
    const aligned = alignPriceToBin(target * 1.0001, current, stepBps);
    expect(Math.abs(aligned - target)).toBeLessThan(1e-9);
  });

  it("computes expected bin count between two prices", () => {
    const stepBps = 25; // 0.25%
    const min = 100;
    const max = 200;
    const bins = calculateBinsBetweenPrices(min, max, stepBps);
    const expected =
      Math.floor(Math.log(max / min) / Math.log(1 + stepBps / 10000)) + 1;
    expect(bins).toEqual(expected);
  });
});

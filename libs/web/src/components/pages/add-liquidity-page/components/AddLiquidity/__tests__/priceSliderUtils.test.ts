import {describe, it, expect} from "vitest";
import {
  priceToSliderPosition,
  sliderPositionToPrice,
  calculateBinsBetweenPrices,
  alignPriceToBin,
  createSliderBounds,
  formatPriceForDisplay,
} from "../priceSliderUtils";

describe("priceSliderUtils", () => {
  const currentPrice = 1.0;
  const binStep = 25; // 0.25% per bin
  const maxBinsFromCenter = 100;

  describe("priceToSliderPosition and sliderPositionToPrice", () => {
    it("should convert prices to slider positions and back correctly", () => {
      const testPrices = [0.5, 0.8, 1.0, 1.2, 2.0];

      testPrices.forEach((price) => {
        const sliderPosition = priceToSliderPosition(
          price,
          currentPrice,
          binStep,
          maxBinsFromCenter
        );
        const convertedPrice = sliderPositionToPrice(
          sliderPosition,
          currentPrice,
          binStep,
          maxBinsFromCenter
        );

        expect(convertedPrice).toBeCloseTo(price, 6);
      });
    });

    it("should place current price at center of slider (0.5)", () => {
      const sliderPosition = priceToSliderPosition(
        currentPrice,
        currentPrice,
        binStep,
        maxBinsFromCenter
      );
      expect(sliderPosition).toBeCloseTo(0.5, 6);
    });

    it("should handle exponential price movements correctly", () => {
      // Test that equal slider movements represent equal percentage changes
      const stepMultiplier = 1 + binStep / 10000;

      // Price one bin above current
      const priceOneBinUp = currentPrice * stepMultiplier;
      const positionOneBinUp = priceToSliderPosition(
        priceOneBinUp,
        currentPrice,
        binStep,
        maxBinsFromCenter
      );

      // Price one bin below current
      const priceOneBinDown = currentPrice / stepMultiplier;
      const positionOneBinDown = priceToSliderPosition(
        priceOneBinDown,
        currentPrice,
        binStep,
        maxBinsFromCenter
      );

      // Should be equidistant from center
      const distanceUp = positionOneBinUp - 0.5;
      const distanceDown = 0.5 - positionOneBinDown;

      expect(distanceUp).toBeCloseTo(distanceDown, 6);
    });
  });

  describe("calculateBinsBetweenPrices", () => {
    it("should calculate correct number of bins", () => {
      const stepMultiplier = 1 + binStep / 10000;

      // Test with exact bin boundaries
      const minPrice = currentPrice / Math.pow(stepMultiplier, 5);
      const maxPrice = currentPrice * Math.pow(stepMultiplier, 5);

      const numBins = calculateBinsBetweenPrices(minPrice, maxPrice, binStep);
      expect(numBins).toBe(11); // 5 below + 1 current + 5 above
    });

    it("should handle single bin case", () => {
      const stepMultiplier = 1 + binStep / 10000;
      const price1 = currentPrice;
      const price2 = currentPrice * stepMultiplier * 0.5; // Half way to next bin

      const numBins = calculateBinsBetweenPrices(price1, price2, binStep);
      expect(numBins).toBe(1);
    });
  });

  describe("alignPriceToBin", () => {
    it("should align prices to exact bin boundaries", () => {
      const stepMultiplier = 1 + binStep / 10000;

      // Test price slightly above a bin boundary
      const exactBinPrice = currentPrice * Math.pow(stepMultiplier, 3);
      const slightlyAbove = exactBinPrice * 1.0001;

      const aligned = alignPriceToBin(slightlyAbove, currentPrice, binStep);
      expect(aligned).toBeCloseTo(exactBinPrice, 6);
    });

    it("should handle current price correctly", () => {
      const aligned = alignPriceToBin(currentPrice, currentPrice, binStep);
      expect(aligned).toBeCloseTo(currentPrice, 6);
    });
  });

  describe("createSliderBounds", () => {
    it("should create symmetric bounds around current price", () => {
      const bounds = createSliderBounds(
        currentPrice,
        binStep,
        maxBinsFromCenter
      );

      expect(bounds.centerPrice).toBe(currentPrice);
      expect(bounds.sliderMin).toBe(0);
      expect(bounds.sliderMax).toBe(1);

      // Check that bounds are exponentially symmetric
      const ratioDown = currentPrice / bounds.minPrice;
      const ratioUp = bounds.maxPrice / currentPrice;

      expect(ratioDown).toBeCloseTo(ratioUp, 6);
    });
  });

  describe("formatPriceForDisplay", () => {
    it("should format prices with appropriate precision", () => {
      // Small bin step should use more decimals
      expect(formatPriceForDisplay(1.123456, 1)).toMatch(/\d+\.\d{6}/);

      // Large bin step should use fewer decimals
      expect(formatPriceForDisplay(1.123456, 100)).toMatch(/\d+\.\d{3}/);

      // Medium bin step should use standard precision
      expect(formatPriceForDisplay(1.123456, 25)).toMatch(/\d+\.\d{4}/);
    });
  });

  describe("exponential behavior verification", () => {
    it("should demonstrate exponential vs linear movement", () => {
      // Linear slider positions
      const positions = [0.25, 0.5, 0.75];
      const prices = positions.map((pos) =>
        sliderPositionToPrice(pos, currentPrice, binStep, maxBinsFromCenter)
      );

      // Check that price ratios are consistent (exponential behavior)
      const ratio1 = prices[1] / prices[0];
      const ratio2 = prices[2] / prices[1];

      // In exponential movement, equal slider steps should produce equal ratios
      expect(ratio1).toBeCloseTo(ratio2, 3);

      // Verify this is different from linear behavior
      const linearDiff1 = prices[1] - prices[0];
      const linearDiff2 = prices[2] - prices[1];

      // Linear differences should NOT be equal (proving exponential behavior)
      expect(Math.abs(linearDiff1 - linearDiff2)).toBeGreaterThan(0.01);
    });
  });
});

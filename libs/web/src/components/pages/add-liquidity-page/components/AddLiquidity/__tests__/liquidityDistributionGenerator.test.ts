import {
  generateLiquidityDistribution,
  distributionToVisualizationData,
  generateRealisticDistribution,
  getDistributionSummary,
} from "../liquidityDistributionGenerator";

describe("liquidityDistributionGenerator", () => {
  const baseParams = {
    numBins: 5,
    binStep: 25, // 0.25%
    currentPrice: 2000,
    priceRange: [1800, 2200] as [number, number],
    liquidityShape: "curve" as const,
    totalLiquidityAmount: 10000,
  };

  describe("generateLiquidityDistribution", () => {
    it("should generate correct number of bins", () => {
      const result = generateLiquidityDistribution(baseParams);
      expect(result.bins).toHaveLength(baseParams.numBins);
    });

    it("should identify the active bin correctly", () => {
      const result = generateLiquidityDistribution(baseParams);
      const activeBins = result.bins.filter((bin) => bin.isActive);
      expect(activeBins).toHaveLength(1);

      const activeBin = activeBins[0];
      expect(activeBin.price).toBeCloseTo(baseParams.currentPrice, 0);
    });

    it("should distribute liquidity according to spot shape", () => {
      const spotParams = {...baseParams, liquidityShape: "spot" as const};
      const result = generateLiquidityDistribution(spotParams);

      const activeBin = result.bins.find((bin) => bin.isActive);
      const otherBins = result.bins.filter((bin) => !bin.isActive);

      // Active bin should have the most liquidity
      expect(activeBin!.liquidityX + activeBin!.liquidityY).toBeGreaterThan(
        Math.max(...otherBins.map((bin) => bin.liquidityX + bin.liquidityY))
      );
    });

    it("should distribute liquidity according to curve shape", () => {
      const curveParams = {...baseParams, liquidityShape: "curve" as const};
      const result = generateLiquidityDistribution(curveParams);

      // Should have a normal distribution pattern
      const activeBin = result.bins.find((bin) => bin.isActive);
      const activeBinIndex = result.bins.findIndex((bin) => bin.isActive);

      // Bins closer to active should have more liquidity than bins further away
      if (activeBinIndex > 0 && activeBinIndex < result.bins.length - 1) {
        const leftBin = result.bins[activeBinIndex - 1];
        const rightBin = result.bins[activeBinIndex + 1];
        const farLeftBin = result.bins[0];
        const farRightBin = result.bins[result.bins.length - 1];

        const leftTotal = leftBin.liquidityX + leftBin.liquidityY;
        const rightTotal = rightBin.liquidityX + rightBin.liquidityY;
        const farLeftTotal = farLeftBin.liquidityX + farLeftBin.liquidityY;
        const farRightTotal = farRightBin.liquidityX + farRightBin.liquidityY;

        expect(leftTotal).toBeGreaterThanOrEqual(farLeftTotal);
        expect(rightTotal).toBeGreaterThanOrEqual(farRightTotal);
      }
    });

    it("should distribute liquidity according to bidask shape", () => {
      const bidaskParams = {...baseParams, liquidityShape: "bidask" as const};
      const result = generateLiquidityDistribution(bidaskParams);

      const activeBin = result.bins.find((bin) => bin.isActive);
      const otherBins = result.bins.filter((bin) => !bin.isActive);

      // Active bin should have less liquidity than in spot distribution
      const activeLiquidity = activeBin!.liquidityX + activeBin!.liquidityY;
      const totalOtherLiquidity = otherBins.reduce(
        (sum, bin) => sum + bin.liquidityX + bin.liquidityY,
        0
      );

      expect(totalOtherLiquidity).toBeGreaterThan(activeLiquidity);
    });

    it("should place asset0 in bins below current price and asset1 in bins above", () => {
      const result = generateLiquidityDistribution(baseParams);
      const activeBinId = result.activeBinId;

      result.bins.forEach((bin) => {
        if (bin.binId < activeBinId) {
          // Bins below current price should have more asset0 (X)
          expect(bin.liquidityX).toBeGreaterThanOrEqual(0);
          if (bin.binId !== activeBinId) {
            expect(bin.liquidityY).toBe(0);
          }
        } else if (bin.binId > activeBinId) {
          // Bins above current price should have more asset1 (Y)
          expect(bin.liquidityY).toBeGreaterThanOrEqual(0);
          if (bin.binId !== activeBinId) {
            expect(bin.liquidityX).toBe(0);
          }
        }
      });
    });

    it("should calculate utilization rate correctly", () => {
      const result = generateLiquidityDistribution(baseParams);

      expect(result.utilizationRate).toBeGreaterThanOrEqual(0);
      expect(result.utilizationRate).toBeLessThanOrEqual(100);

      // For curve distribution, utilization should be reasonable
      if (baseParams.liquidityShape === "curve") {
        expect(result.utilizationRate).toBeGreaterThan(10);
        expect(result.utilizationRate).toBeLessThan(90);
      }
    });
  });

  describe("distributionToVisualizationData", () => {
    it("should convert distribution to visualization format", () => {
      const distribution = generateLiquidityDistribution(baseParams);
      const vizData = distributionToVisualizationData(distribution);

      expect(vizData).toHaveLength(distribution.bins.length);

      vizData.forEach((item, index) => {
        expect(item).toHaveProperty("price");
        expect(item).toHaveProperty("assetAHeight");
        expect(item).toHaveProperty("assetBHeight");
        expect(item).toHaveProperty("showPrice");
        expect(item).toHaveProperty("binId");
        expect(item).toHaveProperty("asset0Value");
        expect(item).toHaveProperty("asset1Value");

        expect(item.assetAHeight).toBeGreaterThanOrEqual(0);
        expect(item.assetBHeight).toBeGreaterThanOrEqual(0);
        expect(item.binId).toBe(distribution.bins[index].binId);
      });
    });

    it("should scale heights correctly", () => {
      const distribution = generateLiquidityDistribution(baseParams);
      const maxHeight = 100;
      const vizData = distributionToVisualizationData(distribution, maxHeight);

      const maxVizHeight = Math.max(
        ...vizData.map((item) => Math.max(item.assetAHeight, item.assetBHeight))
      );

      expect(maxVizHeight).toBeLessThanOrEqual(maxHeight);
    });
  });

  describe("generateRealisticDistribution", () => {
    it("should add randomness to the distribution", () => {
      const baseDistribution = generateLiquidityDistribution(baseParams);
      const realisticDistribution = generateRealisticDistribution(
        baseParams,
        0.2
      );

      // Should have same structure
      expect(realisticDistribution.bins).toHaveLength(
        baseDistribution.bins.length
      );
      expect(realisticDistribution.activeBinId).toBe(
        baseDistribution.activeBinId
      );

      // But different liquidity amounts (with high probability)
      let hasDifferences = false;
      for (let i = 0; i < baseDistribution.bins.length; i++) {
        if (
          Math.abs(
            baseDistribution.bins[i].liquidityX -
              realisticDistribution.bins[i].liquidityX
          ) > 0.01 ||
          Math.abs(
            baseDistribution.bins[i].liquidityY -
              realisticDistribution.bins[i].liquidityY
          ) > 0.01
        ) {
          hasDifferences = true;
          break;
        }
      }
      expect(hasDifferences).toBe(true);
    });
  });

  describe("getDistributionSummary", () => {
    it("should provide correct summary statistics", () => {
      const distribution = generateLiquidityDistribution(baseParams);
      const summary = getDistributionSummary(distribution);

      expect(summary.totalBins).toBe(baseParams.numBins);
      expect(summary.activeBins).toBe(1);
      expect(summary.binsWithLiquidity).toBeGreaterThan(0);
      expect(summary.activeBinId).toBe(distribution.activeBinId);
      expect(summary.priceRange.min).toBeLessThan(summary.priceRange.max);
      expect(summary.totalValue).toBeGreaterThan(0);
      expect(summary.utilizationRate).toBe(distribution.utilizationRate);
      expect(summary.concentration).toBeGreaterThan(0);
      expect(summary.concentration).toBeLessThanOrEqual(1);
    });
  });

  describe("edge cases", () => {
    it("should handle single bin", () => {
      const singleBinParams = {...baseParams, numBins: 1};
      const result = generateLiquidityDistribution(singleBinParams);

      expect(result.bins).toHaveLength(1);
      expect(result.bins[0].isActive).toBe(true);
      expect(result.utilizationRate).toBe(100);
    });

    it("should handle very large number of bins", () => {
      const largeBinParams = {...baseParams, numBins: 50};
      const result = generateLiquidityDistribution(largeBinParams);

      expect(result.bins.length).toBeLessThanOrEqual(50);
      expect(result.bins.length).toBeGreaterThan(0);
    });

    it("should handle zero total liquidity", () => {
      const zeroLiquidityParams = {...baseParams, totalLiquidityAmount: 0};
      const result = generateLiquidityDistribution(zeroLiquidityParams);

      expect(result.totalLiquidityX).toBe(0);
      expect(result.totalLiquidityY).toBe(0);
      expect(result.utilizationRate).toBe(0);
    });
  });
});

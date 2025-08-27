import {
  generateLiquidityDistribution,
  distributionToVisualizationData,
} from "./liquidityDistributionGenerator";

// Example usage of the liquidity distribution generator
export function exampleUsage() {
  // Example 1: Spot distribution (concentrated around current price)
  const spotDistribution = generateLiquidityDistribution({
    numBins: 5,
    binStep: 25, // 0.25%
    currentPrice: 2000,
    priceRange: [1800, 2200],
    liquidityShape: "spot",
    totalLiquidityAmount: 10000,
  });

  console.log("Spot Distribution:", spotDistribution);

  // Example 2: Curve distribution (normal distribution)
  const curveDistribution = generateLiquidityDistribution({
    numBins: 7,
    binStep: 50, // 0.50%
    currentPrice: 1500,
    priceRange: [1200, 1800],
    liquidityShape: "curve",
    totalLiquidityAmount: 15000,
  });

  console.log("Curve Distribution:", curveDistribution);

  // Example 3: Bid-Ask distribution (liquidity on both sides)
  const bidaskDistribution = generateLiquidityDistribution({
    numBins: 6,
    binStep: 30, // 0.30%
    currentPrice: 0.001,
    priceRange: [0.0008, 0.0012],
    liquidityShape: "bidask",
    totalLiquidityAmount: 5000,
  });

  console.log("Bid-Ask Distribution:", bidaskDistribution);

  // Convert to visualization data
  const spotVizData = distributionToVisualizationData(spotDistribution);
  console.log("Spot Visualization Data:", spotVizData);

  return {
    spotDistribution,
    curveDistribution,
    bidaskDistribution,
    spotVizData,
  };
}

// Test the function
if (typeof window === "undefined") {
  // Only run in Node.js environment (not in browser)
  try {
    const results = exampleUsage();
    console.log("✅ Liquidity distribution generator working correctly");
    console.log(
      "Total bins in spot distribution:",
      results.spotDistribution.bins.length
    );
    console.log("Active bin ID:", results.spotDistribution.activeBinId);
    console.log(
      "Utilization rate:",
      results.spotDistribution.utilizationRate.toFixed(2) + "%"
    );
  } catch (error) {
    console.error("❌ Error in liquidity distribution generator:", error);
  }
}

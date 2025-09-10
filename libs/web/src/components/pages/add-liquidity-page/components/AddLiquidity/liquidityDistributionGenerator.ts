import {LiquidityShape} from "./V2LiquidityConfig";
import type {BigNumberish} from "fuels";
import type {BinIdDelta} from "mira-dex-ts";

export interface BinLiquidityData {
  binId: number;
  price: number;
  liquidityX: number; // Asset 0 amount
  liquidityY: number; // Asset 1 amount
  isActive: boolean;
  distanceFromActive: number;
}

export interface LiquidityDistributionParams {
  numBins: number;
  binStep: number; // In basis points (e.g., 10.04)
  currentPrice: number;
  priceRange: [number, number]; // [minPrice, maxPrice]
  liquidityShape: LiquidityShape;
  totalLiquidityAmount?: number; // Total amount to distribute
}

export interface LiquidityDistributionResult {
  bins: BinLiquidityData[];
  activeBinId: number;
  totalLiquidityX: number;
  totalLiquidityY: number;
  utilizationRate: number; // Percentage of liquidity in active bins
}

export interface DeltaIdDistribution {
  activeIdDesired?: BigNumberish;
  idSlippage?: BigNumberish;
  deltaIds?: BinIdDelta[];
  distributionX?: BigNumberish[];
  distributionY?: BigNumberish[];
}

/**
 * Generate liquidity distribution based on configuration parameters
 */
export function generateLiquidityDistribution(
  params: LiquidityDistributionParams
): LiquidityDistributionResult {
  const {
    numBins,
    binStep,
    currentPrice,
    priceRange,
    liquidityShape,
    totalLiquidityAmount = 10000, // Default total liquidity
  } = params;

  // Calculate bin parameters
  const logBase = Math.log(1 + binStep / 10000);
  const currentBinId = Math.round(Math.log(currentPrice) / logBase);
  const minBinId = Math.floor(Math.log(priceRange[0]) / logBase);
  const maxBinId = Math.ceil(Math.log(priceRange[1]) / logBase);

  // Ensure we have the correct number of bins
  const actualNumBins = Math.min(numBins, maxBinId - minBinId + 1);
  const startBinId = Math.max(
    minBinId,
    currentBinId - Math.floor(actualNumBins / 2)
  );
  const endBinId = startBinId + actualNumBins - 1;

  // Generate bins
  const bins: BinLiquidityData[] = [];

  for (let binId = startBinId; binId <= endBinId; binId++) {
    const price = Math.pow(1 + binStep / 10000, binId);
    const isActive = binId === currentBinId;
    const distanceFromActive = Math.abs(binId - currentBinId);

    // Calculate liquidity amounts based on shape
    const {liquidityX, liquidityY} = calculateBinLiquidity(
      binId,
      currentBinId,
      price,
      currentPrice,
      liquidityShape,
      totalLiquidityAmount,
      actualNumBins
    );

    bins.push({
      binId,
      price,
      liquidityX,
      liquidityY,
      isActive,
      distanceFromActive,
    });
  }

  // Calculate totals and utilization
  const totalLiquidityX = bins.reduce((sum, bin) => sum + bin.liquidityX, 0);
  const totalLiquidityY = bins.reduce((sum, bin) => sum + bin.liquidityY, 0);
  const activeBins = bins.filter((bin) => bin.isActive);
  const activeLiquidityX = activeBins.reduce(
    (sum, bin) => sum + bin.liquidityX,
    0
  );
  const activeLiquidityY = activeBins.reduce(
    (sum, bin) => sum + bin.liquidityY,
    0
  );
  const utilizationRate =
    ((activeLiquidityX + activeLiquidityY) /
      (totalLiquidityX + totalLiquidityY)) *
    100;

  return {
    bins,
    activeBinId: currentBinId,
    totalLiquidityX,
    totalLiquidityY,
    utilizationRate,
  };
}

/**
 * Compute deltaIds and distributions (basis points) from a liquidity distribution.
 * Optionally computes idSlippage from slippage and bin step, and sets activeIdDesired.
 */
export function generateDeltaIdDistribution(params: {
  liquidityDistribution?: LiquidityDistributionResult;
  chainActiveId?: number;
  slippageBps?: number; // e.g. 50 => 0.5%
  binStepBps?: number; // e.g. 25 => 0.25%
}): {
  liquidityDistribution?: LiquidityDistributionResult;
  data: DeltaIdDistribution;
} {
  const {liquidityDistribution, chainActiveId, slippageBps, binStepBps} =
    params;

  const computeIdSlippage = () => {
    if (binStepBps && binStepBps > 0 && typeof slippageBps === "number") {
      return Math.floor(slippageBps / binStepBps);
    }
    return 0;
  };

  if (!liquidityDistribution || !liquidityDistribution.bins?.length) {
    return {
      liquidityDistribution,
      data: {
        activeIdDesired: chainActiveId,
        idSlippage: computeIdSlippage(),
        deltaIds: [{Positive: 0}],
        distributionX: [10000],
        distributionY: [10000],
      },
    };
  }

  const activeId =
    typeof chainActiveId === "number"
      ? chainActiveId
      : liquidityDistribution.activeBinId;

  const selectedBins = liquidityDistribution.bins.filter(
    (b) => (b.liquidityX || 0) > 0 || (b.liquidityY || 0) > 0
  );

  // If nothing selected, fall back to active bin
  if (selectedBins.length === 0) {
    return {
      liquidityDistribution,
      data: {
        activeIdDesired: activeId,
        idSlippage: computeIdSlippage(),
        deltaIds: [{Positive: 0}],
        distributionX: [10000],
        distributionY: [10000],
      },
    };
  }

  const deltaIds: BinIdDelta[] = selectedBins.map((b) => {
    const d = b.binId - activeId;
    return d >= 0 ? {Positive: d} : {Negative: Math.abs(d)};
  });

  const totalX = selectedBins.reduce((sum, b) => sum + (b.liquidityX || 0), 0);
  const totalY = selectedBins.reduce((sum, b) => sum + (b.liquidityY || 0), 0);

  const rawX = selectedBins.map((b) =>
    totalX > 0 ? (b.liquidityX / totalX) * 100 : 0
  );
  const rawY = selectedBins.map((b) =>
    totalY > 0 ? (b.liquidityY / totalY) * 100 : 0
  );

  const roundAndNormalize = (values: number[]): number[] => {
    if (values.every((v) => v === 0)) return values.map(() => 0);
    const rounded = values.map((v) => Math.round(v));
    const sum = rounded.reduce((a, b) => a + b, 0);
    if (sum === 100) return rounded;
    const diff = 100 - sum;
    const idx = rounded.reduce(
      (bestIdx, val, i, arr) => (val > arr[bestIdx] ? i : bestIdx),
      0
    );
    rounded[idx] = Math.max(0, rounded[idx] + diff);
    return rounded;
  };

  const toBps = (arr: number[]): number[] => {
    if (arr.every((v) => v === 0)) return arr.map(() => 0);
    let bps = arr.map((v) => Math.max(0, Math.min(100, v)) * 100);
    const sum = bps.reduce((a, b) => a + b, 0);
    if (sum !== 10000) {
      const diff = 10000 - sum;
      const idx = bps.reduce(
        (bestIdx, val, i, arrVals) => (val > arrVals[bestIdx] ? i : bestIdx),
        0
      );
      bps[idx] = Math.max(0, Math.min(10000, bps[idx] + diff));
    }
    return bps;
  };

  const pctX = roundAndNormalize(rawX);
  const pctY = roundAndNormalize(rawY);
  const distributionX = toBps(pctX);
  const distributionY = toBps(pctY);

  return {
    liquidityDistribution,
    data: {
      activeIdDesired: activeId,
      idSlippage: computeIdSlippage(),
      deltaIds,
      distributionX,
      distributionY,
    },
  };
}

/**
 * Calculate liquidity amounts for a specific bin based on distribution shape
 */
function calculateBinLiquidity(
  binId: number,
  activeBinId: number,
  binPrice: number,
  currentPrice: number,
  shape: LiquidityShape,
  totalLiquidity: number,
  numBins: number
): {liquidityX: number; liquidityY: number} {
  const distanceFromActive = Math.abs(binId - activeBinId);
  const isActive = binId === activeBinId;
  const isBelow = binId < activeBinId;
  const isAbove = binId > activeBinId;

  let liquidityX = 0;
  let liquidityY = 0;
  let weight = 0;

  switch (shape) {
    case "spot":
      // Concentrated liquidity - most liquidity in active bin
      if (isActive) {
        weight = 0.7; // 70% in active bin
        liquidityX = (totalLiquidity * weight * 0.5) / currentPrice;
        liquidityY = totalLiquidity * weight * 0.5;
      } else if (distanceFromActive === 1) {
        weight = 0.15; // 15% in adjacent bins
        if (isBelow) {
          liquidityX = (totalLiquidity * weight) / binPrice;
          liquidityY = 0;
        } else {
          liquidityX = 0;
          liquidityY = totalLiquidity * weight;
        }
      } else {
        weight = 0.15 / Math.max(1, numBins - 3); // Remaining 15% distributed
        if (isBelow) {
          liquidityX = (totalLiquidity * weight) / binPrice;
          liquidityY = 0;
        } else {
          liquidityX = 0;
          liquidityY = totalLiquidity * weight;
        }
      }
      break;

    case "curve":
      // Normal distribution curve
      const sigma = numBins / 4; // Standard deviation
      const normalWeight = Math.exp(
        -0.5 * Math.pow(distanceFromActive / sigma, 2)
      );
      const totalWeight = calculateTotalNormalWeight(numBins, sigma);
      weight = normalWeight / totalWeight;

      if (isActive) {
        liquidityX = (totalLiquidity * weight * 0.5) / currentPrice;
        liquidityY = totalLiquidity * weight * 0.5;
      } else if (isBelow) {
        liquidityX = (totalLiquidity * weight) / binPrice;
        liquidityY = 0;
      } else {
        liquidityX = 0;
        liquidityY = totalLiquidity * weight;
      }
      break;

    case "bidask":
      // Bid-ask spread - liquidity on both sides
      if (isActive) {
        weight = 0.1; // Small amount in active bin
        liquidityX = (totalLiquidity * weight * 0.5) / currentPrice;
        liquidityY = totalLiquidity * weight * 0.5;
      } else {
        // Distribute remaining 90% evenly on both sides
        const sideWeight = 0.45 / Math.floor(numBins / 2);
        weight = sideWeight;

        if (isBelow) {
          liquidityX = (totalLiquidity * weight) / binPrice;
          liquidityY = 0;
        } else {
          liquidityX = 0;
          liquidityY = totalLiquidity * weight;
        }
      }
      break;

    default:
      // Uniform distribution as fallback
      weight = 1 / numBins;
      if (isActive) {
        liquidityX = (totalLiquidity * weight * 0.5) / currentPrice;
        liquidityY = totalLiquidity * weight * 0.5;
      } else if (isBelow) {
        liquidityX = (totalLiquidity * weight) / binPrice;
        liquidityY = 0;
      } else {
        liquidityX = 0;
        liquidityY = totalLiquidity * weight;
      }
  }

  return {liquidityX, liquidityY};
}

/**
 * Calculate total weight for normal distribution normalization
 */
function calculateTotalNormalWeight(numBins: number, sigma: number): number {
  let totalWeight = 0;
  const center = Math.floor(numBins / 2);

  for (let i = 0; i < numBins; i++) {
    const distance = Math.abs(i - center);
    totalWeight += Math.exp(-0.5 * Math.pow(distance / sigma, 2));
  }

  return totalWeight;
}

/**
 * Convert liquidity distribution to visualization data
 */
export function distributionToVisualizationData(
  distribution: LiquidityDistributionResult,
  maxHeight: number = 120
): Array<{
  price: string;
  assetAHeight: number;
  assetBHeight: number;
  showPrice: boolean;
  binId: number;
  asset0Value: number;
  asset1Value: number;
}> {
  const {bins} = distribution;

  // Find max liquidity for scaling
  const maxLiquidityX = Math.max(...bins.map((bin) => bin.liquidityX));
  const maxLiquidityY = Math.max(...bins.map((bin) => bin.liquidityY));
  const maxLiquidity = Math.max(maxLiquidityX, maxLiquidityY);

  return bins.map((bin, index) => {
    // Scale heights
    const assetAHeight =
      maxLiquidity > 0 ? (bin.liquidityX / maxLiquidity) * maxHeight : 0;
    const assetBHeight =
      maxLiquidity > 0 ? (bin.liquidityY / maxLiquidity) * maxHeight : 0;

    // Show price for every 3rd bin or active bin
    const showPrice = bin.isActive || index % 3 === 0;

    return {
      price: bin.price.toFixed(4),
      assetAHeight: Math.round(assetAHeight),
      assetBHeight: Math.round(assetBHeight),
      showPrice,
      binId: bin.binId,
      asset0Value: bin.liquidityX,
      asset1Value: bin.liquidityY,
    };
  });
}

/**
 * Generate realistic liquidity distribution with some randomness
 */
export function generateRealisticDistribution(
  params: LiquidityDistributionParams,
  randomnessFactor: number = 0.1
): LiquidityDistributionResult {
  const baseDistribution = generateLiquidityDistribution(params);

  // Add some randomness to make it more realistic
  const randomizedBins = baseDistribution.bins.map((bin) => {
    const randomMultiplierX = 1 + (Math.random() - 0.5) * randomnessFactor;
    const randomMultiplierY = 1 + (Math.random() - 0.5) * randomnessFactor;

    return {
      ...bin,
      liquidityX: Math.max(0, bin.liquidityX * randomMultiplierX),
      liquidityY: Math.max(0, bin.liquidityY * randomMultiplierY),
    };
  });

  // Recalculate totals
  const totalLiquidityX = randomizedBins.reduce(
    (sum, bin) => sum + bin.liquidityX,
    0
  );
  const totalLiquidityY = randomizedBins.reduce(
    (sum, bin) => sum + bin.liquidityY,
    0
  );
  const activeBins = randomizedBins.filter((bin) => bin.isActive);
  const activeLiquidityX = activeBins.reduce(
    (sum, bin) => sum + bin.liquidityX,
    0
  );
  const activeLiquidityY = activeBins.reduce(
    (sum, bin) => sum + bin.liquidityY,
    0
  );
  const utilizationRate =
    ((activeLiquidityX + activeLiquidityY) /
      (totalLiquidityX + totalLiquidityY)) *
    100;

  return {
    ...baseDistribution,
    bins: randomizedBins,
    totalLiquidityX,
    totalLiquidityY,
    utilizationRate,
  };
}

/**
 * Helper function to get distribution summary
 */
export function getDistributionSummary(
  distribution: LiquidityDistributionResult
) {
  const {bins, activeBinId, totalLiquidityX, totalLiquidityY, utilizationRate} =
    distribution;

  const activeBins = bins.filter((bin) => bin.isActive);
  const binsWithLiquidity = bins.filter(
    (bin) => bin.liquidityX > 0 || bin.liquidityY > 0
  );
  const priceRange = {
    min: Math.min(...bins.map((bin) => bin.price)),
    max: Math.max(...bins.map((bin) => bin.price)),
  };

  return {
    totalBins: bins.length,
    activeBins: activeBins.length,
    binsWithLiquidity: binsWithLiquidity.length,
    activeBinId,
    priceRange,
    totalValue: totalLiquidityX + totalLiquidityY,
    utilizationRate,
    concentration: activeBins.length / bins.length, // How concentrated the liquidity is
  };
}

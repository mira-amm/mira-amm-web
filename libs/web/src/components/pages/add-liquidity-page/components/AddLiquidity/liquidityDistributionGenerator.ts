import {LiquidityShape} from "./V2LiquidityConfig";
import type {BigNumberish} from "fuels";
import type {BinIdDelta} from "mira-dex-ts";
import {
  computeIdSlippageFromBps,
  computeDistributionBpsForRaw,
  computeUtilizationRate,
} from "./liquidityDistributionUtils";
import {calculateBinLiquidity} from "./liquidityDistributionUtils";

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
  // Optional extras to compute delta distribution
  chainActiveId?: number; // if provided, use this; otherwise use computed activeBinId
  slippageBps?: number; // to derive idSlippage
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
): {
  liquidityDistribution: LiquidityDistributionResult;
  deltaDistribution: DeltaIdDistribution;
} {
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

  // Determine target active id for delta computation
  const activeIdForDelta =
    typeof params.chainActiveId === "number"
      ? params.chainActiveId
      : currentBinId;

  // Generate bins and accumulate compact delta/distribution inputs
  const bins: BinLiquidityData[] = [];
  const accDeltaIds: BinIdDelta[] = [];
  const accRawX: number[] = [];
  const accRawY: number[] = [];

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

    // Accumulate only bins with some liquidity to keep payloads compact
    if (liquidityX > 0 || liquidityY > 0) {
      const d = binId - activeIdForDelta;
      accDeltaIds.push(d >= 0 ? {Positive: d} : {Negative: Math.abs(d)});
      accRawX.push(liquidityX);
      accRawY.push(liquidityY);
    }
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
  const utilizationRate = computeUtilizationRate(
    totalLiquidityX,
    totalLiquidityY,
    activeLiquidityX,
    activeLiquidityY
  );

  const result: LiquidityDistributionResult = {
    bins,
    activeBinId: currentBinId,
    totalLiquidityX,
    totalLiquidityY,
    utilizationRate,
  };

  const computeIdSlippage = () =>
    computeIdSlippageFromBps(params.binStep, params.slippageBps);

  let deltaIds: BinIdDelta[];
  let distributionX: number[];
  let distributionY: number[];

  if (accDeltaIds.length === 0) {
    deltaIds = [{Positive: 0}];
    distributionX = [10000];
    distributionY = [10000];
  } else {
    deltaIds = accDeltaIds;

    // Use precomputed totals
    const totalX = result.totalLiquidityX;
    const totalY = result.totalLiquidityY;

    distributionX = computeDistributionBpsForRaw(accRawX, totalX);
    distributionY = computeDistributionBpsForRaw(accRawY, totalY);
  }

  const deltaDistribution: DeltaIdDistribution = {
    activeIdDesired: activeIdForDelta,
    idSlippage: computeIdSlippage(),
    deltaIds,
    distributionX,
    distributionY,
  };

  return {liquidityDistribution: result, deltaDistribution};
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

  // Compute per-bin total value in terms of token Y using bin price (Y per X)
  // This ensures bar heights reflect value, not raw token counts
  const binTotalValues = bins.map((bin) => {
    const valueXInY = bin.liquidityX * bin.price; // convert X to Y terms
    const valueYInY = bin.liquidityY; // already in Y terms
    return valueXInY + valueYInY;
  });
  const maxTotalValue = Math.max(0, ...binTotalValues);

  return bins.map((bin, index) => {
    // Scale stacked heights by value such that total bar height represents total value
    const valueXInY = bin.liquidityX * bin.price;
    const valueYInY = bin.liquidityY;
    const totalValueY = valueXInY + valueYInY;

    const totalBarHeight =
      maxTotalValue > 0 ? (totalValueY / maxTotalValue) * maxHeight : 0;

    const assetAHeight =
      totalValueY > 0 ? (valueXInY / totalValueY) * totalBarHeight : 0;
    const assetBHeight =
      totalValueY > 0 ? (valueYInY / totalValueY) * totalBarHeight : 0;

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
  const {liquidityDistribution: baseDistribution} =
    generateLiquidityDistribution(params);

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

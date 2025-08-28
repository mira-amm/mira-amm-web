import {BN, BigNumberish} from "fuels";
import {
  Amounts,
  PoolMetadataV2,
  BinLiquidityInfo,
  LiquidityDistribution,
  BinIdDelta,
} from "../model";
import {
  MockPoolState,
  MockBinState,
  MockUserPosition,
  MockBinPosition,
} from "./types";

/**
 * Configuration for liquidity distribution across bins
 */
export interface LiquidityDistributionConfig {
  /** Center bin ID around which to distribute liquidity */
  centerBinId: number;
  /** Number of bins to distribute across */
  binCount: number;
  /** Distribution strategy */
  strategy: "uniform" | "concentrated" | "wide" | "custom";
  /** Custom distribution weights (only used with 'custom' strategy) */
  customWeights?: number[];
  /** Concentration factor for 'concentrated' strategy (0-1, higher = more concentrated) */
  concentrationFactor?: number;
}

/**
 * Parameters for swap simulation
 */
export interface SwapSimulationParams {
  /** Pool state to simulate swap on */
  poolState: MockPoolState;
  /** Amount to swap in */
  amountIn: BN;
  /** True if swapping X for Y, false if swapping Y for X */
  swapForY: boolean;
  /** Maximum slippage tolerance (0-1) */
  slippageTolerance?: number;
}

/**
 * Result of swap simulation
 */
export interface SwapSimulationResult {
  /** Amount out from the swap */
  amountOut: BN;
  /** Price impact as a percentage (0-1) */
  priceImpact: number;
  /** Effective price per unit */
  effectivePrice: BN;
  /** Bins that would be affected by the swap */
  affectedBins: number[];
  /** New active bin ID after swap */
  newActiveBinId: number;
  /** Whether slippage tolerance would be exceeded */
  slippageExceeded: boolean;
}

/**
 * MockLiquidityCalculator provides bin-based math calculations for v2 pools
 *
 * Features:
 * - Bin price calculations using binStep and baseFactor
 * - Liquidity distribution algorithms across multiple bins
 * - Price impact calculations for swap simulations
 * - LP token amount calculations for add/remove operations
 * - Realistic bin-based constant product math
 */
export class MockLiquidityCalculator {
  private static readonly SCALE = new BN(10).pow(18); // 18 decimal precision
  private static readonly BASIS_POINTS = new BN(10000);

  /**
   * Calculate the price at a specific bin ID
   * @param binId - Bin identifier
   * @param binStep - Bin step for the pool (basis points)
   * @returns Price with 18 decimal precision
   */
  static getBinPrice(binId: number, binStep: number): BN {
    // Price calculation: price = (1 + binStep / 10000) ^ binId
    const binStepBN = new BN(binStep);
    const base = this.SCALE.add(
      binStepBN.mul(this.SCALE).div(this.BASIS_POINTS)
    );

    if (binId === 0) {
      return this.SCALE; // Price = 1.0 scaled
    }

    let result = this.SCALE;
    const absBinId = Math.abs(binId);

    // Use exponentiation by squaring for efficiency
    let basePower = base;
    let exp = absBinId;

    while (exp > 0) {
      if (exp % 2 === 1) {
        result = result.mul(basePower).div(this.SCALE);
      }
      basePower = basePower.mul(basePower).div(this.SCALE);
      exp = Math.floor(exp / 2);
    }

    // If binId is negative, take reciprocal
    if (binId < 0) {
      result = this.SCALE.mul(this.SCALE).div(result);
    }

    return result;
  }

  /**
   * Calculate the bin ID for a given price
   * @param price - Price with 18 decimal precision
   * @param binStep - Bin step for the pool (basis points)
   * @returns Bin ID
   */
  static getPriceBinId(price: BN, binStep: number): number {
    const targetPrice = price;

    // Handle edge cases
    if (targetPrice.eq(this.SCALE)) {
      return 0; // Price = 1.0
    }

    // Binary search bounds
    let low = -1000000;
    let high = 1000000;
    let bestBinId = 0;
    let bestDiff = new BN(2).pow(256); // Max BN value

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midPrice = this.getBinPrice(mid, binStep);
      const diff = midPrice.gt(targetPrice)
        ? midPrice.sub(targetPrice)
        : targetPrice.sub(midPrice);

      if (diff.lt(bestDiff)) {
        bestDiff = diff;
        bestBinId = mid;
      }

      if (midPrice.lt(targetPrice)) {
        low = mid + 1;
      } else if (midPrice.gt(targetPrice)) {
        high = mid - 1;
      } else {
        return mid; // Exact match
      }
    }

    return bestBinId;
  }

  /**
   * Distribute liquidity across multiple bins according to configuration
   * @param totalAmountX - Total amount of token X to distribute
   * @param totalAmountY - Total amount of token Y to distribute
   * @param config - Distribution configuration
   * @param binStep - Bin step for price calculations
   * @returns Array of bin states with distributed liquidity
   */
  static distributeLiquidity(
    totalAmountX: BN,
    totalAmountY: BN,
    config: LiquidityDistributionConfig,
    binStep: number
  ): MockBinState[] {
    const {centerBinId, binCount, strategy} = config;
    const bins: MockBinState[] = [];

    // Calculate bin range around center
    const halfRange = Math.floor(binCount / 2);
    const startBinId = centerBinId - halfRange;
    const endBinId = centerBinId + halfRange;

    // Generate distribution weights
    const weights = this.generateDistributionWeights(config);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    // Distribute liquidity across bins
    for (let i = 0; i < binCount; i++) {
      const binId = startBinId + i;
      const weight = weights[i] / totalWeight;
      const price = this.getBinPrice(binId, binStep);

      // Calculate amounts for this bin based on price and weight
      const {amountX, amountY} = this.calculateBinAmounts(
        totalAmountX,
        totalAmountY,
        weight,
        price,
        binId,
        centerBinId
      );

      // Calculate LP tokens for this bin (simplified)
      const lpTokens = this.calculateLPTokens(amountX, amountY, price);

      bins.push({
        binId,
        reserves: {x: amountX, y: amountY},
        totalLpTokens: lpTokens,
        price,
        isActive: binId === centerBinId,
      });
    }

    return bins;
  }

  /**
   * Calculate price impact for a swap simulation
   * @param params - Swap simulation parameters
   * @returns Swap simulation result with price impact
   */
  static simulateSwap(params: SwapSimulationParams): SwapSimulationResult {
    const {poolState, amountIn, swapForY, slippageTolerance = 0.05} = params;

    let remainingAmountIn = amountIn;
    let totalAmountOut = new BN(0);
    let currentBinId = poolState.activeBinId;
    const affectedBins: number[] = [];
    const originalPrice = this.getBinPrice(
      poolState.activeBinId,
      poolState.metadata.pool.binStep
    );

    // Simulate swap across bins
    while (remainingAmountIn.gt(0)) {
      const binState = poolState.bins.get(currentBinId);

      if (
        !binState ||
        (swapForY ? binState.reserves.x.eq(0) : binState.reserves.y.eq(0))
      ) {
        // No liquidity in this bin, move to next
        currentBinId = swapForY ? currentBinId + 1 : currentBinId - 1;

        // Prevent infinite loop
        if (Math.abs(currentBinId - poolState.activeBinId) > 100) {
          break;
        }
        continue;
      }

      affectedBins.push(currentBinId);

      const availableReserve = swapForY
        ? binState.reserves.x
        : binState.reserves.y;
      const outputReserve = swapForY
        ? binState.reserves.y
        : binState.reserves.x;

      // Calculate how much we can swap in this bin
      const amountInThisBin = remainingAmountIn.lt(availableReserve)
        ? remainingAmountIn
        : availableReserve;

      // Calculate output using constant product formula within the bin
      const amountOutThisBin = amountInThisBin
        .mul(outputReserve)
        .div(availableReserve.add(amountInThisBin));

      totalAmountOut = totalAmountOut.add(amountOutThisBin);
      remainingAmountIn = remainingAmountIn.sub(amountInThisBin);

      // Move to next bin if we consumed all liquidity in current bin
      if (amountInThisBin.eq(availableReserve)) {
        currentBinId = swapForY ? currentBinId + 1 : currentBinId - 1;
      }
    }

    // Calculate price impact
    const finalPrice = this.getBinPrice(
      currentBinId,
      poolState.metadata.pool.binStep
    );
    const priceImpact = this.calculatePriceImpact(originalPrice, finalPrice);

    // Calculate effective price
    const effectivePrice = totalAmountOut.gt(0)
      ? amountIn.mul(this.SCALE).div(totalAmountOut)
      : new BN(0);

    // Check slippage
    const slippageExceeded = priceImpact > slippageTolerance;

    return {
      amountOut: totalAmountOut,
      priceImpact,
      effectivePrice,
      affectedBins,
      newActiveBinId: currentBinId,
      slippageExceeded,
    };
  }

  /**
   * Calculate LP token amounts for add liquidity operations
   * @param amountX - Amount of token X being added
   * @param amountY - Amount of token Y being added
   * @param binId - Target bin ID
   * @param binStep - Bin step for price calculations
   * @param existingLiquidity - Existing liquidity in the bin (optional)
   * @returns LP token amount to mint
   */
  static calculateAddLiquidityLPTokens(
    amountX: BN,
    amountY: BN,
    binId: number,
    binStep: number,
    existingLiquidity?: {reserves: Amounts; totalLpTokens: BN}
  ): BN {
    const price = this.getBinPrice(binId, binStep);

    if (!existingLiquidity || existingLiquidity.totalLpTokens.eq(0)) {
      // First liquidity provision - use geometric mean
      return this.calculateLPTokens(amountX, amountY, price);
    }

    // Calculate proportional LP tokens based on existing liquidity
    const {reserves, totalLpTokens} = existingLiquidity;

    // Use the minimum ratio to prevent manipulation
    const ratioX = reserves.x.gt(0)
      ? amountX.mul(totalLpTokens).div(reserves.x)
      : new BN(0);
    const ratioY = reserves.y.gt(0)
      ? amountY.mul(totalLpTokens).div(reserves.y)
      : new BN(0);

    return ratioX.lt(ratioY) ? ratioX : ratioY;
  }

  /**
   * Calculate token amounts for remove liquidity operations
   * @param lpTokenAmount - Amount of LP tokens being burned
   * @param binState - Current bin state
   * @returns Token amounts to return
   */
  static calculateRemoveLiquidityAmounts(
    lpTokenAmount: BN,
    binState: MockBinState
  ): Amounts {
    if (binState.totalLpTokens.eq(0)) {
      return {x: new BN(0), y: new BN(0)};
    }

    // Calculate proportional amounts
    const shareRatio = lpTokenAmount
      .mul(this.SCALE)
      .div(binState.totalLpTokens);

    const amountX = binState.reserves.x.mul(shareRatio).div(this.SCALE);
    const amountY = binState.reserves.y.mul(shareRatio).div(this.SCALE);

    return {x: amountX, y: amountY};
  }

  /**
   * Calculate optimal bin distribution for a given price range
   * @param lowerPrice - Lower bound price
   * @param upperPrice - Upper bound price
   * @param binStep - Bin step for the pool
   * @param maxBins - Maximum number of bins to use
   * @returns Array of bin IDs for optimal distribution
   */
  static calculateOptimalBinDistribution(
    lowerPrice: BN,
    upperPrice: BN,
    binStep: number,
    maxBins: number = 20
  ): number[] {
    const lowerBinId = this.getPriceBinId(lowerPrice, binStep);
    const upperBinId = this.getPriceBinId(upperPrice, binStep);

    const totalBins = upperBinId - lowerBinId + 1;

    if (totalBins <= maxBins) {
      // Use all bins in range
      const bins: number[] = [];
      for (let i = lowerBinId; i <= upperBinId; i++) {
        bins.push(i);
      }
      return bins;
    }

    // Select evenly spaced bins
    const bins: number[] = [];
    const step = totalBins / maxBins;

    for (let i = 0; i < maxBins; i++) {
      const binId = lowerBinId + Math.floor(i * step);
      bins.push(binId);
    }

    return bins;
  }

  // ===== Private Helper Methods =====

  /**
   * Generate distribution weights based on strategy
   */
  private static generateDistributionWeights(
    config: LiquidityDistributionConfig
  ): number[] {
    const {
      binCount,
      strategy,
      customWeights,
      concentrationFactor = 0.8,
    } = config;

    switch (strategy) {
      case "uniform":
        return new Array(binCount).fill(1);

      case "concentrated":
        return this.generateConcentratedWeights(binCount, concentrationFactor);

      case "wide":
        return this.generateWideWeights(binCount);

      case "custom":
        return customWeights || new Array(binCount).fill(1);

      default:
        return new Array(binCount).fill(1);
    }
  }

  /**
   * Generate concentrated distribution weights (bell curve)
   */
  private static generateConcentratedWeights(
    binCount: number,
    concentration: number
  ): number[] {
    const weights: number[] = [];
    const center = (binCount - 1) / 2;
    const sigma = ((1 - concentration) * binCount) / 4; // Adjust spread based on concentration

    for (let i = 0; i < binCount; i++) {
      const distance = Math.abs(i - center);
      const weight = Math.exp(-(distance * distance) / (2 * sigma * sigma));
      weights.push(weight);
    }

    return weights;
  }

  /**
   * Generate wide distribution weights (inverse bell curve)
   */
  private static generateWideWeights(binCount: number): number[] {
    const weights: number[] = [];
    const center = (binCount - 1) / 2;

    for (let i = 0; i < binCount; i++) {
      const distance = Math.abs(i - center);
      const weight = 0.5 + distance / binCount; // Higher weight for bins further from center
      weights.push(weight);
    }

    return weights;
  }

  /**
   * Calculate bin amounts based on price and position relative to active bin
   */
  private static calculateBinAmounts(
    totalAmountX: BN,
    totalAmountY: BN,
    weight: number,
    price: BN,
    binId: number,
    activeBinId: number
  ): {amountX: BN; amountY: BN} {
    const weightBN = new BN(Math.floor(weight * 1000000)); // Scale for precision
    const scaleFactor = new BN(1000000);

    if (binId < activeBinId) {
      // Below active price - only token Y
      return {
        amountX: new BN(0),
        amountY: totalAmountY.mul(weightBN).div(scaleFactor),
      };
    } else if (binId > activeBinId) {
      // Above active price - only token X
      return {
        amountX: totalAmountX.mul(weightBN).div(scaleFactor),
        amountY: new BN(0),
      };
    } else {
      // Active bin - both tokens
      return {
        amountX: totalAmountX.mul(weightBN).div(scaleFactor),
        amountY: totalAmountY.mul(weightBN).div(scaleFactor),
      };
    }
  }

  /**
   * Calculate LP tokens using geometric mean
   */
  private static calculateLPTokens(amountX: BN, amountY: BN, price: BN): BN {
    if (amountX.eq(0) && amountY.eq(0)) {
      return new BN(0);
    }

    // Convert to same units using price
    const valueX = amountX.mul(price).div(this.SCALE);
    const valueY = amountY;

    // Use geometric mean: sqrt(valueX * valueY)
    const product = valueX.mul(valueY);
    return this.sqrt(product);
  }

  /**
   * Calculate price impact as percentage
   */
  private static calculatePriceImpact(
    originalPrice: BN,
    finalPrice: BN
  ): number {
    if (originalPrice.eq(0)) return 0;

    const diff = finalPrice.gt(originalPrice)
      ? finalPrice.sub(originalPrice)
      : originalPrice.sub(finalPrice);

    const impact = diff.mul(this.SCALE).div(originalPrice);
    return Number(impact.toString()) / Number(this.SCALE.toString());
  }

  /**
   * Calculate square root using Newton's method
   */
  private static sqrt(value: BN): BN {
    if (value.eq(0)) return new BN(0);

    let x = value;
    let y = value.add(1).div(2);

    while (y.lt(x)) {
      x = y;
      y = x.add(value.div(x)).div(2);
    }

    return x;
  }
}

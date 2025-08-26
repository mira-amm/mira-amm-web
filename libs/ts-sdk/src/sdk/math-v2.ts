import {BN, type BigNumberish} from "fuels";
import {
  PoolMetadataV2,
  Amounts,
  BinLiquidityInfo,
  LiquidityDistribution,
  LiquidityConfig,
} from "./model";
import {InsufficientReservesError, InvalidAmountError} from "./errors";
import {binIdToPrice, priceToBinId} from "./utils";

export const BASIS_POINTS = new BN(10000);
const ONE_E_18 = new BN(10).pow(new BN(18));

/**
 * Calculate the output amount for a swap in a v2 binned liquidity pool
 * @param poolMetadata Pool metadata containing bin structure and reserves
 * @param amountIn Input amount to swap
 * @param swapForY True if swapping X for Y, false if swapping Y for X
 * @returns Output amount after swap
 */
export function getAmountOutV2(
  poolMetadata: PoolMetadataV2,
  amountIn: BN,
  swapForY: boolean
): BN {
  if (amountIn.lte(0)) {
    throw new InvalidAmountError();
  }

  const {reserves, activeId, pool} = poolMetadata;
  const {binStep} = pool;

  // Start from active bin and traverse bins until input is consumed
  let remainingAmountIn = amountIn;
  let totalAmountOut = new BN(0);
  let currentBinId = activeId;

  while (remainingAmountIn.gt(0)) {
    const binReserves = getBinReservesAtId(poolMetadata, currentBinId);

    if (
      !binReserves ||
      (swapForY ? binReserves.y.eq(0) : binReserves.x.eq(0))
    ) {
      // No liquidity in this bin, move to next bin
      currentBinId = swapForY ? currentBinId + 1 : currentBinId - 1;

      // Check if we've run out of liquidity
      if (Math.abs(currentBinId - activeId) > 1000) {
        throw new InsufficientReservesError();
      }
      continue;
    }

    const availableReserve = swapForY ? binReserves.x : binReserves.y;
    const outputReserve = swapForY ? binReserves.y : binReserves.x;

    // Calculate how much we can swap in this bin
    const amountInThisBin = BN.min(remainingAmountIn, availableReserve);

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

  return totalAmountOut;
}

/**
 * Calculate the input amount required for a desired output in a v2 binned liquidity pool
 * @param poolMetadata Pool metadata containing bin structure and reserves
 * @param amountOut Desired output amount
 * @param swapForY True if swapping X for Y, false if swapping Y for X
 * @returns Required input amount
 */
export function getAmountInV2(
  poolMetadata: PoolMetadataV2,
  amountOut: BN,
  swapForY: boolean
): BN {
  if (amountOut.lte(0)) {
    throw new InvalidAmountError();
  }

  const {reserves, activeId} = poolMetadata;
  const totalOutputReserve = swapForY ? reserves.y : reserves.x;

  if (amountOut.gte(totalOutputReserve)) {
    throw new InsufficientReservesError();
  }

  // Start from active bin and traverse bins until output is satisfied
  let remainingAmountOut = amountOut;
  let totalAmountIn = new BN(0);
  let currentBinId = activeId;

  while (remainingAmountOut.gt(0)) {
    const binReserves = getBinReservesAtId(poolMetadata, currentBinId);

    if (
      !binReserves ||
      (swapForY ? binReserves.y.eq(0) : binReserves.x.eq(0))
    ) {
      // No liquidity in this bin, move to next bin
      currentBinId = swapForY ? currentBinId + 1 : currentBinId - 1;

      // Check if we've run out of liquidity
      if (Math.abs(currentBinId - activeId) > 1000) {
        throw new InsufficientReservesError();
      }
      continue;
    }

    const inputReserve = swapForY ? binReserves.x : binReserves.y;
    const outputReserve = swapForY ? binReserves.y : binReserves.x;

    // Calculate how much we can get from this bin
    const amountOutThisBin = BN.min(remainingAmountOut, outputReserve);

    // Calculate required input using constant product formula within the bin
    const amountInThisBin = roundingUpDivision(
      amountOutThisBin.mul(inputReserve),
      outputReserve.sub(amountOutThisBin)
    );

    totalAmountIn = totalAmountIn.add(amountInThisBin);
    remainingAmountOut = remainingAmountOut.sub(amountOutThisBin);

    // Move to next bin if we consumed all liquidity in current bin
    if (amountOutThisBin.eq(outputReserve)) {
      currentBinId = swapForY ? currentBinId + 1 : currentBinId - 1;
    }
  }

  return totalAmountIn;
}

/**
 * Calculate the price at a specific bin ID
 * @param binId The bin ID
 * @param binStep The bin step for the pool
 * @returns Price as a BN with 18 decimal precision
 */
export function getBinPrice(binId: number, binStep: number): BN {
  return binIdToPrice(binId, binStep);
}

/**
 * Calculate the bin ID for a given price
 * @param price The price with 18 decimal precision
 * @param binStep The bin step for the pool
 * @returns Bin ID
 */
export function getPriceBinId(price: BN, binStep: number): number {
  return priceToBinId(price, binStep);
}

/**
 * Calculate liquidity distribution across multiple bins
 * @param totalAmountX Total amount of token X to distribute
 * @param totalAmountY Total amount of token Y to distribute
 * @param activeBinId The active bin ID
 * @param liquidityConfigs Array of liquidity configuration for each bin
 * @returns Map of bin ID to amounts
 */
export function calculateLiquidityDistributionV2(
  totalAmountX: BN,
  totalAmountY: BN,
  activeBinId: number,
  liquidityConfigs: LiquidityConfig[]
): Map<number, Amounts> {
  const binAmounts = new Map<number, Amounts>();

  // Calculate total distribution weights
  let totalDistX = 0;
  let totalDistY = 0;

  for (const config of liquidityConfigs) {
    totalDistX += config.distributionX;
    totalDistY += config.distributionY;
  }

  if (totalDistX === 0 && totalDistY === 0) {
    throw new Error("Total distribution cannot be zero");
  }

  // Distribute amounts proportionally
  for (const config of liquidityConfigs) {
    const amountX =
      totalDistX > 0
        ? totalAmountX.mul(new BN(config.distributionX)).div(new BN(totalDistX))
        : new BN(0);

    const amountY =
      totalDistY > 0
        ? totalAmountY.mul(new BN(config.distributionY)).div(new BN(totalDistY))
        : new BN(0);

    binAmounts.set(config.binId, {x: amountX, y: amountY});
  }

  return binAmounts;
}

/**
 * Calculate the optimal liquidity distribution for a given price range
 * @param activeBinId The active bin ID
 * @param minBinId Minimum bin ID for liquidity distribution
 * @param maxBinId Maximum bin ID for liquidity distribution
 * @param concentrationFactor Factor to concentrate liquidity around active bin (0-1)
 * @returns Array of liquidity configurations
 */
export function calculateOptimalDistribution(
  activeBinId: number,
  minBinId: number,
  maxBinId: number,
  concentrationFactor: number = 0.5
): LiquidityConfig[] {
  if (concentrationFactor < 0 || concentrationFactor > 1) {
    throw new Error("Concentration factor must be between 0 and 1");
  }

  const configs: LiquidityConfig[] = [];
  const totalBins = maxBinId - minBinId + 1;

  // Calculate distribution weights using a normal distribution-like curve
  for (let binId = minBinId; binId <= maxBinId; binId++) {
    const distance = Math.abs(binId - activeBinId);
    const maxDistance = Math.max(
      activeBinId - minBinId,
      maxBinId - activeBinId
    );

    // Use exponential decay for concentration
    const weight = Math.exp(
      (-distance * concentrationFactor * 5) / maxDistance
    );
    const normalizedWeight = Math.floor((weight * 10000) / totalBins);

    // Distribute X tokens to bins below active bin, Y tokens to bins above
    const distributionX = binId <= activeBinId ? normalizedWeight : 0;
    const distributionY = binId >= activeBinId ? normalizedWeight : 0;

    configs.push({
      binId,
      distributionX,
      distributionY,
    });
  }

  return configs;
}

/**
 * Calculate the total value of a liquidity position across multiple bins
 * @param binPositions Array of bin positions with amounts
 * @param poolMetadata Pool metadata for price calculations
 * @returns Total value in terms of both tokens
 */
export function calculatePositionValue(
  binPositions: Array<{binId: number; amounts: Amounts}>,
  poolMetadata: PoolMetadataV2
): Amounts {
  let totalX = new BN(0);
  let totalY = new BN(0);

  for (const position of binPositions) {
    totalX = totalX.add(position.amounts.x);
    totalY = totalY.add(position.amounts.y);
  }

  return {x: totalX, y: totalY};
}

/**
 * Calculate the impermanent loss for a v2 position
 * @param initialAmounts Initial amounts when position was created
 * @param currentAmounts Current amounts in the position
 * @param initialPrice Initial price when position was created
 * @param currentPrice Current price
 * @returns Impermanent loss as a percentage (scaled by 10000)
 */
export function calculateImpermanentLossV2(
  initialAmounts: Amounts,
  currentAmounts: Amounts,
  initialPrice: BN,
  currentPrice: BN
): BN {
  // Calculate initial value in terms of token Y
  const initialValueY = initialAmounts.y.add(
    initialAmounts.x.mul(initialPrice).div(ONE_E_18)
  );

  // Calculate current value in terms of token Y
  const currentValueY = currentAmounts.y.add(
    currentAmounts.x.mul(currentPrice).div(ONE_E_18)
  );

  // Calculate what the value would be if held without providing liquidity
  const holdValueY = initialAmounts.y.add(
    initialAmounts.x.mul(currentPrice).div(ONE_E_18)
  );

  // Impermanent loss = (current_value - hold_value) / hold_value
  if (holdValueY.eq(0)) {
    return new BN(0);
  }

  const loss = holdValueY.sub(currentValueY).mul(BASIS_POINTS).div(holdValueY);
  return loss;
}

/**
 * Calculate swap fees for a v2 transaction
 * @param amountIn Input amount
 * @param feeBasisPoints Fee in basis points
 * @returns Fee amount
 */
export function calculateSwapFeeV2(amountIn: BN, feeBasisPoints: BN): BN {
  return amountIn.mul(feeBasisPoints).div(BASIS_POINTS);
}

/**
 * Calculate the effective price after a swap
 * @param amountIn Input amount
 * @param amountOut Output amount
 * @returns Effective price (amountOut / amountIn)
 */
export function calculateEffectivePrice(amountIn: BN, amountOut: BN): BN {
  if (amountIn.eq(0)) {
    throw new Error("Input amount cannot be zero");
  }
  return amountOut.mul(ONE_E_18).div(amountIn);
}

/**
 * Calculate price impact for a swap
 * @param spotPrice Current spot price
 * @param effectivePrice Effective price after swap
 * @returns Price impact as a percentage (scaled by 10000)
 */
export function calculatePriceImpact(spotPrice: BN, effectivePrice: BN): BN {
  if (spotPrice.eq(0)) {
    return new BN(0);
  }

  const impact = spotPrice
    .sub(effectivePrice)
    .abs()
    .mul(BASIS_POINTS)
    .div(spotPrice);
  return impact;
}

/**
 * Helper function to get bin reserves at a specific bin ID
 * This is a simplified version - in practice, this would query the contract
 */
function getBinReservesAtId(
  poolMetadata: PoolMetadataV2,
  binId: number
): Amounts | null {
  // This is a placeholder implementation
  // In the actual implementation, this would query bin-specific reserves from the contract
  if (binId === poolMetadata.activeId) {
    return poolMetadata.reserves;
  }

  // For testing purposes, simulate some liquidity in adjacent bins
  const distance = Math.abs(binId - poolMetadata.activeId);
  if (distance <= 5) {
    // Simulate decreasing liquidity as we move away from active bin
    const liquidityFactor = Math.max(0.1, 1 - distance * 0.15);
    return {
      x: poolMetadata.reserves.x
        .mul(new BN(Math.floor(liquidityFactor * 1000)))
        .div(new BN(1000)),
      y: poolMetadata.reserves.y
        .mul(new BN(Math.floor(liquidityFactor * 1000)))
        .div(new BN(1000)),
    };
  }

  // For bins far from active, return null to indicate no liquidity
  return null;
}

/**
 * Rounding up division utility function
 */
export function roundingUpDivision(nominator: BN, denominator: BN): BN {
  const roundingDownDivisionResult = nominator.div(denominator);
  if (nominator.mod(denominator).isZero()) {
    return roundingDownDivisionResult;
  } else {
    return roundingDownDivisionResult.add(new BN(1));
  }
}

/**
 * Calculate the minimum amount out considering slippage
 * @param amountOut Expected output amount
 * @param slippageBasisPoints Slippage tolerance in basis points
 * @returns Minimum amount out
 */
export function calculateMinAmountOut(
  amountOut: BN,
  slippageBasisPoints: BN
): BN {
  const slippageAmount = amountOut.mul(slippageBasisPoints).div(BASIS_POINTS);
  return amountOut.sub(slippageAmount);
}

/**
 * Calculate the maximum amount in considering slippage
 * @param amountIn Expected input amount
 * @param slippageBasisPoints Slippage tolerance in basis points
 * @returns Maximum amount in
 */
export function calculateMaxAmountIn(
  amountIn: BN,
  slippageBasisPoints: BN
): BN {
  const slippageAmount = amountIn.mul(slippageBasisPoints).div(BASIS_POINTS);
  return amountIn.add(slippageAmount);
}

/**
 * Calculate the liquidity amount for a given token amounts in a bin
 * @param amountX Amount of token X
 * @param amountY Amount of token Y
 * @param binId Bin ID
 * @param binStep Bin step
 * @returns Liquidity amount
 */
export function calculateBinLiquidity(
  amountX: BN,
  amountY: BN,
  binId: number,
  binStep: number
): BN {
  // For v2 binned liquidity, liquidity is calculated differently than v1
  // This is a simplified calculation - the actual implementation would depend
  // on the specific v2 contract implementation
  const price = getBinPrice(binId, binStep);

  // Use geometric mean of the amounts weighted by price
  if (amountX.eq(0) && amountY.eq(0)) {
    return new BN(0);
  }

  if (amountX.eq(0)) {
    return amountY;
  }

  if (amountY.eq(0)) {
    return amountX.mul(price).div(ONE_E_18);
  }

  // Geometric mean: sqrt(amountX * amountY * price)
  const product = amountX.mul(amountY).mul(price).div(ONE_E_18);
  return sqrt(product);
}

/**
 * Calculate square root using Newton's method
 * @param value Value to calculate square root of
 * @returns Square root
 */
function sqrt(value: BN): BN {
  if (value.eq(0)) {
    return new BN(0);
  }

  let x = value;
  let y = value.add(new BN(1)).div(new BN(2));

  while (y.lt(x)) {
    x = y;
    y = x.add(value.div(x)).div(new BN(2));
  }

  return x;
}

import {BN} from "fuels";
import {AmmFees, PoolId, PoolIdV2, PoolMetadataV2, Amounts} from "./model";
import {InsufficientReservesError, InvalidAmountError} from "./errors";
import {
  getAmountOutV2,
  getAmountInV2,
  calculateSwapFeeV2,
  roundingUpDivision as roundingUpDivisionV2,
} from "./math-v2";

export const BASIS_POINTS = new BN(10000);
const ONE_E_18 = new BN(10).pow(new BN(18));

function adjust(amount: BN, powDecimals: BN): BN {
  return amount.mul(ONE_E_18).div(powDecimals);
}

export function roundingUpDivision(nominator: BN, denominator: BN): BN {
  let roundingDownDivisionResult = nominator.div(denominator);
  if (nominator.mod(denominator).isZero()) {
    return roundingDownDivisionResult;
  } else {
    return roundingDownDivisionResult.add(new BN(1));
  }
}

export function getAmountOut(
  isStable: boolean,
  reserveIn: BN,
  reserveOut: BN,
  powDecimalsIn: BN,
  powDecimalsOut: BN,
  inputAmount: BN
): BN {
  if (inputAmount.lte(0)) {
    throw new InvalidAmountError();
  }
  if (isStable) {
    const xy: BN = k(
      true,
      reserveIn,
      reserveOut,
      powDecimalsIn,
      powDecimalsOut
    );

    const amountInAdjusted = adjust(inputAmount, powDecimalsIn);
    const reserveInAdjusted = adjust(reserveIn, powDecimalsIn);
    const reserveOutAdjusted = adjust(reserveOut, powDecimalsOut);

    const y = reserveOutAdjusted.sub(
      getY(amountInAdjusted.add(reserveInAdjusted), xy, reserveOutAdjusted)
    );

    return y.mul(powDecimalsOut).div(ONE_E_18);
  } else {
    return inputAmount.mul(reserveOut).div(reserveIn.add(inputAmount));
  }
}

export function getAmountIn(
  isStable: boolean,
  reserveIn: BN,
  reserveOut: BN,
  powDecimalsIn: BN,
  powDecimalsOut: BN,
  outputAmount: BN
): BN {
  if (outputAmount.gte(reserveOut)) {
    throw new InsufficientReservesError();
  }
  if (outputAmount.lte(0)) {
    throw new InvalidAmountError();
  }
  if (isStable) {
    const xy: BN = k(
      true,
      reserveIn,
      reserveOut,
      powDecimalsIn,
      powDecimalsOut
    );

    const amountOutAdjusted = adjust(outputAmount, powDecimalsOut);
    const reserveInAdjusted = adjust(reserveIn, powDecimalsIn);
    const reserveOutAdjusted = adjust(reserveOut, powDecimalsOut);

    const y = getY(
      reserveOutAdjusted.sub(amountOutAdjusted),
      xy,
      reserveInAdjusted
    ).sub(reserveInAdjusted);

    return roundingUpDivision(y.mul(powDecimalsIn), ONE_E_18);
  } else {
    return roundingUpDivision(
      outputAmount.mul(reserveIn),
      reserveOut.sub(outputAmount)
    );
  }
}

export function powDecimals(decimals: number): BN {
  return new BN(10).pow(new BN(decimals));
}

function k(
  isStable: boolean,
  x: BN,
  y: BN,
  powDecimalsX: BN,
  powDecimalsY: BN
): BN {
  if (isStable) {
    const _x: BN = x.mul(ONE_E_18).div(powDecimalsX);
    const _y: BN = y.mul(ONE_E_18).div(powDecimalsY);
    const _a: BN = _x.mul(_y).div(ONE_E_18);
    const _b: BN = _x.mul(_x).div(ONE_E_18).add(_y.mul(_y).div(ONE_E_18));
    return _a.mul(_b); // x3y+y3x >= k
  } else {
    return x.mul(y); // xy >= k
  }
}

function f(x0: BN, y: BN): BN {
  return x0
    .mul(y.mul(y).div(ONE_E_18).mul(y).div(ONE_E_18))
    .add(x0.mul(x0).div(ONE_E_18).mul(x0).div(ONE_E_18).mul(y));
}

function d(x0: BN, y: BN): BN {
  return new BN(3)
    .mul(x0)
    .mul(y.mul(y).div(ONE_E_18))
    .div(ONE_E_18)
    .add(x0.mul(x0).div(ONE_E_18).mul(x0).div(ONE_E_18));
}

function getY(x0: BN, xy: BN, y: BN): BN {
  let i = 0;
  let yPrev: BN;
  let kValue: BN;
  let dy: BN;

  while (i < 255) {
    yPrev = y;
    kValue = f(x0, y);

    if (kValue.lt(xy)) {
      dy = xy.sub(kValue).div(d(x0, y));
      y = y.add(dy);
    } else {
      dy = kValue.sub(xy).div(d(x0, y));
      y = y.sub(dy);
    }

    if (y.gt(yPrev)) {
      if (y.sub(yPrev).lte(new BN(1))) {
        return y;
      }
    } else {
      if (yPrev.sub(y).lte(new BN(1))) {
        return y;
      }
    }

    i++;
  }

  return y;
}

export function subtractFee(poolId: PoolId, amount: BN, ammFees: AmmFees): BN {
  const feeBP = poolId[2]
    ? ammFees.lpFeeStable.add(ammFees.protocolFeeStable)
    : ammFees.lpFeeVolatile.add(ammFees.protocolFeeVolatile);
  const fee = calculateFeeToSubtract(amount, feeBP);
  return amount.sub(fee);
}

export function addFee(poolId: PoolId, amount: BN, ammFees: AmmFees): BN {
  const feeBP = poolId[2]
    ? ammFees.lpFeeStable.add(ammFees.protocolFeeStable)
    : ammFees.lpFeeVolatile.add(ammFees.protocolFeeVolatile);
  const fee = calculateFeeToAdd(amount, feeBP);
  return amount.add(fee);
}

function calculateFeeToSubtract(amount: BN, fee: BN): BN {
  const nominator = amount.mul(fee);
  return roundingUpDivision(nominator, BASIS_POINTS);
}

function calculateFeeToAdd(amount: BN, fee: BN): BN {
  const nominator = amount.mul(fee);
  const denominator = BASIS_POINTS.sub(fee);
  return roundingUpDivision(nominator, denominator);
}

// V2 compatibility functions

/**
 * Get amount out for v2 pools with binned liquidity
 * @param poolMetadata V2 pool metadata
 * @param amountIn Input amount
 * @param swapForY True if swapping X for Y
 * @param feeBasisPoints Fee in basis points
 * @returns Output amount after fees
 */
export function getAmountOutWithFeesV2(
  poolMetadata: PoolMetadataV2,
  amountIn: BN,
  swapForY: boolean,
  feeBasisPoints: BN
): BN {
  // Subtract fee from input amount
  const fee = calculateSwapFeeV2(amountIn, feeBasisPoints);
  const amountInAfterFee = amountIn.sub(fee);

  // Calculate output using v2 binned liquidity math
  return getAmountOutV2(poolMetadata, amountInAfterFee, swapForY);
}

/**
 * Get amount in for v2 pools with binned liquidity
 * @param poolMetadata V2 pool metadata
 * @param amountOut Desired output amount
 * @param swapForY True if swapping X for Y
 * @param feeBasisPoints Fee in basis points
 * @returns Required input amount including fees
 */
export function getAmountInWithFeesV2(
  poolMetadata: PoolMetadataV2,
  amountOut: BN,
  swapForY: boolean,
  feeBasisPoints: BN
): BN {
  // Calculate required input before fees
  const amountInBeforeFee = getAmountInV2(poolMetadata, amountOut, swapForY);

  // Add fee to get total input amount
  const fee = calculateFeeToAdd(amountInBeforeFee, feeBasisPoints);
  return amountInBeforeFee.add(fee);
}

/**
 * Calculate swap amounts for multi-hop routes in v2
 * @param poolsMetadata Array of pool metadata for the route
 * @param amountIn Input amount
 * @param swapDirections Array indicating swap direction for each pool
 * @param fees Array of fee basis points for each pool
 * @returns Array of amounts for each step in the route
 */
export function getAmountsOutV2(
  poolsMetadata: PoolMetadataV2[],
  amountIn: BN,
  swapDirections: boolean[],
  fees: BN[]
): BN[] {
  if (
    poolsMetadata.length !== swapDirections.length ||
    poolsMetadata.length !== fees.length
  ) {
    throw new Error("Arrays must have the same length");
  }

  const amounts: BN[] = [amountIn];
  let currentAmount = amountIn;

  for (let i = 0; i < poolsMetadata.length; i++) {
    currentAmount = getAmountOutWithFeesV2(
      poolsMetadata[i],
      currentAmount,
      swapDirections[i],
      fees[i]
    );
    amounts.push(currentAmount);
  }

  return amounts;
}

/**
 * Calculate required input amounts for multi-hop routes in v2
 * @param poolsMetadata Array of pool metadata for the route
 * @param amountOut Desired output amount
 * @param swapDirections Array indicating swap direction for each pool
 * @param fees Array of fee basis points for each pool
 * @returns Array of amounts for each step in the route
 */
export function getAmountsInV2(
  poolsMetadata: PoolMetadataV2[],
  amountOut: BN,
  swapDirections: boolean[],
  fees: BN[]
): BN[] {
  if (
    poolsMetadata.length !== swapDirections.length ||
    poolsMetadata.length !== fees.length
  ) {
    throw new Error("Arrays must have the same length");
  }

  const amounts: BN[] = new Array(poolsMetadata.length + 1);
  amounts[amounts.length - 1] = amountOut;
  let currentAmount = amountOut;

  for (let i = poolsMetadata.length - 1; i >= 0; i--) {
    currentAmount = getAmountInWithFeesV2(
      poolsMetadata[i],
      currentAmount,
      swapDirections[i],
      fees[i]
    );
    amounts[i] = currentAmount;
  }

  return amounts;
}

/**
 * Calculate proportional amounts for adding liquidity to v2 pools
 * @param poolMetadata V2 pool metadata
 * @param amountDesired Desired amount of one token
 * @param isTokenX True if amountDesired is for token X
 * @returns Required amount of the other token
 */
export function calculateProportionalAmountV2(
  poolMetadata: PoolMetadataV2,
  amountDesired: BN,
  isTokenX: boolean
): BN {
  const {reserves} = poolMetadata;

  if (reserves.x.eq(0) || reserves.y.eq(0)) {
    // If no liquidity exists, any ratio is acceptable
    return new BN(0);
  }

  if (isTokenX) {
    // Calculate required Y amount based on X amount
    return amountDesired.mul(reserves.y).div(reserves.x);
  } else {
    // Calculate required X amount based on Y amount
    return amountDesired.mul(reserves.x).div(reserves.y);
  }
}

/**
 * Validate that amounts are within acceptable slippage for v2 operations
 * @param expectedAmount Expected amount
 * @param actualAmount Actual amount
 * @param slippageBasisPoints Slippage tolerance in basis points
 * @returns True if within slippage tolerance
 */
export function validateSlippageV2(
  expectedAmount: BN,
  actualAmount: BN,
  slippageBasisPoints: BN
): boolean {
  const slippageAmount = expectedAmount
    .mul(slippageBasisPoints)
    .div(BASIS_POINTS);
  const minAmount = expectedAmount.sub(slippageAmount);
  const maxAmount = expectedAmount.add(slippageAmount);

  return actualAmount.gte(minAmount) && actualAmount.lte(maxAmount);
}

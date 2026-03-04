import {BN, AssetId} from "fuels";
import {Amounts} from "../model";

/**
 * Calculate swap output using constant product formula with fees
 * Formula: amountOut = (amountIn * (10000 - fee) / 10000 * reserveOut) / (reserveIn + amountIn * (10000 - fee) / 10000)
 */
export function calculateSwapOutput(
  amountIn: BN,
  reserveIn: BN,
  reserveOut: BN,
  feeBasisPoints: BN
): BN {
  const amountInAfterFee = amountIn
    .mul(new BN(10000).sub(feeBasisPoints))
    .div(new BN(10000));

  return amountInAfterFee.mul(reserveOut).div(reserveIn.add(amountInAfterFee));
}

/**
 * Get swap parameters for a pool hop
 * Determines output asset, swap direction, and reserves based on input asset
 */
export function getSwapParameters(
  currentAsset: AssetId,
  assetX: AssetId,
  assetY: AssetId,
  reserves: Amounts
): {
  outputAsset: AssetId;
  swapForY: boolean;
  inputReserve: BN;
  outputReserve: BN;
} {
  const swapForY = assetX.bits === currentAsset.bits;
  const outputAsset = swapForY ? assetY : assetX;
  const inputReserve = swapForY ? reserves.x : reserves.y;
  const outputReserve = swapForY ? reserves.y : reserves.x;

  return {
    outputAsset,
    swapForY,
    inputReserve,
    outputReserve,
  };
}

/**
 * Validate reserves are not zero
 */
export function validateReserves(reserveIn: BN, reserveOut: BN): void {
  if (reserveIn.eq(0) || reserveOut.eq(0)) {
    throw new Error("Pool has no liquidity");
  }
}

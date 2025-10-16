import {PoolId} from "mira-dex-ts";

/**
 * Calculate the total fee percentage across all pools in a route
 */
export function calculateFeePercent(pools?: Array<{poolId: PoolId}>): number {
  return (
    pools?.reduce((acc, {poolId}) => {
      return acc + (poolId[2] ? 0.05 : 0.3);
    }, 0) ?? 0
  );
}

/**
 * Calculate the fee value in the sell asset
 */
export function calculateFeeValue(
  sellValue: string,
  feePercent: number,
  decimals: number
): string {
  if (!sellValue || !decimals) return "0";
  const sellNum = parseFloat(sellValue);
  const raw = (feePercent / 100) * sellNum;
  return raw.toFixed(decimals);
}

/**
 * Calculate the preview price (buy amount / sell amount)
 */
export function calculatePreviewPrice(
  sellAmount: string,
  buyAmount: string
): number | undefined {
  const s = parseFloat(sellAmount);
  const b = parseFloat(buyAmount);
  if (isNaN(s) || isNaN(b) || s === 0) return undefined;
  return b / s;
}

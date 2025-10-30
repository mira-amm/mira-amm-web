/**
 * Pool TVL Calculation Utilities
 *
 * Handles TVL calculation for both V1 and V2 pools.
 * V2 pools require dynamic calculation using current prices to avoid stale values.
 */

/**
 * Calculate the TVL (Total Value Locked) for a pool
 *
 * For V2 pools (protocolVersion === 2):
 * - Calculates TVL dynamically using: reserve0 * price0 + reserve1 * price1
 * - This ensures the TVL is always up-to-date with current market prices
 * - V2 pool tvlUSD from indexer can be stale since it only updates on pool actions
 *
 * For V1 pools:
 * - Uses the tvlUSD from the indexer directly
 * - V1 pools update tvlUSD on every swap, so it's reliable
 *
 * @param params - Pool data required for TVL calculation
 * @param params.reserve0Decimal - Reserve amount of token 0 in decimal format
 * @param params.reserve1Decimal - Reserve amount of token 1 in decimal format
 * @param params.price0 - Current USD price of token 0
 * @param params.price1 - Current USD price of token 1
 * @param params.protocolVersion - Protocol version (1 for V1, 2 for V2)
 * @param params.indexerTvlUSD - TVL value from the indexer (used for V1 pools)
 * @returns Calculated TVL in USD
 *
 * @example
 * ```typescript
 * // V2 pool - calculates dynamically
 * const tvl = calculatePoolTVL({
 *   reserve0Decimal: 1000.5,
 *   reserve1Decimal: 2000.75,
 *   price0: 1.5,
 *   price1: 2.0,
 *   protocolVersion: 2,
 *   indexerTvlUSD: 5000 // Ignored for V2
 * });
 * // Result: 1000.5 * 1.5 + 2000.75 * 2.0 = 5502.25
 *
 * // V1 pool - uses indexer value
 * const tvl = calculatePoolTVL({
 *   reserve0Decimal: 1000,
 *   reserve1Decimal: 2000,
 *   price0: 1.5,
 *   price1: 2.0,
 *   protocolVersion: 1,
 *   indexerTvlUSD: 5500
 * });
 * // Result: 5500 (from indexer)
 * ```
 */
export function calculatePoolTVL(params: {
  reserve0Decimal: number | string;
  reserve1Decimal: number | string;
  price0: number | string;
  price1: number | string;
  protocolVersion: number;
  indexerTvlUSD: number | string;
}): number {
  const {
    reserve0Decimal,
    reserve1Decimal,
    price0,
    price1,
    protocolVersion,
    indexerTvlUSD,
  } = params;

  // For V2 pools, calculate TVL dynamically using current prices
  if (protocolVersion === 2) {
    const reserve0 =
      typeof reserve0Decimal === "string"
        ? parseFloat(reserve0Decimal) || 0
        : reserve0Decimal;
    const reserve1 =
      typeof reserve1Decimal === "string"
        ? parseFloat(reserve1Decimal) || 0
        : reserve1Decimal;
    const p0 = typeof price0 === "string" ? parseFloat(price0) || 0 : price0;
    const p1 = typeof price1 === "string" ? parseFloat(price1) || 0 : price1;

    return reserve0 * p0 + reserve1 * p1;
  }

  // For V1 pools, use the indexer's tvlUSD value
  return typeof indexerTvlUSD === "string"
    ? parseFloat(indexerTvlUSD)
    : indexerTvlUSD;
}

/**
 * Calculate APR (Annual Percentage Rate) for a pool
 *
 * @param fees24h - Total fees earned in the last 24 hours (in USD)
 * @param tvlUSD - Total Value Locked in USD
 * @returns APR as a percentage (e.g., 25.5 for 25.5%)
 *
 * @example
 * ```typescript
 * const apr = calculatePoolAPR(100, 10000);
 * // Result: (100 / 10000) * 365 * 100 = 36.5%
 * ```
 */
export function calculatePoolAPR(fees24h: number, tvlUSD: number): number {
  // If TVL is 0, APR should be 0 to avoid infinity
  if (tvlUSD <= 0) {
    return 0;
  }
  return (fees24h / tvlUSD) * 365 * 100;
}

/**
 * Type guard to check if a pool is V2
 *
 * @param protocolVersion - Protocol version number
 * @returns true if the pool is V2, false otherwise
 */
export function isV2Pool(protocolVersion: number): boolean {
  return protocolVersion === 2;
}

/**
 * Type guard to check if a pool is V1
 *
 * @param protocolVersion - Protocol version number
 * @returns true if the pool is V1, false otherwise
 */
export function isV1Pool(protocolVersion: number): boolean {
  return protocolVersion === 1;
}

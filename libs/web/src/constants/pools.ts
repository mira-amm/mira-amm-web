/**
 * Pool Type Constants and Type Definitions
 *
 * This module provides centralized, type-safe constants for pool types throughout the application.
 * All pool type string literals should reference these constants to ensure consistency and type safety.
 */

/**
 * Base pool type categories
 */
export const POOL_TYPES = {
  STABLE: "stable",
  VOLATILE: "volatile",
  CONCENTRATED: "concentrated",
} as const;

/**
 * Display names for pool types
 */
export const POOL_TYPE_LABELS = {
  STABLE: "Stable",
  VOLATILE: "Volatile",
  CONCENTRATED: "Concentrated",
  STABLE_POOL: "Stable pool",
  VOLATILE_POOL: "Volatile pool",
  CONCENTRATED_POOL: "Concentrated pool",
} as const;

/**
 * Version-specific pool type variants
 */
export const POOL_VERSIONS = {
  V1: "v1",
  V2: "v2",
} as const;

/**
 * Version-specific pool type combinations
 */
export const VERSIONED_POOL_TYPES = {
  V1_STABLE: "v1-stable",
  V1_VOLATILE: "v1-volatile",
  V2_CONCENTRATED: "v2-concentrated",
  V2_STABLE: "v2-stable",
  V2_VOLATILE: "v2-volatile",
} as const;

/**
 * Fee tier constants for different pool types
 */
export const POOL_FEE_TIERS = {
  STABLE: "0.05%",
  VOLATILE: "0.3%",
} as const;

/**
 * Fee tier values (as basis points) for calculations
 */
export const POOL_FEE_BPS = {
  STABLE: 5, // 0.05% = 5 basis points
  VOLATILE: 30, // 0.30% = 30 basis points
} as const;

/**
 * Type definitions for type safety
 */

/**
 * Base pool type union
 */
export type PoolType = (typeof POOL_TYPES)[keyof typeof POOL_TYPES];

/**
 * Pool type labels union
 */
export type PoolTypeLabel =
  (typeof POOL_TYPE_LABELS)[keyof typeof POOL_TYPE_LABELS];

/**
 * Pool version union
 */
export type PoolVersion = (typeof POOL_VERSIONS)[keyof typeof POOL_VERSIONS];

/**
 * Versioned pool type union
 */
export type VersionedPoolType =
  (typeof VERSIONED_POOL_TYPES)[keyof typeof VERSIONED_POOL_TYPES];

/**
 * All possible pool type values (base + versioned)
 */
export type AnyPoolType = PoolType | VersionedPoolType | PoolVersion;

/**
 * Fee tier union
 */
export type PoolFeeTier = (typeof POOL_FEE_TIERS)[keyof typeof POOL_FEE_TIERS];

/**
 * Helper functions
 */

/**
 * Get the display label for a pool type based on stability
 */
export function getPoolTypeLabel(isStable: boolean): string {
  return isStable ? POOL_TYPE_LABELS.STABLE : POOL_TYPE_LABELS.VOLATILE;
}

/**
 * Get the pool type display label with "pool" suffix
 */
export function getPoolTypeLabelWithSuffix(isStable: boolean): string {
  return isStable
    ? POOL_TYPE_LABELS.STABLE_POOL
    : POOL_TYPE_LABELS.VOLATILE_POOL;
}

/**
 * Get the fee tier for a pool type
 */
export function getPoolFeeTier(isStable: boolean): PoolFeeTier {
  return isStable ? POOL_FEE_TIERS.STABLE : POOL_FEE_TIERS.VOLATILE;
}

/**
 * Get the fee tier description with percentage
 */
export function getPoolFeeDescription(isStable: boolean): string {
  const feeText = getPoolFeeTier(isStable);
  return `${feeText} fee tier`;
}

/**
 * Get pool description combining type and fee
 */
export function getPoolDescription(isStable: boolean): string {
  const typeLabel = getPoolTypeLabel(isStable);
  const feeText = getPoolFeeTier(isStable);
  return `${typeLabel}: ${feeText}`;
}

/**
 * Get fee basis points for a pool type
 */
export function getPoolFeeBps(isStable: boolean): number {
  return isStable ? POOL_FEE_BPS.STABLE : POOL_FEE_BPS.VOLATILE;
}

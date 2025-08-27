import {BN} from "fuels";
import {PoolId} from "mira-dex-ts";

export type PoolType = "v1" | "v2";
export type UnifiedPoolId = PoolId | BN;

/**
 * Detects whether a pool ID is v1 (tuple-based) or v2 (numeric)
 *
 * v1 pools use tuple format: [AssetId, AssetId, boolean]
 * v2 pools use numeric format: BN
 *
 * @param poolId - The pool identifier to check
 * @returns "v1" for tuple-based pool IDs, "v2" for numeric pool IDs
 *
 * @example
 * ```typescript
 * // v1 pool ID (tuple)
 * const v1PoolId: PoolId = [assetA, assetB, false];
 * detectPoolType(v1PoolId); // returns "v1"
 *
 * // v2 pool ID (numeric)
 * const v2PoolId = new BN("12345");
 * detectPoolType(v2PoolId); // returns "v2"
 * ```
 */
export function detectPoolType(poolId: UnifiedPoolId): PoolType {
  // Check if it's a BN instance (v2)
  if (poolId instanceof BN) {
    return "v2";
  }

  // Check if it's an array (v1 tuple format)
  if (Array.isArray(poolId) && poolId.length === 3) {
    return "v1";
  }

  // Default to v1 for backward compatibility
  return "v1";
}

/**
 * Type guard to check if a pool ID is v1 format
 *
 * @param poolId - The pool identifier to check
 * @returns true if the pool ID is v1 format (tuple)
 */
export function isV1PoolId(poolId: UnifiedPoolId): poolId is PoolId {
  return Array.isArray(poolId) && poolId.length === 3;
}

/**
 * Type guard to check if a pool ID is v2 format
 *
 * @param poolId - The pool identifier to check
 * @returns true if the pool ID is v2 format (BN)
 */
export function isV2PoolId(poolId: UnifiedPoolId): poolId is BN {
  return detectPoolType(poolId) === "v2";
}

/**
 * Converts a unified pool ID to a string representation for display/storage
 *
 * @param poolId - The pool identifier to convert
 * @returns String representation of the pool ID
 */
export function poolIdToString(poolId: UnifiedPoolId): string {
  if (isV2PoolId(poolId)) {
    return poolId.toString();
  }

  if (isV1PoolId(poolId)) {
    return `${poolId[0].bits}-${poolId[1].bits}-${poolId[2]}`;
  }

  // Handle unknown formats - check if it's a string or other type
  if (typeof poolId === "string") {
    return poolId;
  }

  return "unknown";
}

/**
 * Parses a pool key string back into a UnifiedPoolId
 *
 * @param poolKey - The string representation of the pool ID
 * @returns The parsed pool ID
 * @throws Error if the pool key format is invalid
 */
export function parsePoolKey(poolKey: string): UnifiedPoolId {
  // Try to parse as v2 pool ID (numeric)
  if (/^\d+$/.test(poolKey)) {
    return new BN(poolKey);
  }

  // Try to parse as v1 pool ID (asset1-asset2-isStable format)
  const v1Match = poolKey.match(/^(.+)-(.+)-(true|false)$/);
  if (v1Match) {
    const [, asset1Bits, asset2Bits, isStableStr] = v1Match;
    const isStable = isStableStr === "true";

    // Create AssetId objects from the bits
    const asset1 = {bits: asset1Bits};
    const asset2 = {bits: asset2Bits};

    return [asset1, asset2, isStable] as PoolId;
  }

  throw new Error(`Invalid pool key format: ${poolKey}`);
}

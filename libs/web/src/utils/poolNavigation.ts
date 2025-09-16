import {
  detectPoolType,
  UnifiedPoolId,
  poolIdToString,
} from "./poolTypeDetection";

/**
 * Generates the appropriate navigation URL for a pool based on its type
 *
 * @param poolId - The unified pool identifier
 * @param action - The action to perform ('add' | 'view' | 'manage')
 * @returns The appropriate URL path for the pool
 */
export function getPoolNavigationUrl(
  poolId: UnifiedPoolId,
  action: "add" | "view" | "manage" | "remove" = "add"
): string {
  const poolType = detectPoolType(poolId);
  const poolKey = poolIdToString(poolId);

  switch (action) {
    case "add":
      if (poolType === "v2") {
        // Route to v2-specific add liquidity page
        return `/liquidity/add-v2?pool=${poolKey}`;
      } else {
        // Route to v1 add liquidity page
        return `/liquidity/add?pool=${poolKey}`;
      }

    case "view":
      if (poolType === "v2") {
        // Route to v2-specific pool view page
        return `/liquidity/pool-v2/${poolKey}`;
      } else {
        // Route to v1 pool view page
        return `/liquidity/position?pool=${poolKey}`;
      }

    case "manage":
      if (poolType === "v2") {
        // Route to v2-specific position management
        return `/liquidity/manage-v2?pool=${poolKey}`;
      } else {
        // Route to v1 position management
        return `/liquidity/position?pool=${poolKey}`;
      }

    case "remove":
      // Route to unified remove-liquidity page which handles v1 vs v2 internally
      return `/liquidity/remove?pool=${poolKey}`;

    default:
      // Fallback to add liquidity
      return getPoolNavigationUrl(poolId, "add");
  }
}

/**
 * Determines if a pool should use v2-specific UI components
 *
 * @param poolId - The unified pool identifier
 * @returns true if the pool should use v2 UI components
 */
export function shouldUseV2UI(poolId: UnifiedPoolId): boolean {
  return detectPoolType(poolId) === "v2";
}

/**
 * Gets the pool type display name for UI purposes
 *
 * @param poolId - The unified pool identifier
 * @returns Human-readable pool type name
 */
export function getPoolTypeDisplayName(poolId: UnifiedPoolId): string {
  const poolType = detectPoolType(poolId);

  switch (poolType) {
    case "v1":
      return "Traditional AMM";
    case "v2":
      return "Concentrated Liquidity";
    default:
      return "Unknown";
  }
}

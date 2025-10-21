// Centralizes parse + type detection + safe fallbacks.
import {UnifiedPoolId} from "@/src/hooks";
import {parsePoolKey, detectPoolType} from "@/src/utils/poolTypeDetection";

type PoolRouterProps = {
  pool: string | undefined;
  renderV1: (args: {
    poolKey: string | undefined;
    unifiedPoolId?: UnifiedPoolId;
  }) => React.ReactNode;
  renderV2: (args: {
    poolKey: string | undefined;
    unifiedPoolId: UnifiedPoolId;
  }) => React.ReactNode;
};

export function PoolRouter({pool, renderV1, renderV2}: PoolRouterProps) {
  // Default to v1 if no pool key provided
  if (!pool) {
    return renderV1({poolKey: undefined});
  }

  try {
    const unifiedPoolId = parsePoolKey(pool);
    const poolType = detectPoolType(unifiedPoolId);

    if (poolType === "v2") {
      return renderV2({poolKey: pool, unifiedPoolId});
    }

    // Default to v1 if not v2
    return renderV1({poolKey: pool, unifiedPoolId});
  } catch (error) {
    console.error("Failed to parse/detect pool:", error);
    // Always fall back to v1 on error
    return renderV1({poolKey: pool});
  }
}

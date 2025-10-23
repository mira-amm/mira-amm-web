// Centralizes parse + type detection + safe fallbacks.
// This is a Server Component that handles validation and routing
import {UnifiedPoolId} from "@/src/hooks";
import {parsePoolKey, detectPoolType} from "@/src/utils/poolTypeDetection";
import {redirect} from "next/navigation";

type PoolRouterProps = {
  pool: string | undefined;
  renderV1: (args: {
    poolKey: string | undefined;
    unifiedPoolId?: UnifiedPoolId;
  }) => React.ReactNode;
  renderV2: (args: {
    poolKey: string;
    unifiedPoolIdString: string;
  }) => React.ReactNode;
};

export function PoolRouter({pool, renderV1, renderV2}: PoolRouterProps) {
  // Default to v1 if no pool key provided
  if (!pool) {
    return renderV1({poolKey: undefined});
  }

  // Server-side validation: redirect if pool is invalid
  let unifiedPoolId: UnifiedPoolId;
  try {
    unifiedPoolId = parsePoolKey(pool);
    // Validate that we can detect the pool type
    detectPoolType(unifiedPoolId);
  } catch (error) {
    console.error("Invalid pool key, redirecting to /liquidity:", error);
    redirect("/liquidity");
  }

  // Parse succeeded, now route based on pool type
  const poolType = detectPoolType(unifiedPoolId);

  if (poolType === "v2") {
    // For V2, serialize the BN to a string to pass across Server/Client boundary
    // Client component will deserialize it back to BN
    const unifiedPoolIdString = unifiedPoolId.toString();
    return renderV2({poolKey: pool, unifiedPoolIdString});
  }

  // Default to v1 if not v2
  return renderV1({poolKey: pool, unifiedPoolId});
}

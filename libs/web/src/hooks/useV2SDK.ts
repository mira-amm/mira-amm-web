/**
 * React hooks for V2 SDK integration
 */

import {useState, useEffect, useCallback, useMemo} from "react";
import {
  getSDK,
  SDKUtils,
  SDKHooks,
  V2_FEATURE_FLAGS,
  isMockMode,
  resetSDK,
  inspectSDKState,
} from "@/src/utils/sdkIntegration";

/**
 * Main hook for V2 SDK functionality
 */
export function useV2SDK() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sdk = useMemo(() => {
    try {
      return getSDK();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize SDK");
      return null;
    }
  }, []);

  useEffect(() => {
    if (sdk) {
      setIsInitialized(true);
      setError(null);
    }
  }, [sdk]);

  const config = SDKHooks.useSDKConfig();

  const reset = useCallback(() => {
    if (config.canReset) {
      resetSDK();
      setIsInitialized(false);
      // Re-initialize
      setTimeout(() => setIsInitialized(true), 100);
    }
  }, [config.canReset]);

  const inspect = useCallback(() => {
    if (config.canInspect) {
      return inspectSDKState();
    }
    return null;
  }, [config.canInspect]);

  return {
    sdk,
    isInitialized,
    error,
    config,
    reset,
    inspect,
    utils: SDKUtils,
  };
}

/**
 * Hook for managing V2 liquidity operations
 */
export function useV2Liquidity(poolId?: string) {
  const {sdk, isInitialized, utils} = useV2SDK();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLiquidity = useCallback(
    async (params: {
      amountADesired: string;
      amountBDesired: string;
      amountAMin: string;
      amountBMin: string;
      deadline: string;
      activeIdDesired?: string;
      idSlippage?: string;
      deltaIds?: any[];
      distributionX?: string[];
      distributionY?: string[];
    }) => {
      if (!poolId || !isInitialized) {
        throw new Error("Pool ID required and SDK must be initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await utils.addLiquidity({
          poolId: poolId as any,
          ...params,
        });
        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to add liquidity";
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [poolId, isInitialized, utils]
  );

  const removeLiquidity = useCallback(
    async (params: {
      binIds: string[];
      amountAMin: string;
      amountBMin: string;
      deadline: string;
    }) => {
      if (!poolId || !isInitialized) {
        throw new Error("Pool ID required and SDK must be initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await utils.removeLiquidity({
          poolId: poolId as any,
          ...params,
        });
        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to remove liquidity";
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [poolId, isInitialized, utils]
  );

  return {
    addLiquidity,
    removeLiquidity,
    isLoading,
    error,
    isEnabled: V2_FEATURE_FLAGS.enableV2Liquidity,
  };
}

/**
 * Hook for V2 pool creation
 */
export function useV2CreatePool() {
  const {sdk, isInitialized, utils} = useV2SDK();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPool = useCallback(
    async (params: {
      pool: any; // PoolInput
      activeId: string;
    }) => {
      if (!isInitialized) {
        throw new Error("SDK must be initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await utils.createPool(params);
        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to create pool";
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, utils]
  );

  return {
    createPool,
    isLoading,
    error,
    isEnabled: V2_FEATURE_FLAGS.enableV2CreatePool,
  };
}

/**
 * Hook for V2 position management
 */
export function useV2Positions(poolId?: string, userAddress?: string) {
  const {sdk, isInitialized} = useV2SDK();
  const [positions, setPositions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!poolId || !userAddress || !isInitialized) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await SDKHooks.getUserPositions(poolId, userAddress);
      setPositions(result);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to fetch positions";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [poolId, userAddress, isInitialized]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const refreshPositions = useCallback(() => {
    fetchPositions();
  }, [fetchPositions]);

  return {
    positions,
    isLoading,
    error,
    refreshPositions,
    isEnabled: V2_FEATURE_FLAGS.enableV2PositionManagement,
  };
}

/**
 * Hook for V2 pool metrics
 */
export function useV2PoolMetrics(poolId?: string) {
  const {sdk, isInitialized} = useV2SDK();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!poolId || !isInitialized) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await SDKHooks.getConcentratedLiquidityMetrics(poolId);
      setMetrics(result);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to fetch metrics";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [poolId, isInitialized]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const refreshMetrics = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refreshMetrics,
    isEnabled: V2_FEATURE_FLAGS.enableV2Metrics,
  };
}

/**
 * Hook for V2 pool data
 */
export function useV2PoolData(poolId?: string) {
  const {sdk, isInitialized, utils} = useV2SDK();
  const [poolData, setPoolData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPoolData = useCallback(async () => {
    if (!poolId || !isInitialized) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [metadata, activeBin] = await Promise.all([
        utils.getPoolMetadata(poolId as any),
        utils.getActiveBin(poolId as any),
      ]);

      setPoolData({
        metadata,
        activeBin,
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to fetch pool data";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [poolId, isInitialized, utils]);

  useEffect(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  const refreshPoolData = useCallback(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  return {
    poolData,
    isLoading,
    error,
    refreshPoolData,
  };
}

/**
 * Hook for V2 bin operations
 */
export function useV2BinOperations(poolId?: string) {
  const {sdk, isInitialized, utils} = useV2SDK();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBinLiquidity = useCallback(
    async (binId: string) => {
      if (!poolId || !isInitialized) {
        throw new Error("Pool ID required and SDK must be initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await utils.getBinLiquidity(poolId as any, binId);
        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to get bin liquidity";
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [poolId, isInitialized, utils]
  );

  const getBinRange = useCallback(
    async (startBinId: string, endBinId: string) => {
      if (!poolId || !isInitialized) {
        throw new Error("Pool ID required and SDK must be initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await utils.getBinRange(
          poolId as any,
          startBinId,
          endBinId
        );
        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to get bin range";
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [poolId, isInitialized, utils]
  );

  return {
    getBinLiquidity,
    getBinRange,
    isLoading,
    error,
  };
}

/**
 * Hook for development utilities (mock mode only)
 */
export function useV2DevUtils() {
  const {config, reset, inspect} = useV2SDK();

  const [debugInfo, setDebugInfo] = useState<any>(null);

  const getDebugInfo = useCallback(() => {
    if (config.canInspect) {
      const info = inspect();
      setDebugInfo(info);
      return info;
    }
    return null;
  }, [config.canInspect, inspect]);

  const resetState = useCallback(() => {
    if (config.canReset) {
      reset();
      setDebugInfo(null);
    }
  }, [config.canReset, reset]);

  return {
    isMockMode: config.isMockMode,
    canReset: config.canReset,
    canInspect: config.canInspect,
    debugInfo,
    getDebugInfo,
    resetState,
    features: config.features,
  };
}

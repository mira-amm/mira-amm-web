/**
 * SDK Integration utilities for seamless switching between mock and real SDK
 */

import {BN} from "fuels";
import type {
  MiraAmmV2,
  ReadonlyMiraAmmV2,
  PoolIdV2,
  PoolMetadataV2,
  BinLiquidityInfo,
  Asset,
  AssetId,
  Address,
  TxParams,
  PrepareRequestOptions,
} from "../../../ts-sdk";

// Mock SDK imports
import {
  MockMiraAmmV2,
  MockReadonlyMiraAmmV2,
  MockStateManager,
  MockSDKConfig,
  createDevelopmentMockSDK,
} from "../../../ts-sdk";

// Performance monitoring
import {SDKPerformanceUtils, performanceMonitor} from "./performanceMonitor";

/**
 * Feature flags for v2 functionality
 */
export const V2_FEATURE_FLAGS = {
  // Enable mock mode for all v2 operations
  enableMockMode:
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_V2_MOCK === "true",

  // Enable specific v2 features
  enableV2Liquidity: true,
  enableV2CreatePool: true,
  enableV2PositionManagement: true,
  enableV2Metrics: true,

  // Debug flags
  enableDebugLogging: process.env.NODE_ENV === "development",
  enableStateInspection: process.env.NODE_ENV === "development",
} as const;

/**
 * Unified SDK interface that works with both mock and real implementations
 */
export interface UnifiedSDK {
  // Write operations
  writeSDK: MiraAmmV2 | MockMiraAmmV2;

  // Read operations
  readSDK: ReadonlyMiraAmmV2 | MockReadonlyMiraAmmV2;

  // State management (only available in mock mode)
  stateManager?: MockStateManager;

  // Configuration
  config: any;

  // Utility methods
  isMockMode: boolean;
  reset?: () => void;
  inspect?: () => any;
}

/**
 * SDK Factory for creating unified SDK instances
 */
class SDKIntegrationFactory {
  private static instance: SDKIntegrationFactory;
  private currentSDK: UnifiedSDK | null = null;

  private constructor() {}

  static getInstance(): SDKIntegrationFactory {
    if (!SDKIntegrationFactory.instance) {
      SDKIntegrationFactory.instance = new SDKIntegrationFactory();
    }
    return SDKIntegrationFactory.instance;
  }

  /**
   * Create or get the current SDK instance
   */
  getSDK(): UnifiedSDK {
    if (!this.currentSDK) {
      this.currentSDK = this.createSDK();
    }
    return this.currentSDK;
  }

  /**
   * Create a new SDK instance based on feature flags
   */
  private createSDK(): UnifiedSDK {
    if (V2_FEATURE_FLAGS.enableMockMode) {
      return this.createMockSDK();
    } else {
      return this.createRealSDK();
    }
  }

  /**
   * Create mock SDK instance
   */
  private createMockSDK(): UnifiedSDK {
    const mockConfig: Partial<MockSDKConfig> = {
      enablePersistence: true,
      persistenceKey: "mira_v2_mock_state",
      defaultFailureRate: 0.02, // 2% failure rate for realistic testing
      defaultLatencyMs: 1500,
      enableRealisticGas: true,
      enablePriceImpact: true,
      enableSlippageSimulation: true,
    };

    const {writeSDK, readSDK, stateManager, config} =
      createDevelopmentMockSDK(mockConfig);

    const sdk: UnifiedSDK = {
      writeSDK,
      readSDK,
      stateManager,
      config,
      isMockMode: true,
      reset: () => {
        stateManager.reset();
        if (V2_FEATURE_FLAGS.enableDebugLogging) {
          console.log("Mock SDK state reset");
        }
      },
      inspect: () => {
        if (V2_FEATURE_FLAGS.enableStateInspection) {
          return {
            pools: Array.from(stateManager.pools.entries()),
            positions: Array.from(stateManager.positions.entries()),
            transactions: stateManager.transactions.slice(-10), // Last 10 transactions
          };
        }
        return null;
      },
    };

    if (V2_FEATURE_FLAGS.enableDebugLogging) {
      console.log("Created mock SDK instance", {config: mockConfig});
    }

    return sdk;
  }

  /**
   * Create real SDK instance (placeholder for future implementation)
   */
  private createRealSDK(): UnifiedSDK {
    // TODO: Implement real SDK integration when contracts are deployed
    throw new Error(
      "Real SDK integration not yet implemented. Please enable mock mode."
    );
  }

  /**
   * Reset the current SDK instance
   */
  reset(): void {
    if (this.currentSDK?.reset) {
      this.currentSDK.reset();
    }
    this.currentSDK = null;
  }

  /**
   * Switch between mock and real SDK
   */
  switchMode(useMock: boolean): UnifiedSDK {
    // Update feature flag
    (V2_FEATURE_FLAGS as any).enableMockMode = useMock;

    // Reset current instance to force recreation
    this.currentSDK = null;

    return this.getSDK();
  }
}

/**
 * Get the current SDK instance
 */
export function getSDK(): UnifiedSDK {
  return SDKIntegrationFactory.getInstance().getSDK();
}

/**
 * Reset the SDK state (useful for testing)
 */
export function resetSDK(): void {
  SDKIntegrationFactory.getInstance().reset();
}

/**
 * Switch between mock and real SDK modes
 */
export function switchSDKMode(useMock: boolean): UnifiedSDK {
  return SDKIntegrationFactory.getInstance().switchMode(useMock);
}

/**
 * Check if we're currently in mock mode
 */
export function isMockMode(): boolean {
  return V2_FEATURE_FLAGS.enableMockMode;
}

/**
 * Caching layer for frequently accessed pool data
 */
class PoolDataCache {
  private cache = new Map<
    string,
    {data: any; timestamp: number; ttl: number}
  >();
  private readonly DEFAULT_TTL = 30000; // 30 seconds

  /**
   * Get cached data or fetch if not available/expired
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }

    // Fetch fresh data
    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl,
    });

    return data;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries for a pool
   */
  invalidatePool(poolId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
      key.includes(poolId)
    );
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    return {
      totalEntries: entries.length,
      validEntries: entries.filter(
        ([, entry]) => now - entry.timestamp < entry.ttl
      ).length,
      expiredEntries: entries.filter(
        ([, entry]) => now - entry.timestamp >= entry.ttl
      ).length,
      cacheHitRate: this.calculateHitRate(),
    };
  }

  private hitCount = 0;
  private missCount = 0;

  private calculateHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? (this.hitCount / total) * 100 : 0;
  }

  private recordHit(): void {
    this.hitCount++;
  }

  private recordMiss(): void {
    this.missCount++;
  }
}

// Global cache instance
const poolDataCache = new PoolDataCache();

/**
 * Inspect current SDK state (development only)
 */
export function inspectSDKState(): any {
  const sdk = getSDK();
  return sdk.inspect?.() || null;
}

/**
 * Debugging utilities for state inspection
 */
export const DebugUtils = {
  /**
   * Get detailed pool state information
   */
  async getPoolDebugInfo(poolId: string) {
    const sdk = getSDK();

    if (!sdk.isMockMode) {
      return {error: "Debug info only available in mock mode"};
    }

    try {
      const [metadata, activeBin, binRange] = await Promise.all([
        SDKUtils.getPoolMetadata(poolId as any),
        SDKUtils.getActiveBin(poolId as any),
        SDKUtils.getBinRange(poolId as any, "0", "20"),
      ]);

      const state = sdk.inspect?.();
      const poolState = state?.pools?.find(
        ([id]: [string, any]) => id === poolId
      )?.[1];

      return {
        poolId,
        metadata,
        activeBin,
        binRange: binRange?.slice(0, 5), // First 5 bins for brevity
        internalState: poolState
          ? {
              totalReserves: {
                x: poolState.totalReserves?.x?.toString(),
                y: poolState.totalReserves?.y?.toString(),
              },
              binCount: poolState.bins?.size,
              createdAt: poolState.createdAt,
              lastUpdated: poolState.lastUpdated,
            }
          : null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to get debug info",
        poolId,
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Get user position debug information
   */
  async getUserDebugInfo(poolId: string, userAddress: string) {
    const sdk = getSDK();

    if (!sdk.isMockMode) {
      return {error: "Debug info only available in mock mode"};
    }

    try {
      const positions = await SDKHooks.getUserPositions(poolId, userAddress);
      const state = sdk.inspect?.();
      const userPositions = state?.positions?.find(
        ([addr]: [string, any]) => addr === userAddress
      )?.[1];

      return {
        poolId,
        userAddress,
        positions,
        internalState: userPositions
          ? {
              poolCount: userPositions.size,
              pools: Array.from(userPositions.keys()),
            }
          : null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get user debug info",
        poolId,
        userAddress,
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Get transaction history debug information
   */
  getTransactionDebugInfo(limit: number = 10) {
    const sdk = getSDK();

    if (!sdk.isMockMode) {
      return {error: "Debug info only available in mock mode"};
    }

    const state = sdk.inspect?.();
    const transactions = state?.transactions || [];

    return {
      totalTransactions: transactions.length,
      recentTransactions: transactions.slice(-limit).map((tx: any) => ({
        id: tx.transactionId,
        type: tx.type,
        success: tx.success,
        timestamp: tx.timestamp,
        gasUsed: tx.gasUsed?.toString(),
        error: tx.error,
      })),
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Performance metrics for mock operations
   */
  getPerformanceMetrics() {
    const sdk = getSDK();

    if (!sdk.isMockMode) {
      return {error: "Performance metrics only available in mock mode"};
    }

    const state = sdk.inspect?.();
    const transactions = state?.transactions || [];

    // Calculate average response times
    const responseTimes = transactions
      .filter((tx: any) => tx.responseTime)
      .map((tx: any) => tx.responseTime);

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a: number, b: number) => a + b, 0) /
          responseTimes.length
        : 0;

    return {
      totalOperations: transactions.length,
      averageResponseTime: avgResponseTime,
      successRate:
        transactions.length > 0
          ? (transactions.filter((tx: any) => tx.success).length /
              transactions.length) *
            100
          : 0,
      poolCount: state?.pools?.length || 0,
      userCount: state?.positions?.length || 0,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Export current state for debugging
   */
  exportState() {
    const sdk = getSDK();

    if (!sdk.isMockMode) {
      return {error: "State export only available in mock mode"};
    }

    const state = sdk.inspect?.();

    return {
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
      state: {
        pools: state?.pools || [],
        positions: state?.positions || [],
        transactions: (state?.transactions || []).slice(-50), // Last 50 transactions
      },
    };
  },

  /**
   * Validate state consistency
   */
  validateStateConsistency() {
    const sdk = getSDK();

    if (!sdk.isMockMode) {
      return {error: "State validation only available in mock mode"};
    }

    const state = sdk.inspect?.();
    const issues: string[] = [];

    // Check for basic consistency issues
    if (state?.pools) {
      state.pools.forEach(([poolId, pool]: [string, any]) => {
        if (!pool.metadata) {
          issues.push(`Pool ${poolId} missing metadata`);
        }
        if (!pool.bins || pool.bins.size === 0) {
          issues.push(`Pool ${poolId} has no bins`);
        }
        if (!pool.activeBinId) {
          issues.push(`Pool ${poolId} missing active bin ID`);
        }
      });
    }

    return {
      isValid: issues.length === 0,
      issues,
      checkedAt: new Date().toISOString(),
    };
  },
};

/**
 * Helper methods for common testing patterns
 */
export const TestingPatterns = {
  /**
   * Set up a basic liquidity position for testing
   */
  async setupBasicPosition(poolId: string, userAddress: string) {
    const sdk = getSDK();

    if (!sdk.isMockMode) {
      throw new Error("Testing patterns only available in mock mode");
    }

    try {
      // Add liquidity to create a basic position
      const result = await SDKUtils.addLiquidity({
        poolId: poolId as any,
        amountADesired: "1000000000000000000", // 1 ETH
        amountBDesired: "2000000000", // 2000 USDC
        amountAMin: "900000000000000000", // 0.9 ETH min
        amountBMin: "1800000000", // 1800 USDC min
        deadline: Math.floor(Date.now() / 1000 + 3600).toString(),
        activeIdDesired: "8388608", // Default active bin
        idSlippage: "100", // 1% slippage
      });

      return result;
    } catch (error) {
      console.error("Failed to setup basic position:", error);
      throw error;
    }
  },

  /**
   * Create a concentrated liquidity scenario
   */
  async setupConcentratedLiquidity(poolId: string) {
    const sdk = getSDK();

    if (!sdk.isMockMode || !sdk.stateManager) {
      throw new Error(
        "Concentrated liquidity setup only available in mock mode"
      );
    }

    // Load concentrated scenario
    sdk.stateManager.loadEthUsdcScenarios(["concentrated"]);

    return {
      poolId,
      scenario: "concentrated",
      activeBin: await SDKUtils.getActiveBin(poolId as any),
    };
  },

  /**
   * Create a wide liquidity distribution scenario
   */
  async setupWideLiquidity(poolId: string) {
    const sdk = getSDK();

    if (!sdk.isMockMode || !sdk.stateManager) {
      throw new Error("Wide liquidity setup only available in mock mode");
    }

    // Load wide scenario
    sdk.stateManager.loadEthUsdcScenarios(["wide"]);

    return {
      poolId,
      scenario: "wide",
      activeBin: await SDKUtils.getActiveBin(poolId as any),
    };
  },

  /**
   * Simulate a swap to test price impact
   */
  async simulateSwap(assetIn: string, amountIn: string, pools: string[]) {
    const sdk = getSDK();

    if (!sdk.isMockMode) {
      throw new Error("Swap simulation only available in mock mode");
    }

    try {
      // Preview the swap first
      const preview = await SDKUtils.previewSwapExactInput(
        assetIn as any,
        amountIn,
        pools as any[]
      );

      // Execute the swap
      const result = await sdk.writeSDK.swapExactInput(
        amountIn,
        assetIn as any,
        "0", // No minimum output for testing
        pools as any[],
        Math.floor(Date.now() / 1000 + 3600).toString()
      );

      return {
        preview,
        result,
        priceImpact: "calculated", // TODO: Calculate actual price impact
      };
    } catch (error) {
      console.error("Failed to simulate swap:", error);
      throw error;
    }
  },

  /**
   * Reset to a clean state for testing
   */
  resetToCleanState() {
    const sdk = getSDK();

    if (!sdk.isMockMode) {
      throw new Error("State reset only available in mock mode");
    }

    sdk.reset?.();

    return {
      message: "Mock state reset to clean state",
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Load predefined test scenarios
   */
  async loadTestScenario(
    scenario: "empty" | "basic" | "concentrated" | "wide" | "asymmetric"
  ) {
    const sdk = getSDK();

    if (!sdk.isMockMode || !sdk.stateManager) {
      throw new Error("Scenario loading only available in mock mode");
    }

    switch (scenario) {
      case "empty":
        sdk.stateManager.reset();
        break;
      case "basic":
        sdk.stateManager.loadEthUsdcScenarios(["uniform"]);
        break;
      case "concentrated":
        sdk.stateManager.loadEthUsdcScenarios(["concentrated"]);
        break;
      case "wide":
        sdk.stateManager.loadEthUsdcScenarios(["wide"]);
        break;
      case "asymmetric":
        sdk.stateManager.loadEthUsdcScenarios(["asymmetric"]);
        break;
      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }

    return {
      scenario,
      loaded: true,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Get current test state summary
   */
  getTestStateSummary() {
    const sdk = getSDK();

    if (!sdk.isMockMode) {
      return {error: "Test state summary only available in mock mode"};
    }

    const state = sdk.inspect?.();

    return {
      isMockMode: true,
      poolCount: state?.pools?.length || 0,
      positionCount: state?.positions?.length || 0,
      transactionCount: state?.transactions?.length || 0,
      lastTransaction: state?.transactions?.[state.transactions.length - 1],
      timestamp: new Date().toISOString(),
    };
  },
};

/**
 * Utility functions for common operations
 */
export const SDKUtils = {
  /**
   * Add liquidity to a v2 pool (with performance monitoring)
   */
  async addLiquidity(params: {
    poolId: PoolIdV2;
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
    txParams?: TxParams;
    options?: PrepareRequestOptions;
  }) {
    return await SDKPerformanceUtils.monitorLiquidityOperation(
      "add",
      params.poolId.toString(),
      async () => {
        const sdk = getSDK();

        if (V2_FEATURE_FLAGS.enableDebugLogging) {
          console.log("Adding liquidity with params:", params);
        }

        const result = await sdk.writeSDK.addLiquidity(
          params.poolId,
          params.amountADesired,
          params.amountBDesired,
          params.amountAMin,
          params.amountBMin,
          params.deadline,
          params.activeIdDesired,
          params.idSlippage,
          params.deltaIds,
          params.distributionX,
          params.distributionY,
          params.txParams,
          params.options
        );

        if (V2_FEATURE_FLAGS.enableDebugLogging) {
          console.log("Add liquidity result:", result);
        }

        // Invalidate cache after successful operation
        poolDataCache.invalidatePool(params.poolId.toString());

        return result;
      }
    );
  },

  /**
   * Remove liquidity from a v2 pool
   */
  async removeLiquidity(params: {
    poolId: PoolIdV2;
    binIds: string[];
    amountAMin: string;
    amountBMin: string;
    deadline: string;
    txParams?: TxParams;
    options?: PrepareRequestOptions;
  }) {
    const sdk = getSDK();

    if (V2_FEATURE_FLAGS.enableDebugLogging) {
      console.log("Removing liquidity with params:", params);
    }

    const result = await sdk.writeSDK.removeLiquidity(
      params.poolId,
      params.binIds,
      params.amountAMin,
      params.amountBMin,
      params.deadline,
      params.txParams,
      params.options
    );

    if (V2_FEATURE_FLAGS.enableDebugLogging) {
      console.log("Remove liquidity result:", result);
    }

    return result;
  },

  /**
   * Create a new v2 pool
   */
  async createPool(params: {
    pool: any; // PoolInput
    activeId: string;
    txParams?: TxParams;
    options?: PrepareRequestOptions;
  }) {
    const sdk = getSDK();

    if (V2_FEATURE_FLAGS.enableDebugLogging) {
      console.log("Creating pool with params:", params);
    }

    const result = await sdk.writeSDK.createPool(
      params.pool,
      params.activeId,
      params.txParams,
      params.options
    );

    if (V2_FEATURE_FLAGS.enableDebugLogging) {
      console.log("Create pool result:", result);
    }

    return result;
  },

  /**
   * Get pool metadata (cached with performance monitoring)
   */
  async getPoolMetadata(poolId: PoolIdV2): Promise<PoolMetadataV2 | null> {
    const cacheKey = `pool_metadata_${poolId}`;
    return await SDKPerformanceUtils.monitorPoolDataFetch(
      poolId.toString(),
      () =>
        poolDataCache.get(cacheKey, async () => {
          const sdk = getSDK();
          return await sdk.readSDK.poolMetadata(poolId);
        })
    );
  },

  /**
   * Get multiple pool metadata
   */
  async getPoolMetadataBatch(
    poolIds: PoolIdV2[]
  ): Promise<(PoolMetadataV2 | null)[]> {
    const sdk = getSDK();
    return await sdk.readSDK.poolMetadataBatch(poolIds);
  },

  /**
   * Get bin liquidity information (cached)
   */
  async getBinLiquidity(poolId: PoolIdV2, binId: string): Promise<any | null> {
    const cacheKey = `bin_liquidity_${poolId}_${binId}`;
    return await poolDataCache.get(
      cacheKey,
      async () => {
        const sdk = getSDK();
        return await sdk.readSDK.getBinLiquidity(poolId, binId);
      },
      15000
    ); // 15 second TTL
  },

  /**
   * Get active bin for a pool (cached with shorter TTL)
   */
  async getActiveBin(poolId: PoolIdV2): Promise<number | null> {
    const cacheKey = `active_bin_${poolId}`;
    return await poolDataCache.get(
      cacheKey,
      async () => {
        const sdk = getSDK();
        return await sdk.readSDK.getActiveBin(poolId);
      },
      10000
    ); // 10 second TTL for more dynamic data
  },

  /**
   * Get bin range information
   */
  async getBinRange(
    poolId: PoolIdV2,
    startBinId: string,
    endBinId: string
  ): Promise<BinLiquidityInfo[]> {
    const sdk = getSDK();
    return await sdk.readSDK.getBinRange(poolId, startBinId, endBinId);
  },

  /**
   * Preview swap exact input (with performance monitoring)
   */
  async previewSwapExactInput(
    assetIdIn: AssetId,
    assetAmountIn: string,
    pools: PoolIdV2[]
  ): Promise<Asset> {
    return await SDKPerformanceUtils.monitorSwapOperation(
      "preview",
      async () => {
        const sdk = getSDK();
        return await sdk.readSDK.previewSwapExactInput(
          assetIdIn,
          assetAmountIn,
          pools
        );
      }
    );
  },

  /**
   * Preview swap exact output
   */
  async previewSwapExactOutput(
    assetIdOut: AssetId,
    assetAmountOut: string,
    pools: PoolIdV2[]
  ): Promise<Asset> {
    const sdk = getSDK();
    return await sdk.readSDK.previewSwapExactOutput(
      assetIdOut,
      assetAmountOut,
      pools
    );
  },
};

/**
 * Utility functions for UI component integration
 */
export const UIIntegrationUtils = {
  /**
   * Create a seamless SDK switcher for components
   */
  createSDKSwitcher() {
    return {
      isMockMode: isMockMode(),
      switchToMock: () => switchSDKMode(true),
      switchToReal: () => switchSDKMode(false),
      reset: () => resetSDK(),
      inspect: () => inspectSDKState(),
    };
  },

  /**
   * Get component-friendly pool data
   */
  async getPoolDataForComponent(poolId: string) {
    const sdk = getSDK();

    try {
      const [metadata, activeBin, binRange] = await Promise.all([
        sdk.readSDK.poolMetadata(poolId as any),
        sdk.readSDK.getActiveBin(poolId as any),
        sdk.readSDK.getBinRange(poolId as any, "0", "20"), // Get first 20 bins
      ]);

      return {
        metadata,
        activeBin,
        binRange,
        isMockData: sdk.isMockMode,
        poolId,
      };
    } catch (error) {
      console.error("Failed to get pool data:", error);
      return null;
    }
  },

  /**
   * Get component-friendly position data
   */
  async getPositionDataForComponent(poolId: string, userAddress: string) {
    const positions = await SDKHooks.getUserPositions(poolId, userAddress);
    const sdk = getSDK();

    return {
      positions,
      isMockData: sdk.isMockMode,
      poolId,
      userAddress,
    };
  },

  /**
   * Get component-friendly metrics data
   */
  async getMetricsDataForComponent(poolId: string) {
    const metrics = await SDKHooks.getConcentratedLiquidityMetrics(poolId);
    const sdk = getSDK();

    return {
      metrics,
      isMockData: sdk.isMockMode,
      poolId,
    };
  },

  /**
   * Create a mock mode indicator component props
   */
  getMockModeIndicatorProps() {
    const sdk = getSDK();

    return {
      isMockMode: sdk.isMockMode,
      canReset: !!sdk.reset,
      canInspect: !!sdk.inspect && V2_FEATURE_FLAGS.enableStateInspection,
      onReset: () => {
        sdk.reset?.();
        poolDataCache.clear(); // Clear cache when resetting
      },
      onInspect: () => sdk.inspect?.(),
    };
  },

  /**
   * Cache management utilities
   */
  getCacheUtils() {
    return {
      clearCache: () => poolDataCache.clear(),
      invalidatePool: (poolId: string) => poolDataCache.invalidatePool(poolId),
      getCacheStats: () => poolDataCache.getStats(),
    };
  },

  /**
onitoring utilities
   */
  getPerformanceUtils() {
    return {
      getSDKInsights: () => SDKPerformanceUtils.getSDKPerformanceInsights(),
      getRealTimeSummary: () => performanceMonitor.getRealTimeSummary(),
      getStats: (operationType?: string) =>
        performanceMonitor.getStats(operationType),
      getSlowOperations: (threshold?: number) =>
        performanceMonitor.getSlowOperations(threshold),
      getFailedOperations: () => performanceMonitor.getFailedOperations(),
      clearMetrics: () => performanceMonitor.clear(),
      exportMetrics: () => performanceMonitor.exportMetrics(),
    };
  },
};

/**
 * Hook-like utilities for React components
 */
export const SDKHooks = {
  /**
   * Get SDK configuration for components
   */
  useSDKConfig() {
    const sdk = getSDK();
    return {
      isMockMode: sdk.isMockMode,
      canReset: !!sdk.reset,
      canInspect: !!sdk.inspect && V2_FEATURE_FLAGS.enableStateInspection,
      features: {
        liquidity: V2_FEATURE_FLAGS.enableV2Liquidity,
        createPool: V2_FEATURE_FLAGS.enableV2CreatePool,
        positionManagement: V2_FEATURE_FLAGS.enableV2PositionManagement,
        metrics: V2_FEATURE_FLAGS.enableV2Metrics,
      },
    };
  },

  /**
   * Get user positions for a specific pool
   */
  async getUserPositions(poolId: string, userAddress: string) {
    const sdk = getSDK();

    if (sdk.isMockMode && sdk.stateManager) {
      // Get positions from mock state manager
      const userPositions = sdk.stateManager.positions.get(userAddress);
      const poolPositions = userPositions?.get(poolId);

      if (poolPositions) {
        // Convert mock position to component format
        const activeBin = await SDKUtils.getActiveBin(poolId as any);

        return {
          poolId,
          bins: Array.from(poolPositions.binPositions.entries()).map(
            ([binId, binPos]: [number, any]) => ({
              binId,
              lpToken: `mock_lp_${poolId}_${binId}`,
              lpTokenAmount: binPos.lpTokenAmount.toString(),
              underlyingAmounts: {
                x: binPos.underlyingAmounts.x.toString(),
                y: binPos.underlyingAmounts.y.toString(),
              },
              price: parseFloat(binPos.entryPrice.toString()) / 1e18,
              feesEarned: {
                x: binPos.feesEarned.x.toString(),
                y: binPos.feesEarned.y.toString(),
              },
              isActive: binPos.binId === activeBin,
            })
          ),
          totalValue: {
            x: poolPositions.totalValue.x.toString(),
            y: poolPositions.totalValue.y.toString(),
          },
          totalFeesEarned: {
            x: poolPositions.totalFeesEarned.x.toString(),
            y: poolPositions.totalFeesEarned.y.toString(),
          },
        };
      }
    } else {
      // TODO: Implement real SDK position fetching
      throw new Error("Real SDK position fetching not yet implemented");
    }

    return null;
  },

  /**
   * Get concentrated liquidity metrics for a pool
   */
  async getConcentratedLiquidityMetrics(poolId: string) {
    const sdk = getSDK();

    if (sdk.isMockMode && sdk.stateManager) {
      const pool = sdk.stateManager.getPool(poolId);
      if (!pool) return null;

      const activeBin = await SDKUtils.getActiveBin(poolId as any);

      // Calculate utilization rate
      const totalLiquidity = pool.totalReserves.x.add(pool.totalReserves.y);
      const activeLiquidity = Array.from(pool.bins.values())
        .filter((bin: any) => Math.abs(bin.binId - activeBin!) <= 2)
        .reduce(
          (sum: BN, bin: any) => sum.add(bin.reserves.x).add(bin.reserves.y),
          new BN(0)
        );

      const utilizationRate = totalLiquidity.gt(0)
        ? activeLiquidity.mul(10000).div(totalLiquidity).toNumber() / 100
        : 0;

      return {
        activeBin: activeBin!,
        binStep: pool.metadata.binStep,
        totalBins: pool.bins.size,
        liquidityDistribution: Array.from(pool.bins.values())
          .slice(0, 10)
          .map((bin: any) => ({
            binId: bin.binId,
            price: parseFloat(bin.price.toString()) / 1e18,
            liquidityX: bin.reserves.x.toString(),
            liquidityY: bin.reserves.y.toString(),
            isActive: bin.binId === activeBin,
          })),
        concentrationRange: {
          minPrice: Math.min(
            ...Array.from(pool.bins.values()).map(
              (b: any) => parseFloat(b.price.toString()) / 1e18
            )
          ),
          maxPrice: Math.max(
            ...Array.from(pool.bins.values()).map(
              (b: any) => parseFloat(b.price.toString()) / 1e18
            )
          ),
          currentPrice:
            parseFloat(pool.bins.get(activeBin!)?.price.toString() || "0") /
            1e18,
        },
        utilizationRate,
        feeRate: pool.metadata.staticFeeParameters?.baseFactor || 2500, // 0.25% default
      };
    } else {
      // TODO: Implement real SDK metrics fetching
      throw new Error("Real SDK metrics fetching not yet implemented");
    }
  },
};

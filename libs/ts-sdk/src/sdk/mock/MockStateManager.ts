import {BN} from "fuels";
import {
  MockSDKConfig,
  MockPoolState,
  MockUserPosition,
  MockTransaction,
  MockBinPosition,
  MockPoolScenario,
  DEFAULT_MOCK_CONFIG,
} from "./types";
import {PoolIdV2, Amounts} from "../model";

/**
 * Central state management for the mock SDK
 * Handles pools, user positions, transaction history, and optional persistence
 */
export class MockStateManager {
  private pools: Map<string, MockPoolState> = new Map();
  private positions: Map<string, Map<string, MockUserPosition>> = new Map(); // userId -> poolId -> position
  private transactions: MockTransaction[] = [];
  private config: MockSDKConfig;

  constructor(config: Partial<MockSDKConfig> = {}) {
    this.config = {...DEFAULT_MOCK_CONFIG, ...config};
    this.initialize();
  }

  /**
   * Initialize the state manager
   */
  private initialize(): void {
    // Load persisted state if enabled
    if (this.config.enablePersistence) {
      this.restore();
    }

    // Load initial pool scenarios
    if (this.config.initialPoolScenarios.length > 0) {
      this.loadPoolScenarios(this.config.initialPoolScenarios);
    }
  }

  // ===== Pool State Management =====

  /**
   * Get pool state by ID
   * @param poolId - Pool identifier
   * @returns Pool state or null if not found
   */
  getPool(poolId: string | PoolIdV2): MockPoolState | null {
    const id =
      typeof poolId === "string" ? poolId : this.poolIdToString(poolId);
    return this.pools.get(id) || null;
  }

  /**
   * Set pool state
   * @param poolId - Pool identifier
   * @param pool - Pool state to set
   */
  setPool(poolId: string | PoolIdV2, pool: MockPoolState): void {
    const id =
      typeof poolId === "string" ? poolId : this.poolIdToString(poolId);
    pool.lastUpdated = new Date();
    this.pools.set(id, pool);
    this.persistIfEnabled();
  }

  /**
   * Update existing pool state
   * @param poolId - Pool identifier
   * @param updates - Partial pool state updates
   * @returns Updated pool state or null if pool not found
   */
  updatePool(
    poolId: string | PoolIdV2,
    updates: Partial<MockPoolState>
  ): MockPoolState | null {
    const pool = this.getPool(poolId);
    if (!pool) {
      return null;
    }

    const updatedPool = {
      ...pool,
      ...updates,
      lastUpdated: new Date(),
    };

    this.setPool(poolId, updatedPool);
    return updatedPool;
  }

  /**
   * Remove pool from state
   * @param poolId - Pool identifier
   * @returns True if pool was removed, false if not found
   */
  removePool(poolId: string | PoolIdV2): boolean {
    const id =
      typeof poolId === "string" ? poolId : this.poolIdToString(poolId);
    const removed = this.pools.delete(id);
    if (removed) {
      this.persistIfEnabled();
    }
    return removed;
  }

  /**
   * Get all pools
   * @returns Array of all pool states
   */
  getAllPools(): MockPoolState[] {
    return Array.from(this.pools.values());
  }

  /**
   * Check if pool exists
   * @param poolId - Pool identifier
   * @returns True if pool exists
   */
  hasPool(poolId: string | PoolIdV2): boolean {
    return this.getPool(poolId) !== null;
  }

  // ===== User Position Management =====

  /**
   * Get user position in a specific pool
   * @param userId - User identifier
   * @param poolId - Pool identifier
   * @returns User position or null if not found
   */
  getUserPosition(
    userId: string,
    poolId: string | PoolIdV2
  ): MockUserPosition | null {
    const id =
      typeof poolId === "string" ? poolId : this.poolIdToString(poolId);
    const userPositions = this.positions.get(userId);
    if (!userPositions) {
      return null;
    }
    return userPositions.get(id) || null;
  }

  /**
   * Set user position in a pool
   * @param userId - User identifier
   * @param poolId - Pool identifier
   * @param position - Position to set
   */
  updateUserPosition(
    userId: string,
    poolId: string | PoolIdV2,
    position: MockUserPosition
  ): void {
    const id =
      typeof poolId === "string" ? poolId : this.poolIdToString(poolId);

    if (!this.positions.has(userId)) {
      this.positions.set(userId, new Map());
    }

    position.lastUpdated = new Date();
    this.positions.get(userId)!.set(id, position);
    this.persistIfEnabled();
  }

  /**
   * Add or update a bin position for a user
   * @param userId - User identifier
   * @param poolId - Pool identifier
   * @param binPosition - Bin position to add/update
   */
  updateUserBinPosition(
    userId: string,
    poolId: string | PoolIdV2,
    binPosition: MockBinPosition
  ): void {
    const id =
      typeof poolId === "string" ? poolId : this.poolIdToString(poolId);
    let position = this.getUserPosition(userId, id);

    if (!position) {
      // Create new position
      position = {
        userId,
        poolId: id,
        binPositions: new Map(),
        totalValue: {assetA: new BN(0), assetB: new BN(0)},
        totalFeesEarned: {assetA: new BN(0), assetB: new BN(0)},
        createdAt: new Date(),
        lastUpdated: new Date(),
      };
    }

    position.binPositions.set(binPosition.binId, binPosition);
    this.recalculatePositionTotals(position);
    this.updateUserPosition(userId, id, position);
  }

  /**
   * Remove a bin position for a user
   * @param userId - User identifier
   * @param poolId - Pool identifier
   * @param binId - Bin ID to remove
   * @returns True if position was removed
   */
  removeUserBinPosition(
    userId: string,
    poolId: string | PoolIdV2,
    binId: number
  ): boolean {
    const position = this.getUserPosition(userId, poolId);
    if (!position) {
      return false;
    }

    const removed = position.binPositions.delete(binId);
    if (removed) {
      if (position.binPositions.size === 0) {
        // Remove entire position if no bins left
        this.removeUserPosition(userId, poolId);
      } else {
        this.recalculatePositionTotals(position);
        this.updateUserPosition(userId, poolId, position);
      }
    }
    return removed;
  }

  /**
   * Remove user position from a pool
   * @param userId - User identifier
   * @param poolId - Pool identifier
   * @returns True if position was removed
   */
  removeUserPosition(userId: string, poolId: string | PoolIdV2): boolean {
    const id =
      typeof poolId === "string" ? poolId : this.poolIdToString(poolId);
    const userPositions = this.positions.get(userId);
    if (!userPositions) {
      return false;
    }

    const removed = userPositions.delete(id);
    if (removed) {
      // Clean up empty user position maps
      if (userPositions.size === 0) {
        this.positions.delete(userId);
      }
      this.persistIfEnabled();
    }
    return removed;
  }

  /**
   * Get all positions for a user
   * @param userId - User identifier
   * @returns Array of user positions
   */
  getUserPositions(userId: string): MockUserPosition[] {
    const userPositions = this.positions.get(userId);
    if (!userPositions) {
      return [];
    }
    return Array.from(userPositions.values());
  }

  /**
   * Get all positions across all users for a specific pool
   * @param poolId - Pool identifier
   * @returns Array of user positions in the pool
   */
  getPoolPositions(poolId: string | PoolIdV2): MockUserPosition[] {
    const id =
      typeof poolId === "string" ? poolId : this.poolIdToString(poolId);
    const poolPositions: MockUserPosition[] = [];

    for (const userPositions of this.positions.values()) {
      const position = userPositions.get(id);
      if (position) {
        poolPositions.push(position);
      }
    }

    return poolPositions;
  }

  // ===== Transaction History Management =====

  /**
   * Add transaction to history
   * @param transaction - Transaction to add
   */
  addTransaction(transaction: MockTransaction): void {
    this.transactions.push(transaction);
    this.persistIfEnabled();
  }

  /**
   * Get transaction by ID
   * @param transactionId - Transaction identifier
   * @returns Transaction or null if not found
   */
  getTransaction(transactionId: string): MockTransaction | null {
    return this.transactions.find((tx) => tx.id === transactionId) || null;
  }

  /**
   * Get transactions for a user
   * @param userId - User identifier
   * @param limit - Maximum number of transactions to return
   * @returns Array of user transactions
   */
  getUserTransactions(userId: string, limit?: number): MockTransaction[] {
    const userTransactions = this.transactions
      .filter((tx) => tx.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return limit ? userTransactions.slice(0, limit) : userTransactions;
  }

  /**
   * Get transactions for a pool
   * @param poolId - Pool identifier
   * @param limit - Maximum number of transactions to return
   * @returns Array of pool transactions
   */
  getPoolTransactions(
    poolId: string | PoolIdV2,
    limit?: number
  ): MockTransaction[] {
    const id =
      typeof poolId === "string" ? poolId : this.poolIdToString(poolId);
    const poolTransactions = this.transactions
      .filter((tx) => tx.poolId === id)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return limit ? poolTransactions.slice(0, limit) : poolTransactions;
  }

  /**
   * Get all transactions
   * @param limit - Maximum number of transactions to return
   * @returns Array of all transactions
   */
  getAllTransactions(limit?: number): MockTransaction[] {
    const sortedTransactions = this.transactions.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    return limit ? sortedTransactions.slice(0, limit) : sortedTransactions;
  }

  // ===== State Management =====

  /**
   * Reset all state to initial values
   */
  reset(): void {
    this.pools.clear();
    this.positions.clear();
    this.transactions.length = 0;

    // Reload initial scenarios if configured
    if (this.config.initialPoolScenarios.length > 0) {
      this.loadPoolScenarios(this.config.initialPoolScenarios);
    }

    this.persistIfEnabled();
  }

  /**
   * Get current configuration
   * @returns Current mock SDK configuration
   */
  getConfig(): MockSDKConfig {
    return {...this.config};
  }

  /**
   * Update configuration
   * @param updates - Configuration updates
   */
  updateConfig(updates: Partial<MockSDKConfig>): void {
    this.config = {...this.config, ...updates};
    this.persistIfEnabled();
  }

  // ===== Persistence =====

  /**
   * Persist state to localStorage if enabled
   */
  persist(): void {
    if (!this.config.enablePersistence || typeof localStorage === "undefined") {
      return;
    }

    try {
      const state = this.serializeState();
      localStorage.setItem(this.config.persistenceKey, JSON.stringify(state));
    } catch (error) {
      console.warn("Failed to persist mock SDK state:", error);
    }
  }

  /**
   * Restore state from localStorage if available
   */
  restore(): void {
    if (!this.config.enablePersistence || typeof localStorage === "undefined") {
      return;
    }

    try {
      const stored = localStorage.getItem(this.config.persistenceKey);
      if (stored) {
        const state = JSON.parse(stored);
        this.deserializeState(state);
      }
    } catch (error) {
      console.warn("Failed to restore mock SDK state:", error);
    }
  }

  // ===== Private Helper Methods =====

  /**
   * Persist state if persistence is enabled
   */
  private persistIfEnabled(): void {
    if (this.config.enablePersistence) {
      this.persist();
    }
  }

  /**
   * Convert PoolIdV2 to string for consistent key usage
   */
  private poolIdToString(poolId: PoolIdV2): string {
    return poolId.toString();
  }

  /**
   * Recalculate position totals from bin positions
   */
  private recalculatePositionTotals(position: MockUserPosition): void {
    let totalValueA = new BN(0);
    let totalValueB = new BN(0);
    let totalFeesA = new BN(0);
    let totalFeesB = new BN(0);

    for (const binPosition of position.binPositions.values()) {
      totalValueA = totalValueA.add(binPosition.underlyingAmounts.assetA);
      totalValueB = totalValueB.add(binPosition.underlyingAmounts.assetB);
      totalFeesA = totalFeesA.add(binPosition.feesEarned.assetA);
      totalFeesB = totalFeesB.add(binPosition.feesEarned.assetB);
    }

    position.totalValue = {assetA: totalValueA, assetB: totalValueB};
    position.totalFeesEarned = {assetA: totalFeesA, assetB: totalFeesB};
  }

  /**
   * Load pool scenarios into state
   */
  private loadPoolScenarios(scenarios: MockPoolScenario[]): void {
    for (const scenario of scenarios) {
      // Create pool state from scenario
      const poolState: MockPoolState = {
        poolId: scenario.poolConfig.poolId,
        metadata: scenario.poolConfig.metadata,
        bins: new Map(),
        activeBinId: scenario.poolConfig.activeBinId,
        totalReserves: {assetA: new BN(0), assetB: new BN(0)},
        protocolFees: {assetA: new BN(0), assetB: new BN(0)},
        volume24h: new BN(0),
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      // Add bins from scenario
      for (const binConfig of scenario.bins) {
        poolState.bins.set(binConfig.binId, {
          binId: binConfig.binId,
          reserves: binConfig.reserves,
          totalLpTokens: binConfig.lpTokens,
          price: new BN(0), // Will be calculated based on bin ID
          isActive: binConfig.binId === scenario.poolConfig.activeBinId,
        });

        // Add to total reserves
        poolState.totalReserves.assetA = poolState.totalReserves.assetA.add(
          binConfig.reserves.assetA
        );
        poolState.totalReserves.assetB = poolState.totalReserves.assetB.add(
          binConfig.reserves.assetB
        );
      }

      this.setPool(scenario.poolConfig.poolId, poolState);

      // Add initial user positions if provided
      if (scenario.positions) {
        for (const positionConfig of scenario.positions) {
          const position: MockUserPosition = {
            userId: positionConfig.userId,
            poolId: scenario.poolConfig.poolId,
            binPositions: new Map(),
            totalValue: {assetA: new BN(0), assetB: new BN(0)},
            totalFeesEarned: {assetA: new BN(0), assetB: new BN(0)},
            createdAt: new Date(),
            lastUpdated: new Date(),
          };

          for (const binPos of positionConfig.binPositions) {
            const binState = poolState.bins.get(binPos.binId);
            if (binState) {
              position.binPositions.set(binPos.binId, {
                binId: binPos.binId,
                lpTokenAmount: binPos.lpTokenAmount,
                underlyingAmounts: {assetA: new BN(0), assetB: new BN(0)}, // Will be calculated
                feesEarned: {assetA: new BN(0), assetB: new BN(0)},
                entryPrice: binState.price,
                entryTime: new Date(),
              });
            }
          }

          this.recalculatePositionTotals(position);
          this.updateUserPosition(
            positionConfig.userId,
            scenario.poolConfig.poolId,
            position
          );
        }
      }
    }
  }

  /**
   * Serialize state for persistence
   */
  private serializeState(): any {
    return {
      pools: Array.from(this.pools.entries()).map(([id, pool]) => [
        id,
        {
          ...pool,
          bins: Array.from(pool.bins.entries()),
        },
      ]),
      positions: Array.from(this.positions.entries()).map(
        ([userId, userPools]) => [
          userId,
          Array.from(userPools.entries()).map(([poolId, position]) => [
            poolId,
            {
              ...position,
              binPositions: Array.from(position.binPositions.entries()),
            },
          ]),
        ]
      ),
      transactions: this.transactions,
      config: this.config,
    };
  }

  /**
   * Deserialize state from persistence
   */
  private deserializeState(state: any): void {
    // Restore pools
    if (state.pools) {
      this.pools.clear();
      for (const [id, poolData] of state.pools) {
        const pool = {
          ...poolData,
          bins: new Map(poolData.bins),
          createdAt: new Date(poolData.createdAt),
          lastUpdated: new Date(poolData.lastUpdated),
        };
        this.pools.set(id, pool);
      }
    }

    // Restore positions
    if (state.positions) {
      this.positions.clear();
      for (const [userId, userPoolsData] of state.positions) {
        const userPools = new Map();
        for (const [poolId, positionData] of userPoolsData) {
          const position = {
            ...positionData,
            binPositions: new Map(positionData.binPositions),
            createdAt: new Date(positionData.createdAt),
            lastUpdated: new Date(positionData.lastUpdated),
          };
          userPools.set(poolId, position);
        }
        this.positions.set(userId, userPools);
      }
    }

    // Restore transactions
    if (state.transactions) {
      this.transactions = state.transactions.map((tx: any) => ({
        ...tx,
        timestamp: new Date(tx.timestamp),
        result: {
          ...tx.result,
          timestamp: new Date(tx.result.timestamp),
        },
      }));
    }

    // Update config if present
    if (state.config) {
      this.config = {...this.config, ...state.config};
    }
  }
}

import {BN} from "fuels";
import {MockStateManager} from "../MockStateManager";
import {
  MockSDKConfig,
  MockPoolState,
  MockUserPosition,
  MockTransaction,
  MockBinPosition,
  MockBinState,
} from "../types";
import {PoolIdV2, AssetId} from "../../model";
import {vi, describe, it, beforeEach, expect, afterEach} from "vitest";

// Mock localStorage for testing
const mockLocalStorage = {
  store: new Map<string, string>(),
  getItem: vi.fn((key: string) => mockLocalStorage.store.get(key) || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    mockLocalStorage.store.delete(key);
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store.clear();
  }),
};

// Mock global localStorage
Object.defineProperty(global, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

describe("MockStateManager Enhanced Tests", () => {
  let stateManager: MockStateManager;
  let mockConfig: MockSDKConfig;
  let mockAssetA: AssetId;
  let mockAssetB: AssetId;

  beforeEach(() => {
    // Reset localStorage mock
    mockLocalStorage.store.clear();
    vi.clearAllMocks();

    // Create mock assets
    mockAssetA = {bits: "0x1234"} as AssetId;
    mockAssetB = {bits: "0x5678"} as AssetId;

    mockConfig = {
      enablePersistence: false,
      persistenceKey: "test-mock-sdk",
      defaultFailureRate: 0.05,
      defaultLatencyMs: 100,
      enableRealisticGas: true,
      enablePriceImpact: true,
      enableSlippageSimulation: true,
      initialPoolScenarios: [],
    };

    stateManager = new MockStateManager(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Advanced Pool State Operations", () => {
    it("should handle complex bin state management", () => {
      const poolState: MockPoolState = {
        poolId: "complex-pool",
        metadata: {
          assetA: mockAssetA,
          assetB: mockAssetB,
          binStep: 25,
          baseFactor: new BN(5000),
          filterPeriod: new BN(30),
          decayPeriod: new BN(600),
          reductionFactor: new BN(5000),
          variableFeeControl: new BN(40000),
          protocolShare: new BN(1000),
          maxVolatilityAccumulator: new BN(350000),
          isOpen: true,
        },
        bins: new Map(),
        activeBinId: 8388608,
        totalReserves: {assetA: new BN(0), assetB: new BN(0)},
        protocolFees: {assetA: new BN(0), assetB: new BN(0)},
        volume24h: new BN(0),
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      // Add multiple bins with different states
      const bins = new Map<number, MockBinState>();
      for (let i = -5; i <= 5; i++) {
        const binId = 8388608 + i;
        bins.set(binId, {
          binId,
          reserves: {
            assetA: new BN(Math.abs(i) * 1000000),
            assetB: new BN(Math.abs(i) * 2000000),
          },
          totalLpTokens: new BN(Math.abs(i) * 1500000),
          price: new BN(1000000 + i * 10000),
          isActive: i === 0,
          lastSwapTime: i === 0 ? new Date() : undefined,
        });
      }
      poolState.bins = bins;

      stateManager.setPool("complex-pool", poolState);
      const retrieved = stateManager.getPool("complex-pool");

      expect(retrieved).toBeTruthy();
      expect(retrieved!.bins.size).toBe(11);
      expect(retrieved!.bins.get(8388608)?.isActive).toBe(true);
      expect(retrieved!.bins.get(8388603)?.reserves.assetA.toString()).toBe(
        "5000000"
      );
    });

    it("should update pool reserves correctly", () => {
      const poolState: MockPoolState = {
        poolId: "reserve-pool",
        metadata: {
          assetA: mockAssetA,
          assetB: mockAssetB,
          binStep: 25,
          baseFactor: new BN(5000),
          filterPeriod: new BN(30),
          decayPeriod: new BN(600),
          reductionFactor: new BN(5000),
          variableFeeControl: new BN(40000),
          protocolShare: new BN(1000),
          maxVolatilityAccumulator: new BN(350000),
          isOpen: true,
        },
        bins: new Map(),
        activeBinId: 8388608,
        totalReserves: {assetA: new BN(1000000), assetB: new BN(2000000)},
        protocolFees: {assetA: new BN(10), assetB: new BN(20)},
        volume24h: new BN(50000),
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      stateManager.setPool("reserve-pool", poolState);

      // Update reserves
      const updated = stateManager.updatePool("reserve-pool", {
        totalReserves: {assetA: new BN(1500000), assetB: new BN(2500000)},
        volume24h: new BN(75000),
      });

      expect(updated).toBeTruthy();
      expect(updated!.totalReserves.assetA.toString()).toBe("1500000");
      expect(updated!.totalReserves.assetB.toString()).toBe("2500000");
      expect(updated!.volume24h.toString()).toBe("75000");
      expect(updated!.lastUpdated.getTime()).toBeGreaterThan(
        poolState.lastUpdated.getTime()
      );
    });

    it("should handle pool filtering and searching", () => {
      // Create multiple pools
      const pools = [
        {
          poolId: "eth-usdc-25",
          assetA: {
            bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
          },
          assetB: {
            bits: "0x0000000000000000000000000000000000000000000000000000000000000001",
          },
          binStep: 25,
        },
        {
          poolId: "eth-usdc-100",
          assetA: {
            bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
          },
          assetB: {
            bits: "0x0000000000000000000000000000000000000000000000000000000000000001",
          },
          binStep: 100,
        },
        {
          poolId: "btc-usdc-25",
          assetA: {
            bits: "0x0000000000000000000000000000000000000000000000000000000000000002",
          },
          assetB: {
            bits: "0x0000000000000000000000000000000000000000000000000000000000000001",
          },
          binStep: 25,
        },
      ];

      pools.forEach((pool) => {
        const poolState: MockPoolState = {
          poolId: pool.poolId,
          metadata: {
            assetA: pool.assetA as AssetId,
            assetB: pool.assetB as AssetId,
            binStep: pool.binStep,
            baseFactor: new BN(5000),
            filterPeriod: new BN(30),
            decayPeriod: new BN(600),
            reductionFactor: new BN(5000),
            variableFeeControl: new BN(40000),
            protocolShare: new BN(1000),
            maxVolatilityAccumulator: new BN(350000),
            isOpen: true,
          },
          bins: new Map(),
          activeBinId: 8388608,
          totalReserves: {assetA: new BN(1000000), assetB: new BN(2000000)},
          protocolFees: {assetA: new BN(10), assetB: new BN(20)},
          volume24h: new BN(50000),
          createdAt: new Date(),
          lastUpdated: new Date(),
        };
        stateManager.setPool(pool.poolId, poolState);
      });

      const allPools = stateManager.getAllPools();
      expect(allPools).toHaveLength(3);

      // Filter by asset pair
      const ethUsdcPools = allPools.filter(
        (pool) =>
          pool.metadata.assetA.bits ===
            "0x0000000000000000000000000000000000000000000000000000000000000000" &&
          pool.metadata.assetB.bits ===
            "0x0000000000000000000000000000000000000000000000000000000000000001"
      );
      expect(ethUsdcPools).toHaveLength(2);

      // Filter by bin step
      const binStep25Pools = allPools.filter(
        (pool) => pool.metadata.binStep === 25
      );
      expect(binStep25Pools).toHaveLength(2);
    });
  });

  describe("Advanced Position Management", () => {
    it("should handle complex multi-bin positions", () => {
      const userId = "complex-user";
      const poolId = "multi-bin-pool";

      // Create position with multiple bins
      const binPositions = new Map<number, MockBinPosition>();
      for (let i = 0; i < 5; i++) {
        const binId = 8388608 + i;
        binPositions.set(binId, {
          binId,
          lpTokenAmount: new BN((i + 1) * 1000000),
          underlyingAmounts: {
            assetA: new BN((i + 1) * 500000),
            assetB: new BN((i + 1) * 750000),
          },
          feesEarned: {
            assetA: new BN((i + 1) * 5000),
            assetB: new BN((i + 1) * 7500),
          },
          entryPrice: new BN(1000000 + i * 10000),
          entryTime: new Date(Date.now() - i * 60000),
        });
      }

      const position: MockUserPosition = {
        userId,
        poolId,
        binPositions,
        totalValue: {assetA: new BN(7500000), assetB: new BN(11250000)},
        totalFeesEarned: {assetA: new BN(75000), assetB: new BN(112500)},
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      stateManager.updateUserPosition(userId, poolId, position);
      const retrieved = stateManager.getUserPosition(userId, poolId);

      expect(retrieved).toBeTruthy();
      expect(retrieved!.binPositions.size).toBe(5);
      expect(retrieved!.totalValue.assetA.toString()).toBe("7500000");
      expect(retrieved!.totalFeesEarned.assetB.toString()).toBe("112500");

      // Test individual bin position retrieval
      const binPosition = retrieved!.binPositions.get(8388610);
      expect(binPosition).toBeTruthy();
      expect(binPosition!.lpTokenAmount.toString()).toBe("3000000");
    });

    it("should calculate position values correctly", () => {
      const userId = "calc-user";
      const poolId = "calc-pool";

      // Add multiple bin positions
      const binPositions = [
        {
          binId: 8388608,
          lpTokenAmount: new BN("1000000"),
          underlyingAmounts: {
            assetA: new BN("500000"),
            assetB: new BN("500000"),
          },
          feesEarned: {assetA: new BN("5000"), assetB: new BN("5000")},
          entryPrice: new BN("1000000"),
          entryTime: new Date(),
        },
        {
          binId: 8388609,
          lpTokenAmount: new BN("2000000"),
          underlyingAmounts: {
            assetA: new BN("1000000"),
            assetB: new BN("1000000"),
          },
          feesEarned: {assetA: new BN("10000"), assetB: new BN("10000")},
          entryPrice: new BN("1010000"),
          entryTime: new Date(),
        },
      ];

      binPositions.forEach((binPos) => {
        stateManager.updateUserBinPosition(userId, poolId, binPos);
      });

      const position = stateManager.getUserPosition(userId, poolId);
      expect(position).toBeTruthy();
      expect(position!.binPositions.size).toBe(2);

      // Total values should be sum of all bin positions
      expect(position!.totalValue.assetA.toString()).toBe("1500000");
      expect(position!.totalValue.assetB.toString()).toBe("1500000");
      expect(position!.totalFeesEarned.assetA.toString()).toBe("15000");
      expect(position!.totalFeesEarned.assetB.toString()).toBe("15000");
    });

    it("should handle position updates and partial removals", () => {
      const userId = "update-user";
      const poolId = "update-pool";

      // Create initial position
      const initialBinPosition: MockBinPosition = {
        binId: 8388608,
        lpTokenAmount: new BN("2000000"),
        underlyingAmounts: {
          assetA: new BN("1000000"),
          assetB: new BN("1000000"),
        },
        feesEarned: {assetA: new BN("10000"), assetB: new BN("10000")},
        entryPrice: new BN("1000000"),
        entryTime: new Date(),
      };

      stateManager.updateUserBinPosition(userId, poolId, initialBinPosition);

      let position = stateManager.getUserPosition(userId, poolId);
      expect(position!.totalValue.assetA.toString()).toBe("1000000");

      // Update position (reduce LP tokens)
      const updatedBinPosition: MockBinPosition = {
        ...initialBinPosition,
        lpTokenAmount: new BN("1000000"),
        underlyingAmounts: {assetA: new BN("500000"), assetB: new BN("500000")},
        feesEarned: {assetA: new BN("15000"), assetB: new BN("15000")}, // Fees increased
      };

      stateManager.updateUserBinPosition(userId, poolId, updatedBinPosition);

      position = stateManager.getUserPosition(userId, poolId);
      expect(position!.totalValue.assetA.toString()).toBe("500000");
      expect(position!.totalFeesEarned.assetA.toString()).toBe("15000");

      // Remove position completely
      const removed = stateManager.removeUserBinPosition(
        userId,
        poolId,
        8388608
      );
      expect(removed).toBe(true);

      position = stateManager.getUserPosition(userId, poolId);
      expect(position).toBeNull(); // Should be null when no bins left
    });
  });

  describe("Transaction History Analysis", () => {
    it("should provide transaction analytics", () => {
      const transactions: MockTransaction[] = [
        {
          id: "tx-1",
          type: "addLiquidity",
          userId: "user-1",
          poolId: "pool-1",
          params: {amount: "1000000"},
          result: {
            success: true,
            transactionId: "tx-1",
            gasUsed: new BN(150000),
            gasPrice: new BN(1000000000),
            blockNumber: 12345,
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            events: [],
          },
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: "tx-2",
          type: "swap",
          userId: "user-1",
          poolId: "pool-1",
          params: {amountIn: "500000"},
          result: {
            success: true,
            transactionId: "tx-2",
            gasUsed: new BN(100000),
            gasPrice: new BN(1200000000),
            blockNumber: 12346,
            timestamp: new Date(Date.now() - 1800000), // 30 min ago
            events: [],
          },
          timestamp: new Date(Date.now() - 1800000),
        },
        {
          id: "tx-3",
          type: "swap",
          userId: "user-2",
          poolId: "pool-1",
          params: {amountIn: "750000"},
          result: {
            success: false,
            transactionId: "tx-3",
            gasUsed: new BN(50000),
            gasPrice: new BN(1100000000),
            blockNumber: 12347,
            timestamp: new Date(Date.now() - 900000), // 15 min ago
            events: [],
            error: "Insufficient liquidity",
          },
          timestamp: new Date(Date.now() - 900000),
        },
      ];

      transactions.forEach((tx) => stateManager.addTransaction(tx));

      // Test transaction filtering
      const user1Transactions = stateManager.getUserTransactions("user-1");
      expect(user1Transactions).toHaveLength(2);

      const pool1Transactions = stateManager.getPoolTransactions("pool-1");
      expect(pool1Transactions).toHaveLength(3);

      const swapTransactions = stateManager
        .getAllTransactions()
        .filter((tx) => tx.type === "swap");
      expect(swapTransactions).toHaveLength(2);

      const successfulTransactions = stateManager
        .getAllTransactions()
        .filter((tx) => tx.result.success);
      expect(successfulTransactions).toHaveLength(2);

      const failedTransactions = stateManager
        .getAllTransactions()
        .filter((tx) => !tx.result.success);
      expect(failedTransactions).toHaveLength(1);
      expect(failedTransactions[0].result.error).toBe("Insufficient liquidity");
    });

    it("should handle transaction pagination and sorting", () => {
      // Add many transactions
      for (let i = 0; i < 50; i++) {
        const transaction: MockTransaction = {
          id: `tx-${i}`,
          type: i % 2 === 0 ? "addLiquidity" : "swap",
          userId: `user-${i % 5}`,
          poolId: `pool-${i % 3}`,
          params: {},
          result: {
            success: true,
            transactionId: `tx-${i}`,
            gasUsed: new BN(100000 + i * 1000),
            gasPrice: new BN(1000000000),
            blockNumber: 12345 + i,
            timestamp: new Date(Date.now() - i * 60000),
            events: [],
          },
          timestamp: new Date(Date.now() - i * 60000),
        };
        stateManager.addTransaction(transaction);
      }

      const allTransactions = stateManager.getAllTransactions();
      expect(allTransactions).toHaveLength(50);

      // Test sorting by timestamp (most recent first)
      const sortedTransactions = allTransactions.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
      expect(sortedTransactions[0].id).toBe("tx-0");
      expect(sortedTransactions[49].id).toBe("tx-49");

      // Test user transaction distribution
      const user0Transactions = stateManager.getUserTransactions("user-0");
      expect(user0Transactions).toHaveLength(10); // Every 5th transaction

      // Test pool transaction distribution
      const pool0Transactions = stateManager.getPoolTransactions("pool-0");
      expect(pool0Transactions.length).toBeGreaterThan(15); // Roughly 1/3 of transactions
    });
  });

  describe("State Validation and Integrity", () => {
    it("should validate state consistency", () => {
      const poolId = "validation-pool";
      const userId = "validation-user";

      // Create pool
      const poolState: MockPoolState = {
        poolId,
        metadata: {
          assetA: mockAssetA,
          assetB: mockAssetB,
          binStep: 25,
          baseFactor: new BN(5000),
          filterPeriod: new BN(30),
          decayPeriod: new BN(600),
          reductionFactor: new BN(5000),
          variableFeeControl: new BN(40000),
          protocolShare: new BN(1000),
          maxVolatilityAccumulator: new BN(350000),
          isOpen: true,
        },
        bins: new Map(),
        activeBinId: 8388608,
        totalReserves: {assetA: new BN(1000000), assetB: new BN(2000000)},
        protocolFees: {assetA: new BN(10), assetB: new BN(20)},
        volume24h: new BN(50000),
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      stateManager.setPool(poolId, poolState);

      // Add bin with liquidity
      const binState: MockBinState = {
        binId: 8388608,
        reserves: {assetA: new BN(500000), assetB: new BN(1000000)},
        totalLpTokens: new BN(750000),
        price: new BN(1000000),
        isActive: true,
      };

      const updatedPoolState = stateManager.getPool(poolId)!;
      updatedPoolState.bins.set(8388608, binState);
      stateManager.setPool(poolId, updatedPoolState);

      // Add user position
      const binPosition: MockBinPosition = {
        binId: 8388608,
        lpTokenAmount: new BN(375000), // Half of total LP tokens
        underlyingAmounts: {assetA: new BN(250000), assetB: new BN(500000)},
        feesEarned: {assetA: new BN(2500), assetB: new BN(5000)},
        entryPrice: new BN(1000000),
        entryTime: new Date(),
      };

      stateManager.updateUserBinPosition(userId, poolId, binPosition);

      // Validate consistency
      const pool = stateManager.getPool(poolId)!;
      const position = stateManager.getUserPosition(userId, poolId)!;
      const bin = pool.bins.get(8388608)!;

      // User should own half the LP tokens
      expect(position.binPositions.get(8388608)!.lpTokenAmount.toString()).toBe(
        "375000"
      );
      expect(bin.totalLpTokens.toString()).toBe("750000");

      // User's underlying amounts should be proportional
      const userShare =
        position.binPositions
          .get(8388608)!
          .lpTokenAmount.mul(new BN(10000))
          .div(bin.totalLpTokens)
          .toNumber() / 10000;
      expect(userShare).toBeCloseTo(0.5, 2);
    });

    it("should handle state corruption gracefully", () => {
      // Test with invalid pool data
      expect(() => {
        stateManager.setPool("", {} as MockPoolState);
      }).toThrow();

      // Test with null/undefined values
      expect(() => {
        stateManager.updateUserPosition("", "", null as any);
      }).toThrow();

      // Test with negative values
      const invalidBinPosition: MockBinPosition = {
        binId: 8388608,
        lpTokenAmount: new BN("-1000000"), // Negative amount
        underlyingAmounts: {assetA: new BN("500000"), assetB: new BN("500000")},
        feesEarned: {assetA: new BN("5000"), assetB: new BN("5000")},
        entryPrice: new BN("1000000"),
        entryTime: new Date(),
      };

      expect(() => {
        stateManager.updateUserBinPosition("user", "pool", invalidBinPosition);
      }).toThrow();
    });
  });

  describe("Performance and Memory Management", () => {
    it("should handle large datasets efficiently", () => {
      const startTime = Date.now();

      // Create many pools
      for (let i = 0; i < 100; i++) {
        const poolState: MockPoolState = {
          poolId: `pool-${i}`,
          metadata: {
            assetA: {bits: `0x${i.toString(16).padStart(64, "0")}`} as AssetId,
            assetB: mockAssetB,
            binStep: 25,
            baseFactor: new BN(5000),
            filterPeriod: new BN(30),
            decayPeriod: new BN(600),
            reductionFactor: new BN(5000),
            variableFeeControl: new BN(40000),
            protocolShare: new BN(1000),
            maxVolatilityAccumulator: new BN(350000),
            isOpen: true,
          },
          bins: new Map(),
          activeBinId: 8388608,
          totalReserves: {assetA: new BN(1000000), assetB: new BN(2000000)},
          protocolFees: {assetA: new BN(10), assetB: new BN(20)},
          volume24h: new BN(50000),
          createdAt: new Date(),
          lastUpdated: new Date(),
        };
        stateManager.setPool(`pool-${i}`, poolState);
      }

      // Create many positions
      for (let i = 0; i < 100; i++) {
        for (let j = 0; j < 10; j++) {
          const binPosition: MockBinPosition = {
            binId: 8388608 + j,
            lpTokenAmount: new BN(1000000),
            underlyingAmounts: {assetA: new BN(500000), assetB: new BN(500000)},
            feesEarned: {assetA: new BN(5000), assetB: new BN(5000)},
            entryPrice: new BN(1000000),
            entryTime: new Date(),
          };
          stateManager.updateUserBinPosition(
            `user-${i}`,
            `pool-${i % 10}`,
            binPosition
          );
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);

      // Verify data integrity
      expect(stateManager.getAllPools()).toHaveLength(100);

      const user0Positions = stateManager.getUserPositions("user-0");
      expect(user0Positions).toHaveLength(1);
      expect(user0Positions[0].binPositions.size).toBe(10);
    });

    it("should clean up resources properly", () => {
      // Add data
      for (let i = 0; i < 10; i++) {
        const poolState: MockPoolState = {
          poolId: `cleanup-pool-${i}`,
          metadata: {
            assetA: mockAssetA,
            assetB: mockAssetB,
            binStep: 25,
            baseFactor: new BN(5000),
            filterPeriod: new BN(30),
            decayPeriod: new BN(600),
            reductionFactor: new BN(5000),
            variableFeeControl: new BN(40000),
            protocolShare: new BN(1000),
            maxVolatilityAccumulator: new BN(350000),
            isOpen: true,
          },
          bins: new Map(),
          activeBinId: 8388608,
          totalReserves: {assetA: new BN(1000000), assetB: new BN(2000000)},
          protocolFees: {assetA: new BN(10), assetB: new BN(20)},
          volume24h: new BN(50000),
          createdAt: new Date(),
          lastUpdated: new Date(),
        };
        stateManager.setPool(`cleanup-pool-${i}`, poolState);
      }

      expect(stateManager.getAllPools()).toHaveLength(10);

      // Reset should clean everything
      stateManager.reset();

      expect(stateManager.getAllPools()).toHaveLength(0);
      expect(stateManager.getAllTransactions()).toHaveLength(0);
      expect(stateManager.getUserPositions("any-user")).toHaveLength(0);
    });
  });
});

import {BN} from "fuels";
import {MockStateManager} from "../MockStateManager";
import {
  MockSDKConfig,
  MockPoolState,
  MockUserPosition,
  MockTransaction,
  MockBinPosition,
  MockPoolScenario,
  MockTransactionResult,
} from "../types";
import {PoolIdV2, AssetId} from "../../model";
import {vi} from "vitest";
import {it} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";
import {beforeEach} from "node:test";
import {describe} from "node:test";

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

describe("MockStateManager", () => {
  let stateManager: MockStateManager;
  let mockConfig: MockSDKConfig;
  let mockPoolId: PoolIdV2;
  let mockAssetA: AssetId;
  let mockAssetB: AssetId;

  beforeEach(() => {
    // Reset localStorage mock
    mockLocalStorage.store.clear();
    vi.clearAllMocks();

    // Create mock assets
    mockAssetA = {bits: "0x1234"} as AssetId;
    mockAssetB = {bits: "0x5678"} as AssetId;

    // Create mock pool ID
    mockPoolId = {
      assetA: mockAssetA,
      assetB: mockAssetB,
      binStep: 25,
    };

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

  describe("Pool State Management", () => {
    it("should set and get pool state", () => {
      const poolState: MockPoolState = {
        poolId: "test-pool",
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
        totalReserves: {assetA: new BN(1000), assetB: new BN(2000)},
        protocolFees: {assetA: new BN(10), assetB: new BN(20)},
        volume24h: new BN(50000),
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      stateManager.setPool("test-pool", poolState);
      const retrieved = stateManager.getPool("test-pool");

      expect(retrieved).toBeTruthy();
      expect(retrieved!.poolId).toBe("test-pool");
      expect(retrieved!.totalReserves.assetA.toString()).toBe("1000");
      expect(retrieved!.totalReserves.assetB.toString()).toBe("2000");
    });

    it("should work with PoolIdV2 objects", () => {
      const poolState: MockPoolState = {
        poolId: "test-pool-v2",
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
        totalReserves: {assetA: new BN(1000), assetB: new BN(2000)},
        protocolFees: {assetA: new BN(10), assetB: new BN(20)},
        volume24h: new BN(50000),
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      stateManager.setPool(mockPoolId, poolState);
      const retrieved = stateManager.getPool(mockPoolId);

      expect(retrieved).toBeTruthy();
      expect(retrieved!.poolId).toBe("test-pool-v2");
    });

    it("should update existing pool state", () => {
      const poolState: MockPoolState = {
        poolId: "test-pool",
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
        totalReserves: {assetA: new BN(1000), assetB: new BN(2000)},
        protocolFees: {assetA: new BN(10), assetB: new BN(20)},
        volume24h: new BN(50000),
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      stateManager.setPool("test-pool", poolState);

      const updated = stateManager.updatePool("test-pool", {
        volume24h: new BN(75000),
        activeBinId: 8388609,
      });

      expect(updated).toBeTruthy();
      expect(updated!.volume24h.toString()).toBe("75000");
      expect(updated!.activeBinId).toBe(8388609);
    });

    it("should remove pool state", () => {
      const poolState: MockPoolState = {
        poolId: "test-pool",
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
        totalReserves: {assetA: new BN(1000), assetB: new BN(2000)},
        protocolFees: {assetA: new BN(10), assetB: new BN(20)},
        volume24h: new BN(50000),
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      stateManager.setPool("test-pool", poolState);
      expect(stateManager.hasPool("test-pool")).toBe(true);

      const removed = stateManager.removePool("test-pool");
      expect(removed).toBe(true);
      expect(stateManager.hasPool("test-pool")).toBe(false);
    });

    it("should get all pools", () => {
      const poolState1: MockPoolState = {
        poolId: "pool-1",
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
        totalReserves: {assetA: new BN(1000), assetB: new BN(2000)},
        protocolFees: {assetA: new BN(10), assetB: new BN(20)},
        volume24h: new BN(50000),
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      const poolState2: MockPoolState = {
        ...poolState1,
        poolId: "pool-2",
      };

      stateManager.setPool("pool-1", poolState1);
      stateManager.setPool("pool-2", poolState2);

      const allPools = stateManager.getAllPools();
      expect(allPools).toHaveLength(2);
      expect(allPools.map((p) => p.poolId)).toContain("pool-1");
      expect(allPools.map((p) => p.poolId)).toContain("pool-2");
    });
  });

  describe("User Position Management", () => {
    it("should set and get user positions", () => {
      const position: MockUserPosition = {
        userId: "user-1",
        poolId: "pool-1",
        binPositions: new Map(),
        totalValue: {assetA: new BN(500), assetB: new BN(1000)},
        totalFeesEarned: {assetA: new BN(5), assetB: new BN(10)},
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      stateManager.updateUserPosition("user-1", "pool-1", position);
      const retrieved = stateManager.getUserPosition("user-1", "pool-1");

      expect(retrieved).toBeTruthy();
      expect(retrieved!.userId).toBe("user-1");
      expect(retrieved!.poolId).toBe("pool-1");
      expect(retrieved!.totalValue.assetA.toString()).toBe("500");
    });

    it("should update bin positions", () => {
      const binPosition: MockBinPosition = {
        binId: 8388608,
        lpTokenAmount: new BN(1000),
        underlyingAmounts: {assetA: new BN(500), assetB: new BN(500)},
        feesEarned: {assetA: new BN(5), assetB: new BN(5)},
        entryPrice: new BN(1000000),
        entryTime: new Date(),
      };

      stateManager.updateUserBinPosition("user-1", "pool-1", binPosition);
      const position = stateManager.getUserPosition("user-1", "pool-1");

      expect(position).toBeTruthy();
      expect(position!.binPositions.has(8388608)).toBe(true);
      expect(position!.totalValue.assetA.toString()).toBe("500");
      expect(position!.totalValue.assetB.toString()).toBe("500");
    });

    it("should remove bin positions", () => {
      const binPosition: MockBinPosition = {
        binId: 8388608,
        lpTokenAmount: new BN(1000),
        underlyingAmounts: {assetA: new BN(500), assetB: new BN(500)},
        feesEarned: {assetA: new BN(5), assetB: new BN(5)},
        entryPrice: new BN(1000000),
        entryTime: new Date(),
      };

      stateManager.updateUserBinPosition("user-1", "pool-1", binPosition);
      expect(stateManager.getUserPosition("user-1", "pool-1")).toBeTruthy();

      const removed = stateManager.removeUserBinPosition(
        "user-1",
        "pool-1",
        8388608
      );
      expect(removed).toBe(true);

      // Position should be completely removed since no bins left
      expect(stateManager.getUserPosition("user-1", "pool-1")).toBeNull();
    });

    it("should get all user positions", () => {
      const position1: MockUserPosition = {
        userId: "user-1",
        poolId: "pool-1",
        binPositions: new Map(),
        totalValue: {assetA: new BN(500), assetB: new BN(1000)},
        totalFeesEarned: {assetA: new BN(5), assetB: new BN(10)},
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      const position2: MockUserPosition = {
        userId: "user-1",
        poolId: "pool-2",
        binPositions: new Map(),
        totalValue: {assetA: new BN(300), assetB: new BN(600)},
        totalFeesEarned: {assetA: new BN(3), assetB: new BN(6)},
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      stateManager.updateUserPosition("user-1", "pool-1", position1);
      stateManager.updateUserPosition("user-1", "pool-2", position2);

      const userPositions = stateManager.getUserPositions("user-1");
      expect(userPositions).toHaveLength(2);
      expect(userPositions.map((p) => p.poolId)).toContain("pool-1");
      expect(userPositions.map((p) => p.poolId)).toContain("pool-2");
    });

    it("should get pool positions", () => {
      const position1: MockUserPosition = {
        userId: "user-1",
        poolId: "pool-1",
        binPositions: new Map(),
        totalValue: {assetA: new BN(500), assetB: new BN(1000)},
        totalFeesEarned: {assetA: new BN(5), assetB: new BN(10)},
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      const position2: MockUserPosition = {
        userId: "user-2",
        poolId: "pool-1",
        binPositions: new Map(),
        totalValue: {assetA: new BN(300), assetB: new BN(600)},
        totalFeesEarned: {assetA: new BN(3), assetB: new BN(6)},
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      stateManager.updateUserPosition("user-1", "pool-1", position1);
      stateManager.updateUserPosition("user-2", "pool-1", position2);

      const poolPositions = stateManager.getPoolPositions("pool-1");
      expect(poolPositions).toHaveLength(2);
      expect(poolPositions.map((p) => p.userId)).toContain("user-1");
      expect(poolPositions.map((p) => p.userId)).toContain("user-2");
    });
  });

  describe("Transaction History Management", () => {
    it("should add and get transactions", () => {
      const transaction: MockTransaction = {
        id: "tx-1",
        type: "addLiquidity",
        userId: "user-1",
        poolId: "pool-1",
        params: {amount: "1000"},
        result: {
          success: true,
          transactionId: "tx-1",
          gasUsed: new BN(21000),
          gasPrice: new BN(1000000000),
          blockNumber: 12345,
          timestamp: new Date(),
          events: [],
        },
        timestamp: new Date(),
      };

      stateManager.addTransaction(transaction);
      const retrieved = stateManager.getTransaction("tx-1");

      expect(retrieved).toBeTruthy();
      expect(retrieved!.id).toBe("tx-1");
      expect(retrieved!.type).toBe("addLiquidity");
      expect(retrieved!.userId).toBe("user-1");
    });

    it("should get user transactions", () => {
      const transaction1: MockTransaction = {
        id: "tx-1",
        type: "addLiquidity",
        userId: "user-1",
        poolId: "pool-1",
        params: {},
        result: {
          success: true,
          transactionId: "tx-1",
          gasUsed: new BN(21000),
          gasPrice: new BN(1000000000),
          blockNumber: 12345,
          timestamp: new Date(),
          events: [],
        },
        timestamp: new Date(),
      };

      const transaction2: MockTransaction = {
        id: "tx-2",
        type: "swap",
        userId: "user-1",
        poolId: "pool-1",
        params: {},
        result: {
          success: true,
          transactionId: "tx-2",
          gasUsed: new BN(21000),
          gasPrice: new BN(1000000000),
          blockNumber: 12346,
          timestamp: new Date(),
          events: [],
        },
        timestamp: new Date(),
      };

      const transaction3: MockTransaction = {
        id: "tx-3",
        type: "addLiquidity",
        userId: "user-2",
        poolId: "pool-1",
        params: {},
        result: {
          success: true,
          transactionId: "tx-3",
          gasUsed: new BN(21000),
          gasPrice: new BN(1000000000),
          blockNumber: 12347,
          timestamp: new Date(),
          events: [],
        },
        timestamp: new Date(),
      };

      stateManager.addTransaction(transaction1);
      stateManager.addTransaction(transaction2);
      stateManager.addTransaction(transaction3);

      const userTransactions = stateManager.getUserTransactions("user-1");
      expect(userTransactions).toHaveLength(2);
      expect(userTransactions.map((tx) => tx.id)).toContain("tx-1");
      expect(userTransactions.map((tx) => tx.id)).toContain("tx-2");
    });

    it("should get pool transactions", () => {
      const transaction1: MockTransaction = {
        id: "tx-1",
        type: "addLiquidity",
        userId: "user-1",
        poolId: "pool-1",
        params: {},
        result: {
          success: true,
          transactionId: "tx-1",
          gasUsed: new BN(21000),
          gasPrice: new BN(1000000000),
          blockNumber: 12345,
          timestamp: new Date(),
          events: [],
        },
        timestamp: new Date(),
      };

      const transaction2: MockTransaction = {
        id: "tx-2",
        type: "swap",
        userId: "user-2",
        poolId: "pool-2",
        params: {},
        result: {
          success: true,
          transactionId: "tx-2",
          gasUsed: new BN(21000),
          gasPrice: new BN(1000000000),
          blockNumber: 12346,
          timestamp: new Date(),
          events: [],
        },
        timestamp: new Date(),
      };

      stateManager.addTransaction(transaction1);
      stateManager.addTransaction(transaction2);

      const poolTransactions = stateManager.getPoolTransactions("pool-1");
      expect(poolTransactions).toHaveLength(1);
      expect(poolTransactions[0].id).toBe("tx-1");
    });
  });

  describe("State Management", () => {
    it("should reset all state", () => {
      // Add some data
      const poolState: MockPoolState = {
        poolId: "test-pool",
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
        totalReserves: {assetA: new BN(1000), assetB: new BN(2000)},
        protocolFees: {assetA: new BN(10), assetB: new BN(20)},
        volume24h: new BN(50000),
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      const position: MockUserPosition = {
        userId: "user-1",
        poolId: "pool-1",
        binPositions: new Map(),
        totalValue: {assetA: new BN(500), assetB: new BN(1000)},
        totalFeesEarned: {assetA: new BN(5), assetB: new BN(10)},
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      const transaction: MockTransaction = {
        id: "tx-1",
        type: "addLiquidity",
        userId: "user-1",
        poolId: "pool-1",
        params: {},
        result: {
          success: true,
          transactionId: "tx-1",
          gasUsed: new BN(21000),
          gasPrice: new BN(1000000000),
          blockNumber: 12345,
          timestamp: new Date(),
          events: [],
        },
        timestamp: new Date(),
      };

      stateManager.setPool("test-pool", poolState);
      stateManager.updateUserPosition("user-1", "pool-1", position);
      stateManager.addTransaction(transaction);

      // Verify data exists
      expect(stateManager.getAllPools()).toHaveLength(1);
      expect(stateManager.getUserPositions("user-1")).toHaveLength(1);
      expect(stateManager.getAllTransactions()).toHaveLength(1);

      // Reset
      stateManager.reset();

      // Verify data is cleared
      expect(stateManager.getAllPools()).toHaveLength(0);
      expect(stateManager.getUserPositions("user-1")).toHaveLength(0);
      expect(stateManager.getAllTransactions()).toHaveLength(0);
    });

    it("should update configuration", () => {
      const initialConfig = stateManager.getConfig();
      expect(initialConfig.defaultFailureRate).toBe(0.05);

      stateManager.updateConfig({defaultFailureRate: 0.1});
      const updatedConfig = stateManager.getConfig();
      expect(updatedConfig.defaultFailureRate).toBe(0.1);
    });
  });

  describe("Persistence", () => {
    it("should persist and restore state when enabled", () => {
      const persistentStateManager = new MockStateManager({
        ...mockConfig,
        enablePersistence: true,
      });

      const poolState: MockPoolState = {
        poolId: "test-pool",
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
        totalReserves: {assetA: new BN(1000), assetB: new BN(2000)},
        protocolFees: {assetA: new BN(10), assetB: new BN(20)},
        volume24h: new BN(50000),
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      persistentStateManager.setPool("test-pool", poolState);

      // Verify localStorage was called
      expect(mockLocalStorage.setItem).toHaveBeenCalled();

      // Create new state manager to test restoration
      const newStateManager = new MockStateManager({
        ...mockConfig,
        enablePersistence: true,
      });

      // Should restore the pool
      const restoredPool = newStateManager.getPool("test-pool");
      expect(restoredPool).toBeTruthy();
      expect(restoredPool!.poolId).toBe("test-pool");
    });

    it("should not persist when disabled", () => {
      const poolState: MockPoolState = {
        poolId: "test-pool",
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
        totalReserves: {assetA: new BN(1000), assetB: new BN(2000)},
        protocolFees: {assetA: new BN(10), assetB: new BN(20)},
        volume24h: new BN(50000),
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      stateManager.setPool("test-pool", poolState);

      // Verify localStorage was not called
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe("Pool Scenarios", () => {
    it("should load initial pool scenarios", () => {
      const scenario: MockPoolScenario = {
        name: "Test Scenario",
        description: "A test scenario",
        poolConfig: {
          poolId: "scenario-pool",
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
          activeBinId: 8388608,
        },
        bins: [
          {
            binId: 8388608,
            reserves: {assetA: new BN(1000), assetB: new BN(1000)},
            lpTokens: new BN(1000),
          },
        ],
        positions: [
          {
            userId: "test-user",
            binPositions: [
              {
                binId: 8388608,
                lpTokenAmount: new BN(500),
              },
            ],
          },
        ],
      };

      const scenarioStateManager = new MockStateManager({
        ...mockConfig,
        initialPoolScenarios: [scenario],
      });

      // Should have loaded the pool
      const pool = scenarioStateManager.getPool("scenario-pool");
      expect(pool).toBeTruthy();
      expect(pool!.bins.has(8388608)).toBe(true);

      // Should have loaded the position
      const position = scenarioStateManager.getUserPosition(
        "test-user",
        "scenario-pool"
      );
      expect(position).toBeTruthy();
      expect(position!.binPositions.has(8388608)).toBe(true);
    });
  });
});

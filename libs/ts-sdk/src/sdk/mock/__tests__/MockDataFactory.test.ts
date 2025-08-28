import {BN} from "fuels";
import {MockDataFactory} from "../MockDataFactory";
import {StateValidator} from "../StateValidator";
import {
  MockPoolState,
  MockBinState,
  MockUserPosition,
  MockBinPosition,
} from "../types";
import {PoolMetadataV2, AssetId} from "../../model";

describe("MockDataFactory", () => {
  const mockAssetA: AssetId = {bits: "0x1234567890abcdef"};
  const mockAssetB: AssetId = {bits: "0xfedcba0987654321"};

  const mockMetadata: PoolMetadataV2 = {
    assetA: mockAssetA,
    assetB: mockAssetB,
    binStep: 25,
    baseFactor: new BN(10000),
    filterPeriod: 30,
    decayPeriod: 600,
    reductionFactor: 5000,
    variableFeeControl: 40000,
    protocolShare: 1000,
    maxVolatilityAccumulator: new BN(350000),
    isOpen: true,
  };

  describe("createBinState", () => {
    it("should create a valid bin state", () => {
      const binState = MockDataFactory.createBinState({
        binId: 100,
        reserves: {assetA: new BN(1000), assetB: new BN(2000)},
        lpTokens: new BN(1500),
        price: new BN(2),
        isActive: true,
      });

      expect(binState.binId).toBe(100);
      expect(binState.reserves.assetA.toString()).toBe("1000");
      expect(binState.reserves.assetB.toString()).toBe("2000");
      expect(binState.totalLpTokens.toString()).toBe("1500");
      expect(binState.price.toString()).toBe("2");
      expect(binState.isActive).toBe(true);

      // Should pass validation
      const validation = StateValidator.validateBinState(binState);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should create inactive bin by default", () => {
      const binState = MockDataFactory.createBinState({
        binId: 100,
        reserves: {assetA: new BN(1000), assetB: new BN(2000)},
        lpTokens: new BN(1500),
        price: new BN(2),
      });

      expect(binState.isActive).toBe(false);
    });

    it("should throw on invalid bin state", () => {
      expect(() => {
        MockDataFactory.createBinState({
          binId: 100,
          reserves: {assetA: new BN(-1000), assetB: new BN(2000)}, // Negative reserves
          lpTokens: new BN(1500),
          price: new BN(2),
        });
      }).toThrow();
    });
  });

  describe("createBinPosition", () => {
    it("should create a valid bin position", () => {
      const entryTime = new Date();
      const binPosition = MockDataFactory.createBinPosition({
        binId: 100,
        lpTokenAmount: new BN(1000),
        underlyingAmounts: {assetA: new BN(500), assetB: new BN(1000)},
        feesEarned: {assetA: new BN(10), assetB: new BN(20)},
        entryPrice: new BN(2),
        entryTime,
      });

      expect(binPosition.binId).toBe(100);
      expect(binPosition.lpTokenAmount.toString()).toBe("1000");
      expect(binPosition.underlyingAmounts.assetA.toString()).toBe("500");
      expect(binPosition.underlyingAmounts.assetB.toString()).toBe("1000");
      expect(binPosition.feesEarned.assetA.toString()).toBe("10");
      expect(binPosition.feesEarned.assetB.toString()).toBe("20");
      expect(binPosition.entryPrice.toString()).toBe("2");
      expect(binPosition.entryTime).toBe(entryTime);

      // Should pass validation
      const validation = StateValidator.validateBinPosition(binPosition);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should throw on invalid bin position", () => {
      expect(() => {
        MockDataFactory.createBinPosition({
          binId: 100,
          lpTokenAmount: new BN(-1000), // Negative LP tokens
          underlyingAmounts: {assetA: new BN(500), assetB: new BN(1000)},
          feesEarned: {assetA: new BN(10), assetB: new BN(20)},
          entryPrice: new BN(2),
          entryTime: new Date(),
        });
      }).toThrow();
    });
  });

  describe("createUserPosition", () => {
    it("should create a valid user position without bin positions", () => {
      const position = MockDataFactory.createUserPosition({
        userId: "user123",
        poolId: "pool456",
      });

      expect(position.userId).toBe("user123");
      expect(position.poolId).toBe("pool456");
      expect(position.binPositions.size).toBe(0);
      expect(position.totalValue.assetA.toString()).toBe("0");
      expect(position.totalValue.assetB.toString()).toBe("0");
      expect(position.totalFeesEarned.assetA.toString()).toBe("0");
      expect(position.totalFeesEarned.assetB.toString()).toBe("0");

      // Should pass validation
      const validation = StateValidator.validateUserPosition(position);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should create a valid user position with bin positions", () => {
      const position = MockDataFactory.createUserPosition({
        userId: "user123",
        poolId: "pool456",
        binPositions: [
          {
            binId: 100,
            lpTokenAmount: new BN(1000),
            underlyingAmounts: {assetA: new BN(500), assetB: new BN(1000)},
            feesEarned: {assetA: new BN(10), assetB: new BN(20)},
            entryPrice: new BN(2),
          },
          {
            binId: 101,
            lpTokenAmount: new BN(2000),
            underlyingAmounts: {assetA: new BN(1000), assetB: new BN(2000)},
            feesEarned: {assetA: new BN(20), assetB: new BN(40)},
            entryPrice: new BN(2),
          },
        ],
      });

      expect(position.binPositions.size).toBe(2);
      expect(position.totalValue.assetA.toString()).toBe("1500"); // 500 + 1000
      expect(position.totalValue.assetB.toString()).toBe("3000"); // 1000 + 2000
      expect(position.totalFeesEarned.assetA.toString()).toBe("30"); // 10 + 20
      expect(position.totalFeesEarned.assetB.toString()).toBe("60"); // 20 + 40

      // Should pass validation
      const validation = StateValidator.validateUserPosition(position);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should throw on invalid user position", () => {
      expect(() => {
        MockDataFactory.createUserPosition({
          userId: "", // Empty user ID
          poolId: "pool456",
        });
      }).toThrow();
    });
  });

  describe("createPoolState", () => {
    it("should create a valid pool state with bins", () => {
      const poolState = MockDataFactory.createPoolState({
        poolId: "pool123",
        metadata: mockMetadata,
        activeBinId: 100,
        bins: [
          {
            binId: 99,
            reserves: {assetA: new BN(1000), assetB: new BN(0)},
            lpTokens: new BN(1000),
            price: new BN(1),
          },
          {
            binId: 100,
            reserves: {assetA: new BN(500), assetB: new BN(500)},
            lpTokens: new BN(1000),
            price: new BN(1),
          },
          {
            binId: 101,
            reserves: {assetA: new BN(0), assetB: new BN(1000)},
            lpTokens: new BN(1000),
            price: new BN(1),
          },
        ],
      });

      expect(poolState.poolId).toBe("pool123");
      expect(poolState.metadata).toBe(mockMetadata);
      expect(poolState.activeBinId).toBe(100);
      expect(poolState.bins.size).toBe(3);
      expect(poolState.totalReserves.assetA.toString()).toBe("1500"); // 1000 + 500 + 0
      expect(poolState.totalReserves.assetB.toString()).toBe("1500"); // 0 + 500 + 1000

      // Active bin should be marked as active
      const activeBin = poolState.bins.get(100);
      expect(activeBin?.isActive).toBe(true);

      // Other bins should not be active
      const bin99 = poolState.bins.get(99);
      const bin101 = poolState.bins.get(101);
      expect(bin99?.isActive).toBe(false);
      expect(bin101?.isActive).toBe(false);

      // Should pass validation
      const validation = StateValidator.validatePoolState(poolState);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should create a valid pool state without bins (creates active bin)", () => {
      const poolState = MockDataFactory.createPoolState({
        poolId: "pool123",
        metadata: mockMetadata,
        activeBinId: 100,
      });

      expect(poolState.bins.size).toBe(1);
      expect(poolState.bins.has(100)).toBe(true);

      const activeBin = poolState.bins.get(100);
      expect(activeBin?.isActive).toBe(true);
      expect(activeBin?.reserves.assetA.toString()).toBe("0");
      expect(activeBin?.reserves.assetB.toString()).toBe("0");

      // Should pass validation
      const validation = StateValidator.validatePoolState(poolState);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should throw on invalid pool state", () => {
      expect(() => {
        MockDataFactory.createPoolState({
          poolId: "", // Empty pool ID
          metadata: mockMetadata,
          activeBinId: 100,
        });
      }).toThrow();
    });
  });

  describe("createSimplePool", () => {
    it("should create a simple pool with uniform distribution", () => {
      const poolState = MockDataFactory.createSimplePool({
        poolId: "simple-pool",
        assetA: mockAssetA,
        assetB: mockAssetB,
        binStep: 25,
        activeBinId: 100,
        totalLiquidityA: new BN(10000),
        totalLiquidityB: new BN(20000),
        binCount: 5,
        basePrice: new BN(2),
      });

      expect(poolState.poolId).toBe("simple-pool");
      expect(poolState.activeBinId).toBe(100);
      expect(poolState.bins.size).toBe(5);

      // Should have bins around the active bin
      expect(poolState.bins.has(98)).toBe(true);
      expect(poolState.bins.has(99)).toBe(true);
      expect(poolState.bins.has(100)).toBe(true);
      expect(poolState.bins.has(101)).toBe(true);
      expect(poolState.bins.has(102)).toBe(true);

      // Active bin should be marked as active
      const activeBin = poolState.bins.get(100);
      expect(activeBin?.isActive).toBe(true);

      // Should pass validation
      const validation = StateValidator.validatePoolState(poolState);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should create a simple pool with default parameters", () => {
      const poolState = MockDataFactory.createSimplePool({
        poolId: "simple-pool",
        assetA: mockAssetA,
        assetB: mockAssetB,
        binStep: 25,
        activeBinId: 100,
        totalLiquidityA: new BN(10000),
        totalLiquidityB: new BN(20000),
      });

      expect(poolState.bins.size).toBe(5); // Default bin count
      expect(poolState.bins.get(100)?.price.toString()).toBe("1"); // Default base price

      // Should pass validation
      const validation = StateValidator.validatePoolState(poolState);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe("createEmptyPool", () => {
    it("should create an empty pool with only active bin", () => {
      const poolState = MockDataFactory.createEmptyPool({
        poolId: "empty-pool",
        assetA: mockAssetA,
        assetB: mockAssetB,
        binStep: 25,
        activeBinId: 100,
        initialPrice: new BN(5),
      });

      expect(poolState.poolId).toBe("empty-pool");
      expect(poolState.activeBinId).toBe(100);
      expect(poolState.bins.size).toBe(1);
      expect(poolState.bins.has(100)).toBe(true);

      const activeBin = poolState.bins.get(100);
      expect(activeBin?.isActive).toBe(true);
      expect(activeBin?.reserves.assetA.toString()).toBe("0");
      expect(activeBin?.reserves.assetB.toString()).toBe("0");
      expect(activeBin?.price.toString()).toBe("5");

      // Should pass validation
      const validation = StateValidator.validatePoolState(poolState);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should create an empty pool with default price", () => {
      const poolState = MockDataFactory.createEmptyPool({
        poolId: "empty-pool",
        assetA: mockAssetA,
        assetB: mockAssetB,
        binStep: 25,
        activeBinId: 100,
      });

      const activeBin = poolState.bins.get(100);
      expect(activeBin?.price.toString()).toBe("1"); // Default price
    });
  });

  describe("clonePoolState", () => {
    let originalPool: MockPoolState;

    beforeEach(() => {
      originalPool = MockDataFactory.createSimplePool({
        poolId: "original-pool",
        assetA: mockAssetA,
        assetB: mockAssetB,
        binStep: 25,
        activeBinId: 100,
        totalLiquidityA: new BN(10000),
        totalLiquidityB: new BN(20000),
      });
    });

    it("should clone pool state without modifications", () => {
      const cloned = MockDataFactory.clonePoolState(originalPool);

      expect(cloned.poolId).toBe(originalPool.poolId);
      expect(cloned.activeBinId).toBe(originalPool.activeBinId);
      expect(cloned.bins.size).toBe(originalPool.bins.size);
      expect(cloned.totalReserves.assetA.toString()).toBe(
        originalPool.totalReserves.assetA.toString()
      );
      expect(cloned.totalReserves.assetB.toString()).toBe(
        originalPool.totalReserves.assetB.toString()
      );

      // Should be different objects
      expect(cloned).not.toBe(originalPool);
      expect(cloned.bins).not.toBe(originalPool.bins);
      expect(cloned.totalReserves).not.toBe(originalPool.totalReserves);

      // Should pass validation
      const validation = StateValidator.validatePoolState(cloned);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should clone pool state with modifications", () => {
      const cloned = MockDataFactory.clonePoolState(originalPool, {
        poolId: "cloned-pool",
        volume24h: new BN(50000),
      });

      expect(cloned.poolId).toBe("cloned-pool");
      expect(cloned.volume24h.toString()).toBe("50000");
      expect(cloned.activeBinId).toBe(originalPool.activeBinId); // Unchanged

      // Should pass validation
      const validation = StateValidator.validatePoolState(cloned);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe("cloneUserPosition", () => {
    let originalPosition: MockUserPosition;

    beforeEach(() => {
      originalPosition = MockDataFactory.createUserPosition({
        userId: "user123",
        poolId: "pool456",
        binPositions: [
          {
            binId: 100,
            lpTokenAmount: new BN(1000),
            underlyingAmounts: {assetA: new BN(500), assetB: new BN(1000)},
            feesEarned: {assetA: new BN(10), assetB: new BN(20)},
            entryPrice: new BN(2),
          },
        ],
      });
    });

    it("should clone user position without modifications", () => {
      const cloned = MockDataFactory.cloneUserPosition(originalPosition);

      expect(cloned.userId).toBe(originalPosition.userId);
      expect(cloned.poolId).toBe(originalPosition.poolId);
      expect(cloned.binPositions.size).toBe(originalPosition.binPositions.size);
      expect(cloned.totalValue.assetA.toString()).toBe(
        originalPosition.totalValue.assetA.toString()
      );

      // Should be different objects
      expect(cloned).not.toBe(originalPosition);
      expect(cloned.binPositions).not.toBe(originalPosition.binPositions);
      expect(cloned.totalValue).not.toBe(originalPosition.totalValue);

      // Should pass validation
      const validation = StateValidator.validateUserPosition(cloned);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should clone user position with modifications", () => {
      const cloned = MockDataFactory.cloneUserPosition(originalPosition, {
        userId: "user456",
      });

      expect(cloned.userId).toBe("user456");
      expect(cloned.poolId).toBe(originalPosition.poolId); // Unchanged

      // Should pass validation
      const validation = StateValidator.validateUserPosition(cloned);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe("updateBinReserves", () => {
    let poolState: MockPoolState;

    beforeEach(() => {
      poolState = MockDataFactory.createSimplePool({
        poolId: "test-pool",
        assetA: mockAssetA,
        assetB: mockAssetB,
        binStep: 25,
        activeBinId: 100,
        totalLiquidityA: new BN(10000),
        totalLiquidityB: new BN(20000),
      });
    });

    it("should update bin reserves and pool totals", () => {
      const bin = poolState.bins.get(100)!;
      const oldReservesA = bin.reserves.assetA;
      const oldReservesB = bin.reserves.assetB;
      const oldTotalA = poolState.totalReserves.assetA;
      const oldTotalB = poolState.totalReserves.assetB;

      const newReserves = {assetA: new BN(5000), assetB: new BN(10000)};
      MockDataFactory.updateBinReserves(poolState, 100, newReserves);

      expect(bin.reserves.assetA.toString()).toBe("5000");
      expect(bin.reserves.assetB.toString()).toBe("10000");

      // Pool totals should be updated
      const expectedTotalA = oldTotalA
        .sub(oldReservesA)
        .add(newReserves.assetA);
      const expectedTotalB = oldTotalB
        .sub(oldReservesB)
        .add(newReserves.assetB);
      expect(poolState.totalReserves.assetA.toString()).toBe(
        expectedTotalA.toString()
      );
      expect(poolState.totalReserves.assetB.toString()).toBe(
        expectedTotalB.toString()
      );

      // Should pass validation
      const validation = StateValidator.validatePoolState(poolState);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should throw when bin doesn't exist", () => {
      expect(() => {
        MockDataFactory.updateBinReserves(poolState, 999, {
          assetA: new BN(1000),
          assetB: new BN(2000),
        });
      }).toThrow("Bin 999 not found");
    });
  });

  describe("addLiquidityToBin", () => {
    let poolState: MockPoolState;

    beforeEach(() => {
      poolState = MockDataFactory.createEmptyPool({
        poolId: "test-pool",
        assetA: mockAssetA,
        assetB: mockAssetB,
        binStep: 25,
        activeBinId: 100,
      });
    });

    it("should add liquidity to existing bin", () => {
      const liquidityToAdd = {assetA: new BN(1000), assetB: new BN(2000)};
      const lpTokensToMint = new BN(1500);

      MockDataFactory.addLiquidityToBin(
        poolState,
        100,
        liquidityToAdd,
        lpTokensToMint
      );

      const bin = poolState.bins.get(100)!;
      expect(bin.reserves.assetA.toString()).toBe("1000");
      expect(bin.reserves.assetB.toString()).toBe("2000");
      expect(bin.totalLpTokens.toString()).toBe("1500");

      expect(poolState.totalReserves.assetA.toString()).toBe("1000");
      expect(poolState.totalReserves.assetB.toString()).toBe("2000");

      // Should pass validation
      const validation = StateValidator.validatePoolState(poolState);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should create new bin when adding liquidity to non-existent bin", () => {
      const liquidityToAdd = {assetA: new BN(1000), assetB: new BN(2000)};
      const lpTokensToMint = new BN(1500);

      expect(poolState.bins.has(101)).toBe(false);

      MockDataFactory.addLiquidityToBin(
        poolState,
        101,
        liquidityToAdd,
        lpTokensToMint
      );

      expect(poolState.bins.has(101)).toBe(true);
      const bin = poolState.bins.get(101)!;
      expect(bin.reserves.assetA.toString()).toBe("1000");
      expect(bin.reserves.assetB.toString()).toBe("2000");
      expect(bin.totalLpTokens.toString()).toBe("1500");
      expect(bin.isActive).toBe(false); // Not the active bin

      // Should pass validation
      const validation = StateValidator.validatePoolState(poolState);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe("removeLiquidityFromBin", () => {
    let poolState: MockPoolState;

    beforeEach(() => {
      poolState = MockDataFactory.createSimplePool({
        poolId: "test-pool",
        assetA: mockAssetA,
        assetB: mockAssetB,
        binStep: 25,
        activeBinId: 100,
        totalLiquidityA: new BN(10000),
        totalLiquidityB: new BN(20000),
      });
    });

    it("should remove liquidity from bin", () => {
      const bin = poolState.bins.get(100)!;
      const initialReservesA = bin.reserves.assetA;
      const initialReservesB = bin.reserves.assetB;
      const initialLpTokens = bin.totalLpTokens;

      const liquidityToRemove = {assetA: new BN(100), assetB: new BN(200)};
      const lpTokensToBurn = new BN(150);

      MockDataFactory.removeLiquidityFromBin(
        poolState,
        100,
        liquidityToRemove,
        lpTokensToBurn
      );

      expect(bin.reserves.assetA.toString()).toBe(
        initialReservesA.sub(liquidityToRemove.assetA).toString()
      );
      expect(bin.reserves.assetB.toString()).toBe(
        initialReservesB.sub(liquidityToRemove.assetB).toString()
      );
      expect(bin.totalLpTokens.toString()).toBe(
        initialLpTokens.sub(lpTokensToBurn).toString()
      );

      // Should pass validation
      const validation = StateValidator.validatePoolState(poolState);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should remove empty bin after removing all liquidity", () => {
      // Add a small bin that we can completely empty
      MockDataFactory.addLiquidityToBin(
        poolState,
        105,
        {assetA: new BN(100), assetB: new BN(200)},
        new BN(150)
      );

      expect(poolState.bins.has(105)).toBe(true);

      // Remove all liquidity
      MockDataFactory.removeLiquidityFromBin(
        poolState,
        105,
        {assetA: new BN(100), assetB: new BN(200)},
        new BN(150)
      );

      expect(poolState.bins.has(105)).toBe(false);

      // Should pass validation
      const validation = StateValidator.validatePoolState(poolState);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should throw when bin doesn't exist", () => {
      expect(() => {
        MockDataFactory.removeLiquidityFromBin(
          poolState,
          999,
          {assetA: new BN(100), assetB: new BN(200)},
          new BN(150)
        );
      }).toThrow("Bin 999 not found");
    });

    it("should throw when insufficient liquidity", () => {
      const bin = poolState.bins.get(100)!;
      const excessiveLiquidity = {
        assetA: bin.reserves.assetA.add(1000),
        assetB: bin.reserves.assetB.add(1000),
      };

      expect(() => {
        MockDataFactory.removeLiquidityFromBin(
          poolState,
          100,
          excessiveLiquidity,
          new BN(100)
        );
      }).toThrow("Insufficient liquidity");
    });
  });
});

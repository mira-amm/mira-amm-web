import {BN} from "fuels";
import {
  MockPoolState,
  MockBinState,
  MockUserPosition,
  MockBinPosition,
} from "./types";
import {PoolMetadataV2, Amounts, AssetId} from "../model";
import {StateValidator} from "./StateValidator";

/**
 * Factory class for creating mock data structures with proper validation
 */
export class MockDataFactory {
  /**
   * Create a new MockPoolState with validation
   * @param config - Pool configuration
   * @returns Validated MockPoolState
   */
  static createPoolState(config: {
    poolId: string;
    metadata: PoolMetadataV2;
    activeBinId: number;
    bins?: Array<{
      binId: number;
      reserves: Amounts;
      lpTokens: BN;
      price: BN;
    }>;
    protocolFees?: Amounts;
    volume24h?: BN;
  }): MockPoolState {
    const poolState: MockPoolState = {
      poolId: config.poolId,
      metadata: config.metadata,
      bins: new Map(),
      activeBinId: config.activeBinId,
      totalReserves: {assetA: new BN(0), assetB: new BN(0)},
      protocolFees: config.protocolFees || {
        assetA: new BN(0),
        assetB: new BN(0),
      },
      volume24h: config.volume24h || new BN(0),
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    // Add bins if provided
    if (config.bins) {
      for (const binConfig of config.bins) {
        const binState = this.createBinState({
          binId: binConfig.binId,
          reserves: binConfig.reserves,
          lpTokens: binConfig.lpTokens,
          price: binConfig.price,
          isActive: binConfig.binId === config.activeBinId,
        });

        poolState.bins.set(binConfig.binId, binState);

        // Add to total reserves
        poolState.totalReserves.assetA = poolState.totalReserves.assetA.add(
          binConfig.reserves.assetA
        );
        poolState.totalReserves.assetB = poolState.totalReserves.assetB.add(
          binConfig.reserves.assetB
        );
      }
    } else {
      // Create at least the active bin if no bins provided
      const activeBin = this.createBinState({
        binId: config.activeBinId,
        reserves: {assetA: new BN(0), assetB: new BN(0)},
        lpTokens: new BN(0),
        price: new BN(1),
        isActive: true,
      });
      poolState.bins.set(config.activeBinId, activeBin);
    }

    // Validate the created pool state
    const validation = StateValidator.validatePoolState(poolState);
    StateValidator.validateOrThrow(validation, "Pool state creation");

    return poolState;
  }

  /**
   * Create a new MockBinState with validation
   * @param config - Bin configuration
   * @returns Validated MockBinState
   */
  static createBinState(config: {
    binId: number;
    reserves: Amounts;
    lpTokens: BN;
    price: BN;
    isActive?: boolean;
    lastSwapTime?: Date;
  }): MockBinState {
    const binState: MockBinState = {
      binId: config.binId,
      reserves: config.reserves,
      totalLpTokens: config.lpTokens,
      price: config.price,
      isActive: config.isActive || false,
      lastSwapTime: config.lastSwapTime,
    };

    // Validate the created bin state
    const validation = StateValidator.validateBinState(binState);
    StateValidator.validateOrThrow(validation, "Bin state creation");

    return binState;
  }

  /**
   * Create a new MockUserPosition with validation
   * @param config - Position configuration
   * @returns Validated MockUserPosition
   */
  static createUserPosition(config: {
    userId: string;
    poolId: string;
    binPositions?: Array<{
      binId: number;
      lpTokenAmount: BN;
      underlyingAmounts: Amounts;
      feesEarned?: Amounts;
      entryPrice: BN;
      entryTime?: Date;
    }>;
  }): MockUserPosition {
    const position: MockUserPosition = {
      userId: config.userId,
      poolId: config.poolId,
      binPositions: new Map(),
      totalValue: {assetA: new BN(0), assetB: new BN(0)},
      totalFeesEarned: {assetA: new BN(0), assetB: new BN(0)},
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    // Add bin positions if provided
    if (config.binPositions) {
      for (const binPosConfig of config.binPositions) {
        const binPosition = this.createBinPosition({
          binId: binPosConfig.binId,
          lpTokenAmount: binPosConfig.lpTokenAmount,
          underlyingAmounts: binPosConfig.underlyingAmounts,
          feesEarned: binPosConfig.feesEarned || {
            assetA: new BN(0),
            assetB: new BN(0),
          },
          entryPrice: binPosConfig.entryPrice,
          entryTime: binPosConfig.entryTime || new Date(),
        });

        position.binPositions.set(binPosConfig.binId, binPosition);
      }

      // Recalculate totals
      this.recalculatePositionTotals(position);
    }

    // Validate the created position
    const validation = StateValidator.validateUserPosition(position);
    StateValidator.validateOrThrow(validation, "User position creation");

    return position;
  }

  /**
   * Create a new MockBinPosition with validation
   * @param config - Bin position configuration
   * @returns Validated MockBinPosition
   */
  static createBinPosition(config: {
    binId: number;
    lpTokenAmount: BN;
    underlyingAmounts: Amounts;
    feesEarned: Amounts;
    entryPrice: BN;
    entryTime: Date;
  }): MockBinPosition {
    const binPosition: MockBinPosition = {
      binId: config.binId,
      lpTokenAmount: config.lpTokenAmount,
      underlyingAmounts: config.underlyingAmounts,
      feesEarned: config.feesEarned,
      entryPrice: config.entryPrice,
      entryTime: config.entryTime,
    };

    // Validate the created bin position
    const validation = StateValidator.validateBinPosition(binPosition);
    StateValidator.validateOrThrow(validation, "Bin position creation");

    return binPosition;
  }

  /**
   * Create a simple pool with uniform liquidity distribution
   * @param config - Simple pool configuration
   * @returns MockPoolState with uniform distribution
   */
  static createSimplePool(config: {
    poolId: string;
    assetA: AssetId;
    assetB: AssetId;
    binStep: number;
    activeBinId: number;
    totalLiquidityA: BN;
    totalLiquidityB: BN;
    binCount?: number;
    basePrice?: BN;
  }): MockPoolState {
    const binCount = config.binCount || 5;
    const basePrice = config.basePrice || new BN(1);
    const halfBins = Math.floor(binCount / 2);

    // Create metadata
    const metadata: PoolMetadataV2 = {
      assetA: config.assetA,
      assetB: config.assetB,
      binStep: config.binStep,
      baseFactor: new BN(10000), // Default base factor
      filterPeriod: 30, // Default filter period
      decayPeriod: 600, // Default decay period
      reductionFactor: 5000, // Default reduction factor
      variableFeeControl: 40000, // Default variable fee control
      protocolShare: 1000, // Default protocol share (10%)
      maxVolatilityAccumulator: new BN(350000), // Default max volatility
      isOpen: true,
    };

    // Create bins around the active bin
    const bins: Array<{
      binId: number;
      reserves: Amounts;
      lpTokens: BN;
      price: BN;
    }> = [];

    const liquidityPerBin = {
      assetA: config.totalLiquidityA.div(binCount),
      assetB: config.totalLiquidityB.div(binCount),
    };

    for (let i = -halfBins; i <= halfBins; i++) {
      const binId = config.activeBinId + i;
      const isActive = binId === config.activeBinId;

      // Calculate price based on bin step and distance from active bin
      const priceMultiplier = Math.pow(1 + config.binStep / 10000, i);
      const scaledMultiplier = Math.max(1, Math.floor(priceMultiplier * 10000));
      const binPrice = basePrice.mul(scaledMultiplier).div(10000);

      // Ensure price is never 0
      const finalPrice = binPrice.gt(0) ? binPrice : new BN(1);

      // Distribute liquidity - more in active bin, less in distant bins
      const distanceFactor = Math.max(0.1, 1 - Math.abs(i) * 0.2);
      const binLiquidityA = liquidityPerBin.assetA
        .mul(Math.floor(distanceFactor * 1000))
        .div(1000);
      const binLiquidityB = liquidityPerBin.assetB
        .mul(Math.floor(distanceFactor * 1000))
        .div(1000);

      // For active bin, use both assets; for others, use primarily one asset
      let reserves: Amounts;
      if (isActive) {
        reserves = {assetA: binLiquidityA, assetB: binLiquidityB};
      } else if (i < 0) {
        // Below active bin - more asset A
        reserves = {assetA: binLiquidityA.mul(2), assetB: new BN(0)};
      } else {
        // Above active bin - more asset B
        reserves = {assetA: new BN(0), assetB: binLiquidityB.mul(2)};
      }

      // Calculate LP tokens (simplified - in reality this would be more complex)
      const lpTokens = reserves.assetA.add(
        reserves.assetB.mul(finalPrice).div(1000)
      );

      bins.push({
        binId,
        reserves,
        lpTokens,
        price: finalPrice,
      });
    }

    return this.createPoolState({
      poolId: config.poolId,
      metadata,
      activeBinId: config.activeBinId,
      bins,
    });
  }

  /**
   * Create an empty pool with just the active bin
   * @param config - Empty pool configuration
   * @returns MockPoolState with only active bin
   */
  static createEmptyPool(config: {
    poolId: string;
    assetA: AssetId;
    assetB: AssetId;
    binStep: number;
    activeBinId: number;
    initialPrice?: BN;
  }): MockPoolState {
    const metadata: PoolMetadataV2 = {
      assetA: config.assetA,
      assetB: config.assetB,
      binStep: config.binStep,
      baseFactor: new BN(10000),
      filterPeriod: 30,
      decayPeriod: 600,
      reductionFactor: 5000,
      variableFeeControl: 40000,
      protocolShare: 1000,
      maxVolatilityAccumulator: new BN(350000),
      isOpen: true,
    };

    return this.createPoolState({
      poolId: config.poolId,
      metadata,
      activeBinId: config.activeBinId,
      bins: [
        {
          binId: config.activeBinId,
          reserves: {assetA: new BN(0), assetB: new BN(0)},
          lpTokens: new BN(0),
          price: config.initialPrice || new BN(1),
        },
      ],
    });
  }

  /**
   * Clone a pool state with optional modifications
   * @param original - Original pool state
   * @param modifications - Optional modifications to apply
   * @returns Cloned and modified pool state
   */
  static clonePoolState(
    original: MockPoolState,
    modifications?: Partial<MockPoolState>
  ): MockPoolState {
    const cloned: MockPoolState = {
      ...original,
      bins: new Map(original.bins),
      totalReserves: {...original.totalReserves},
      protocolFees: {...original.protocolFees},
      lastUpdated: new Date(),
      ...modifications,
    };

    // Validate the cloned state
    const validation = StateValidator.validatePoolState(cloned);
    StateValidator.validateOrThrow(validation, "Pool state cloning");

    return cloned;
  }

  /**
   * Clone a user position with optional modifications
   * @param original - Original user position
   * @param modifications - Optional modifications to apply
   * @returns Cloned and modified user position
   */
  static cloneUserPosition(
    original: MockUserPosition,
    modifications?: Partial<MockUserPosition>
  ): MockUserPosition {
    const cloned: MockUserPosition = {
      ...original,
      binPositions: new Map(original.binPositions),
      totalValue: {...original.totalValue},
      totalFeesEarned: {...original.totalFeesEarned},
      lastUpdated: new Date(),
      ...modifications,
    };

    // Validate the cloned position
    const validation = StateValidator.validateUserPosition(cloned);
    StateValidator.validateOrThrow(validation, "User position cloning");

    return cloned;
  }

  /**
   * Recalculate position totals from bin positions
   * @param position - Position to recalculate
   */
  private static recalculatePositionTotals(position: MockUserPosition): void {
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
   * Update bin reserves and recalculate pool totals
   * @param poolState - Pool state to update
   * @param binId - Bin ID to update
   * @param newReserves - New reserves for the bin
   */
  static updateBinReserves(
    poolState: MockPoolState,
    binId: number,
    newReserves: Amounts
  ): void {
    const bin = poolState.bins.get(binId);
    if (!bin) {
      throw new Error(`Bin ${binId} not found in pool ${poolState.poolId}`);
    }

    // Update bin reserves
    const oldReserves = bin.reserves;
    bin.reserves = newReserves;

    // Update pool total reserves
    poolState.totalReserves.assetA = poolState.totalReserves.assetA
      .sub(oldReserves.assetA)
      .add(newReserves.assetA);
    poolState.totalReserves.assetB = poolState.totalReserves.assetB
      .sub(oldReserves.assetB)
      .add(newReserves.assetB);

    poolState.lastUpdated = new Date();

    // Validate the updated state
    const validation = StateValidator.validatePoolState(poolState);
    StateValidator.validateOrThrow(validation, "Bin reserves update");
  }

  /**
   * Add liquidity to a bin and update related data structures
   * @param poolState - Pool state to update
   * @param binId - Bin ID to add liquidity to
   * @param liquidityToAdd - Liquidity amounts to add
   * @param lpTokensToMint - LP tokens to mint
   */
  static addLiquidityToBin(
    poolState: MockPoolState,
    binId: number,
    liquidityToAdd: Amounts,
    lpTokensToMint: BN
  ): void {
    let bin = poolState.bins.get(binId);

    if (!bin) {
      // Create new bin if it doesn't exist
      bin = this.createBinState({
        binId,
        reserves: {assetA: new BN(0), assetB: new BN(0)},
        lpTokens: new BN(0),
        price: new BN(1), // Will be calculated properly in real implementation
        isActive: binId === poolState.activeBinId,
      });
      poolState.bins.set(binId, bin);
    }

    // Update bin state
    bin.reserves.assetA = bin.reserves.assetA.add(liquidityToAdd.assetA);
    bin.reserves.assetB = bin.reserves.assetB.add(liquidityToAdd.assetB);
    bin.totalLpTokens = bin.totalLpTokens.add(lpTokensToMint);

    // Update pool totals
    poolState.totalReserves.assetA = poolState.totalReserves.assetA.add(
      liquidityToAdd.assetA
    );
    poolState.totalReserves.assetB = poolState.totalReserves.assetB.add(
      liquidityToAdd.assetB
    );
    poolState.lastUpdated = new Date();

    // Validate the updated state
    const validation = StateValidator.validatePoolState(poolState);
    StateValidator.validateOrThrow(validation, "Add liquidity to bin");
  }

  /**
   * Remove liquidity from a bin and update related data structures
   * @param poolState - Pool state to update
   * @param binId - Bin ID to remove liquidity from
   * @param liquidityToRemove - Liquidity amounts to remove
   * @param lpTokensToBurn - LP tokens to burn
   */
  static removeLiquidityFromBin(
    poolState: MockPoolState,
    binId: number,
    liquidityToRemove: Amounts,
    lpTokensToBurn: BN
  ): void {
    const bin = poolState.bins.get(binId);
    if (!bin) {
      throw new Error(`Bin ${binId} not found in pool ${poolState.poolId}`);
    }

    // Validate sufficient liquidity
    if (
      bin.reserves.assetA.lt(liquidityToRemove.assetA) ||
      bin.reserves.assetB.lt(liquidityToRemove.assetB) ||
      bin.totalLpTokens.lt(lpTokensToBurn)
    ) {
      throw new Error(`Insufficient liquidity in bin ${binId}`);
    }

    // Update bin state
    bin.reserves.assetA = bin.reserves.assetA.sub(liquidityToRemove.assetA);
    bin.reserves.assetB = bin.reserves.assetB.sub(liquidityToRemove.assetB);
    bin.totalLpTokens = bin.totalLpTokens.sub(lpTokensToBurn);

    // Update pool totals
    poolState.totalReserves.assetA = poolState.totalReserves.assetA.sub(
      liquidityToRemove.assetA
    );
    poolState.totalReserves.assetB = poolState.totalReserves.assetB.sub(
      liquidityToRemove.assetB
    );
    poolState.lastUpdated = new Date();

    // Remove bin if it's empty
    if (
      bin.totalLpTokens.eq(0) &&
      bin.reserves.assetA.eq(0) &&
      bin.reserves.assetB.eq(0)
    ) {
      poolState.bins.delete(binId);
    }

    // Validate the updated state
    const validation = StateValidator.validatePoolState(poolState);
    StateValidator.validateOrThrow(validation, "Remove liquidity from bin");
  }
}

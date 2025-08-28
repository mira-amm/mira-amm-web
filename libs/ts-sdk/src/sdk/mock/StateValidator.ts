import {BN} from "fuels";
import {
  MockPoolState,
  MockBinState,
  MockUserPosition,
  MockBinPosition,
  MockError,
  MockErrorType,
} from "./types";
import {Amounts} from "../model";

/**
 * Validation result for state consistency checks
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** List of validation errors */
  errors: string[];
  /** List of validation warnings */
  warnings: string[];
}

/**
 * State validator for ensuring mock data consistency
 */
export class StateValidator {
  /**
   * Validate a complete pool state for consistency
   */
  static validatePoolState(poolState: MockPoolState): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate basic pool properties
    this.validateBasicPoolProperties(poolState, result);

    // Validate bin consistency
    this.validateBinConsistency(poolState, result);

    // Validate active bin
    this.validateActiveBin(poolState, result);

    // Validate reserve calculations
    this.validateReserveCalculations(poolState, result);

    // Validate timestamps
    this.validateTimestamps(poolState, result);

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate a single bin state
   */
  static validateBinState(binState: MockBinState): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate bin ID is valid
    if (!Number.isInteger(binState.binId)) {
      result.errors.push(
        `Invalid bin ID: ${binState.binId} must be an integer`
      );
    }

    // Validate reserves are non-negative
    if (binState.reserves.assetA.lt(0) || binState.reserves.assetB.lt(0)) {
      result.errors.push(
        `Bin ${binState.binId} has negative reserves: A=${binState.reserves.assetA.toString()}, B=${binState.reserves.assetB.toString()}`
      );
    }

    // Validate LP tokens are non-negative
    if (binState.totalLpTokens.lt(0)) {
      result.errors.push(
        `Bin ${binState.binId} has negative LP tokens: ${binState.totalLpTokens.toString()}`
      );
    }

    // Validate price is positive
    if (binState.price.lte(0)) {
      result.errors.push(
        `Bin ${binState.binId} has invalid price: ${binState.price.toString()}`
      );
    }

    // Validate liquidity consistency
    const hasReserves =
      binState.reserves.assetA.gt(0) || binState.reserves.assetB.gt(0);
    const hasLpTokens = binState.totalLpTokens.gt(0);

    if (hasReserves && !hasLpTokens) {
      result.warnings.push(
        `Bin ${binState.binId} has reserves but no LP tokens - this may indicate an inconsistent state`
      );
    }

    if (!hasReserves && hasLpTokens) {
      result.errors.push(
        `Bin ${binState.binId} has LP tokens but no reserves - this is an invalid state`
      );
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate a user position for consistency
   */
  static validateUserPosition(position: MockUserPosition): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate basic properties
    if (!position.userId || position.userId.trim() === "") {
      result.errors.push("User position must have a valid user ID");
    }

    if (!position.poolId || position.poolId.trim() === "") {
      result.errors.push("User position must have a valid pool ID");
    }

    // Validate bin positions
    if (position.binPositions.size === 0) {
      result.warnings.push("User position has no bin positions");
    }

    // Validate each bin position
    for (const [binId, binPosition] of position.binPositions) {
      const binValidation = this.validateBinPosition(binPosition);
      result.errors.push(...binValidation.errors);
      result.warnings.push(...binValidation.warnings);

      // Validate bin ID consistency
      if (binPosition.binId !== binId) {
        result.errors.push(
          `Bin position map key ${binId} does not match bin position binId ${binPosition.binId}`
        );
      }
    }

    // Validate total value calculations
    this.validatePositionTotals(position, result);

    // Validate timestamps
    if (position.createdAt > position.lastUpdated) {
      result.errors.push(
        "Position created timestamp cannot be after last updated timestamp"
      );
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate a single bin position
   */
  static validateBinPosition(binPosition: MockBinPosition): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate bin ID
    if (!Number.isInteger(binPosition.binId)) {
      result.errors.push(
        `Invalid bin ID: ${binPosition.binId} must be an integer`
      );
    }

    // Validate LP token amount is non-negative
    if (binPosition.lpTokenAmount.lt(0)) {
      result.errors.push(
        `Bin position ${binPosition.binId} has negative LP tokens: ${binPosition.lpTokenAmount.toString()}`
      );
    }

    // Validate underlying amounts are non-negative
    if (
      binPosition.underlyingAmounts.assetA.lt(0) ||
      binPosition.underlyingAmounts.assetB.lt(0)
    ) {
      result.errors.push(
        `Bin position ${binPosition.binId} has negative underlying amounts: A=${binPosition.underlyingAmounts.assetA.toString()}, B=${binPosition.underlyingAmounts.assetB.toString()}`
      );
    }

    // Validate fees earned are non-negative
    if (
      binPosition.feesEarned.assetA.lt(0) ||
      binPosition.feesEarned.assetB.lt(0)
    ) {
      result.errors.push(
        `Bin position ${binPosition.binId} has negative fees earned: A=${binPosition.feesEarned.assetA.toString()}, B=${binPosition.feesEarned.assetB.toString()}`
      );
    }

    // Validate entry price is positive
    if (binPosition.entryPrice.lte(0)) {
      result.errors.push(
        `Bin position ${binPosition.binId} has invalid entry price: ${binPosition.entryPrice.toString()}`
      );
    }

    // Validate consistency between LP tokens and underlying amounts
    if (binPosition.lpTokenAmount.gt(0)) {
      const hasUnderlyingAmounts =
        binPosition.underlyingAmounts.assetA.gt(0) ||
        binPosition.underlyingAmounts.assetB.gt(0);
      if (!hasUnderlyingAmounts) {
        result.warnings.push(
          `Bin position ${binPosition.binId} has LP tokens but no underlying amounts`
        );
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate that pool reserves match the sum of bin reserves
   */
  static validateReserveConsistency(
    poolState: MockPoolState
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    let calculatedReservesA = new BN(0);
    let calculatedReservesB = new BN(0);

    // Sum up all bin reserves
    for (const binState of poolState.bins.values()) {
      calculatedReservesA = calculatedReservesA.add(binState.reserves.assetA);
      calculatedReservesB = calculatedReservesB.add(binState.reserves.assetB);
    }

    // Compare with pool total reserves
    if (!calculatedReservesA.eq(poolState.totalReserves.assetA)) {
      result.errors.push(
        `Pool total reserves A (${poolState.totalReserves.assetA.toString()}) does not match sum of bin reserves (${calculatedReservesA.toString()})`
      );
    }

    if (!calculatedReservesB.eq(poolState.totalReserves.assetB)) {
      result.errors.push(
        `Pool total reserves B (${poolState.totalReserves.assetB.toString()}) does not match sum of bin reserves (${calculatedReservesB.toString()})`
      );
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate basic pool properties
   */
  private static validateBasicPoolProperties(
    poolState: MockPoolState,
    result: ValidationResult
  ): void {
    if (!poolState.poolId || poolState.poolId.trim() === "") {
      result.errors.push("Pool must have a valid pool ID");
    }

    if (!poolState.metadata) {
      result.errors.push("Pool must have metadata");
    }

    if (poolState.volume24h.lt(0)) {
      result.errors.push(
        `Pool has negative 24h volume: ${poolState.volume24h.toString()}`
      );
    }

    if (
      poolState.protocolFees.assetA.lt(0) ||
      poolState.protocolFees.assetB.lt(0)
    ) {
      result.errors.push(
        `Pool has negative protocol fees: A=${poolState.protocolFees.assetA.toString()}, B=${poolState.protocolFees.assetB.toString()}`
      );
    }
  }

  /**
   * Validate bin consistency within the pool
   */
  private static validateBinConsistency(
    poolState: MockPoolState,
    result: ValidationResult
  ): void {
    let activeCount = 0;

    for (const [binId, binState] of poolState.bins) {
      // Validate individual bin
      const binValidation = this.validateBinState(binState);
      result.errors.push(...binValidation.errors);
      result.warnings.push(...binValidation.warnings);

      // Validate bin ID consistency
      if (binState.binId !== binId) {
        result.errors.push(
          `Bin map key ${binId} does not match bin state binId ${binState.binId}`
        );
      }

      // Count active bins
      if (binState.isActive) {
        activeCount++;
      }
    }

    // Validate exactly one active bin
    if (activeCount === 0) {
      result.errors.push("Pool must have exactly one active bin");
    } else if (activeCount > 1) {
      result.errors.push(
        `Pool has ${activeCount} active bins, but should have exactly one`
      );
    }
  }

  /**
   * Validate active bin configuration
   */
  private static validateActiveBin(
    poolState: MockPoolState,
    result: ValidationResult
  ): void {
    const activeBin = poolState.bins.get(poolState.activeBinId);

    if (!activeBin) {
      result.errors.push(
        `Active bin ID ${poolState.activeBinId} does not exist in pool bins`
      );
    } else if (!activeBin.isActive) {
      result.errors.push(
        `Bin ${poolState.activeBinId} is marked as active bin but isActive is false`
      );
    }
  }

  /**
   * Validate reserve calculations
   */
  private static validateReserveCalculations(
    poolState: MockPoolState,
    result: ValidationResult
  ): void {
    const reserveValidation = this.validateReserveConsistency(poolState);
    result.errors.push(...reserveValidation.errors);
    result.warnings.push(...reserveValidation.warnings);
  }

  /**
   * Validate timestamps
   */
  private static validateTimestamps(
    poolState: MockPoolState,
    result: ValidationResult
  ): void {
    if (poolState.createdAt > poolState.lastUpdated) {
      result.errors.push(
        "Pool created timestamp cannot be after last updated timestamp"
      );
    }

    const now = new Date();
    if (poolState.createdAt > now) {
      result.warnings.push("Pool created timestamp is in the future");
    }

    if (poolState.lastUpdated > now) {
      result.warnings.push("Pool last updated timestamp is in the future");
    }
  }

  /**
   * Validate position total calculations
   */
  private static validatePositionTotals(
    position: MockUserPosition,
    result: ValidationResult
  ): void {
    let calculatedValueA = new BN(0);
    let calculatedValueB = new BN(0);
    let calculatedFeesA = new BN(0);
    let calculatedFeesB = new BN(0);

    // Sum up all bin position values and fees
    for (const binPosition of position.binPositions.values()) {
      calculatedValueA = calculatedValueA.add(
        binPosition.underlyingAmounts.assetA
      );
      calculatedValueB = calculatedValueB.add(
        binPosition.underlyingAmounts.assetB
      );
      calculatedFeesA = calculatedFeesA.add(binPosition.feesEarned.assetA);
      calculatedFeesB = calculatedFeesB.add(binPosition.feesEarned.assetB);
    }

    // Compare with position totals
    if (!calculatedValueA.eq(position.totalValue.assetA)) {
      result.errors.push(
        `Position total value A (${position.totalValue.assetA.toString()}) does not match sum of bin values (${calculatedValueA.toString()})`
      );
    }

    if (!calculatedValueB.eq(position.totalValue.assetB)) {
      result.errors.push(
        `Position total value B (${position.totalValue.assetB.toString()}) does not match sum of bin values (${calculatedValueB.toString()})`
      );
    }

    if (!calculatedFeesA.eq(position.totalFeesEarned.assetA)) {
      result.errors.push(
        `Position total fees A (${position.totalFeesEarned.assetA.toString()}) does not match sum of bin fees (${calculatedFeesA.toString()})`
      );
    }

    if (!calculatedFeesB.eq(position.totalFeesEarned.assetB)) {
      result.errors.push(
        `Position total fees B (${position.totalFeesEarned.assetB.toString()}) does not match sum of bin fees (${calculatedFeesB.toString()})`
      );
    }
  }

  /**
   * Throw an error if validation fails
   */
  static validateOrThrow(validation: ValidationResult, context: string): void {
    if (!validation.isValid) {
      const errorMessage = `${context} validation failed: ${validation.errors.join(", ")}`;
      throw new MockError(MockErrorType.INVALID_BIN_RANGE, errorMessage, {
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }
  }
}

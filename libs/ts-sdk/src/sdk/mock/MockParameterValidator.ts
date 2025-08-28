import {BN, BigNumberish, AssetId, Address} from "fuels";
import {
  PoolIdV2,
  PoolInput,
  BinIdDelta,
  TxParams,
  PrepareRequestOptions,
  PoolCurveStateError,
} from "../model";
import {
  validatePoolId,
  validateAssetId,
  validateDifferentAssets,
  validateAmount,
  validateBinId,
  validateBinStep,
  validateDeadline,
  validateLiquidityDistribution,
  validatePoolInput,
  validateSwapParams,
  validateAddLiquidityParams,
  validateRemoveLiquidityParams,
  ValidationOptions,
  DEFAULT_VALIDATION_OPTIONS,
} from "../validation/v2-validation";
import {
  EnhancedMiraV2Error,
  createErrorContext,
  ErrorContext,
} from "../errors/v2-errors";
import {MockError, MockErrorType} from "./types";

/**
 * Mock-specific validation options extending the base validation options
 */
export interface MockValidationOptions extends ValidationOptions {
  /** Allow mock-specific relaxed validation for testing */
  allowMockRelaxedValidation?: boolean;
  /** Skip balance validation (useful for testing edge cases) */
  skipBalanceValidation?: boolean;
  /** Skip pool existence validation */
  skipPoolExistenceValidation?: boolean;
  /** Maximum number of bins allowed in operations */
  maxBinsPerOperation?: number;
  /** Maximum number of pools in swap routes */
  maxPoolsInRoute?: number;
}

/**
 * Default mock validation options
 */
export const DEFAULT_MOCK_VALIDATION_OPTIONS: MockValidationOptions = {
  ...DEFAULT_VALIDATION_OPTIONS,
  allowMockRelaxedValidation: false,
  skipBalanceValidation: false,
  skipPoolExistenceValidation: false,
  maxBinsPerOperation: 50,
  maxPoolsInRoute: 5,
};

/**
 * MockParameterValidator provides comprehensive parameter validation for mock SDK operations
 *
 * Features:
 * - Validates all parameters according to real SDK validation rules
 * - Provides mock-specific validation options for testing flexibility
 * - Generates detailed error messages with context for debugging
 * - Supports graceful error recovery with suggested fixes
 */
export class MockParameterValidator {
  private options: MockValidationOptions;

  constructor(
    options: MockValidationOptions = DEFAULT_MOCK_VALIDATION_OPTIONS
  ) {
    this.options = {...DEFAULT_MOCK_VALIDATION_OPTIONS, ...options};
  }

  /**
   * Update validation options
   */
  updateOptions(options: Partial<MockValidationOptions>): void {
    this.options = {...this.options, ...options};
  }

  /**
   * Validate add liquidity parameters
   */
  validateAddLiquidity(
    poolId: PoolIdV2,
    amountADesired: BigNumberish,
    amountBDesired: BigNumberish,
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    deadline: BigNumberish,
    activeIdDesired?: BigNumberish,
    idSlippage?: BigNumberish,
    deltaIds?: BinIdDelta[],
    distributionX?: BigNumberish[],
    distributionY?: BigNumberish[]
  ): void {
    const context = createErrorContext("addLiquidity", {poolId});

    try {
      // Basic parameter validation using real SDK validation
      validateAddLiquidityParams(
        poolId,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        deadline,
        this.options,
        context
      );

      // Mock-specific validations
      this.validateMockSpecificAddLiquidity(
        activeIdDesired,
        idSlippage,
        deltaIds,
        distributionX,
        distributionY,
        context
      );
    } catch (error) {
      throw this.enhanceValidationError(error, "addLiquidity", {
        poolId,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        deadline,
        activeIdDesired,
        idSlippage,
        deltaIds,
        distributionX,
        distributionY,
      });
    }
  }

  /**
   * Validate remove liquidity parameters
   */
  validateRemoveLiquidity(
    poolId: PoolIdV2,
    binIds: BigNumberish[],
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    deadline: BigNumberish
  ): void {
    const context = createErrorContext("removeLiquidity", {poolId});

    try {
      // Basic parameter validation using real SDK validation
      validateRemoveLiquidityParams(
        poolId,
        binIds,
        amountAMin,
        amountBMin,
        deadline,
        this.options,
        context
      );

      // Mock-specific validations
      this.validateMockSpecificRemoveLiquidity(binIds, context);
    } catch (error) {
      throw this.enhanceValidationError(error, "removeLiquidity", {
        poolId,
        binIds,
        amountAMin,
        amountBMin,
        deadline,
      });
    }
  }

  /**
   * Validate swap parameters
   */
  validateSwap(
    amountIn: BigNumberish,
    assetIn: AssetId,
    amountOutMin: BigNumberish,
    pools: PoolIdV2[],
    deadline: BigNumberish,
    receiver?: Address
  ): void {
    const context = createErrorContext("swap", {assetIn, pools});

    try {
      // Basic parameter validation using real SDK validation
      validateSwapParams(
        amountIn,
        amountOutMin,
        pools,
        deadline,
        this.options,
        context
      );

      // Mock-specific validations
      this.validateMockSpecificSwap(pools, receiver, context);
    } catch (error) {
      throw this.enhanceValidationError(error, "swap", {
        amountIn,
        assetIn,
        amountOutMin,
        pools,
        deadline,
        receiver,
      });
    }
  }

  /**
   * Validate create pool parameters
   */
  validateCreatePool(pool: PoolInput, activeId: BigNumberish): void {
    const context = createErrorContext("createPool", {pool, activeId});

    try {
      // Basic parameter validation using real SDK validation
      validatePoolInput(pool, context);
      validateBinId(activeId, context);

      // Mock-specific validations
      this.validateMockSpecificCreatePool(pool, activeId, context);
    } catch (error) {
      throw this.enhanceValidationError(error, "createPool", {
        pool,
        activeId,
      });
    }
  }

  /**
   * Validate transaction parameters (gas, deadline, etc.)
   */
  validateTransactionParams(
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): void {
    if (txParams) {
      if (txParams.gasLimit && new BN(txParams.gasLimit.toString()).lte(0)) {
        throw new MockError(
          MockErrorType.GAS_ESTIMATION_FAILED,
          "Gas limit must be positive",
          {txParams}
        );
      }

      if (txParams.gasPrice && new BN(txParams.gasPrice.toString()).lte(0)) {
        throw new MockError(
          MockErrorType.GAS_ESTIMATION_FAILED,
          "Gas price must be positive",
          {txParams}
        );
      }
    }

    if (options) {
      if (options.maxFee && new BN(options.maxFee.toString()).lte(0)) {
        throw new MockError(
          MockErrorType.INVALID_PARAMETERS,
          "Maximum fee must be positive",
          {options}
        );
      }
    }
  }

  /**
   * Validate balance requirements for an operation
   */
  validateBalanceRequirements(
    userBalances: Map<string, BN>,
    requiredBalances: Map<string, BN>,
    operation: string
  ): void {
    if (this.options.skipBalanceValidation) {
      return;
    }

    for (const [assetId, requiredAmount] of requiredBalances.entries()) {
      const userBalance = userBalances.get(assetId) || new BN(0);

      if (userBalance.lt(requiredAmount)) {
        throw new MockError(
          MockErrorType.INSUFFICIENT_BALANCE,
          `Insufficient balance for ${assetId}. Required: ${requiredAmount.toString()}, Available: ${userBalance.toString()}`,
          {
            operation,
            assetId,
            required: requiredAmount.toString(),
            available: userBalance.toString(),
            shortfall: requiredAmount.sub(userBalance).toString(),
          }
        );
      }
    }
  }

  /**
   * Validate pool existence and state
   */
  validatePoolExistence(
    poolId: PoolIdV2,
    poolExists: boolean,
    operation: string
  ): void {
    if (this.options.skipPoolExistenceValidation) {
      return;
    }

    if (!poolExists) {
      throw new MockError(
        MockErrorType.POOL_NOT_FOUND,
        `Pool ${poolId.toString()} does not exist`,
        {
          operation,
          poolId: poolId.toString(),
          suggestion: "Create the pool first or check the pool ID",
        }
      );
    }
  }

  /**
   * Validate liquidity requirements for an operation
   */
  validateLiquidityRequirements(
    poolId: PoolIdV2,
    requiredLiquidity: BN,
    availableLiquidity: BN,
    operation: string
  ): void {
    if (availableLiquidity.lt(requiredLiquidity)) {
      throw new MockError(
        MockErrorType.INSUFFICIENT_LIQUIDITY,
        `Insufficient liquidity in pool ${poolId.toString()}. Required: ${requiredLiquidity.toString()}, Available: ${availableLiquidity.toString()}`,
        {
          operation,
          poolId: poolId.toString(),
          required: requiredLiquidity.toString(),
          available: availableLiquidity.toString(),
          shortfall: requiredLiquidity.sub(availableLiquidity).toString(),
          suggestion: "Try a smaller amount or add liquidity to the pool",
        }
      );
    }
  }

  /**
   * Validate slippage tolerance
   */
  validateSlippageTolerance(
    expectedAmount: BN,
    actualAmount: BN,
    maxSlippagePercent: number,
    operation: string
  ): void {
    const slippageAmount = expectedAmount.sub(actualAmount).abs();
    const slippagePercent =
      slippageAmount.mul(new BN(10000)).div(expectedAmount).toNumber() / 100;

    if (slippagePercent > maxSlippagePercent) {
      throw new MockError(
        MockErrorType.SLIPPAGE_EXCEEDED,
        `Slippage tolerance exceeded. Expected: ${expectedAmount.toString()}, Actual: ${actualAmount.toString()}, Slippage: ${slippagePercent.toFixed(2)}%`,
        {
          operation,
          expected: expectedAmount.toString(),
          actual: actualAmount.toString(),
          slippagePercent: slippagePercent.toFixed(2),
          maxSlippagePercent,
          suggestion: `Increase slippage tolerance above ${slippagePercent.toFixed(2)}% or try again`,
        }
      );
    }
  }

  // ===== Private Helper Methods =====

  /**
   * Mock-specific validation for add liquidity operations
   */
  private validateMockSpecificAddLiquidity(
    activeIdDesired?: BigNumberish,
    idSlippage?: BigNumberish,
    deltaIds?: BinIdDelta[],
    distributionX?: BigNumberish[],
    distributionY?: BigNumberish[],
    context?: ErrorContext
  ): void {
    // Validate active ID if provided
    if (activeIdDesired !== undefined) {
      validateBinId(activeIdDesired, context);
    }

    // Validate ID slippage if provided
    if (idSlippage !== undefined) {
      const slippage = new BN(idSlippage.toString());
      if (slippage.lt(0) || slippage.gt(1000)) {
        throw new MockError(
          MockErrorType.INVALID_PARAMETERS,
          "ID slippage must be between 0 and 1000",
          {...context, idSlippage: slippage.toString()}
        );
      }
    }

    // Validate delta IDs and distributions
    if (deltaIds || distributionX || distributionY) {
      validateLiquidityDistribution(
        distributionX,
        distributionY,
        deltaIds,
        context
      );

      // Check maximum bins limit
      if (
        deltaIds &&
        deltaIds.length > (this.options.maxBinsPerOperation || 50)
      ) {
        throw new MockError(
          MockErrorType.INVALID_PARAMETERS,
          `Too many bins specified. Maximum allowed: ${this.options.maxBinsPerOperation}`,
          {
            ...context,
            binCount: deltaIds.length,
            maxAllowed: this.options.maxBinsPerOperation,
          }
        );
      }
    }
  }

  /**
   * Mock-specific validation for remove liquidity operations
   */
  private validateMockSpecificRemoveLiquidity(
    binIds: BigNumberish[],
    context?: ErrorContext
  ): void {
    // Check maximum bins limit
    if (binIds.length > (this.options.maxBinsPerOperation || 50)) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        `Too many bins specified for removal. Maximum allowed: ${this.options.maxBinsPerOperation}`,
        {
          ...context,
          binCount: binIds.length,
          maxAllowed: this.options.maxBinsPerOperation,
        }
      );
    }

    // Check for duplicate bin IDs
    const uniqueBinIds = new Set(binIds.map((id) => id.toString()));
    if (uniqueBinIds.size !== binIds.length) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Duplicate bin IDs are not allowed",
        {...context, binIds: binIds.map((id) => id.toString())}
      );
    }
  }

  /**
   * Mock-specific validation for swap operations
   */
  private validateMockSpecificSwap(
    pools: PoolIdV2[],
    receiver?: Address,
    context?: ErrorContext
  ): void {
    // Check maximum pools in route
    if (pools.length > (this.options.maxPoolsInRoute || 5)) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        `Too many pools in swap route. Maximum allowed: ${this.options.maxPoolsInRoute}`,
        {
          ...context,
          poolCount: pools.length,
          maxAllowed: this.options.maxPoolsInRoute,
        }
      );
    }

    // Validate receiver address format if provided
    if (receiver) {
      try {
        // Basic address format validation
        if (!receiver.toB256() || receiver.toB256().length !== 66) {
          throw new Error("Invalid address format");
        }
      } catch (error) {
        throw new MockError(
          MockErrorType.INVALID_PARAMETERS,
          "Invalid receiver address format",
          {...context, receiver: receiver.toString()}
        );
      }
    }
  }

  /**
   * Mock-specific validation for create pool operations
   */
  private validateMockSpecificCreatePool(
    pool: PoolInput,
    activeId: BigNumberish,
    context?: ErrorContext
  ): void {
    // Validate that active ID is reasonable for the bin step
    const binStep = new BN(pool.binStep.toString()).toNumber();
    const activeIdNum = new BN(activeId.toString()).toNumber();

    // Check if active ID is within a reasonable range for the bin step
    const maxReasonableId = 1000000; // Arbitrary but reasonable limit
    if (Math.abs(activeIdNum) > maxReasonableId) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        `Active ID ${activeIdNum} is outside reasonable range (±${maxReasonableId})`,
        {...context, activeId: activeIdNum, maxReasonableId}
      );
    }

    // Validate base factor is reasonable
    const baseFactor = new BN(pool.baseFactor.toString());
    if (baseFactor.lt(new BN(10000)) || baseFactor.gt(new BN(20000))) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Base factor must be between 10000 and 20000",
        {...context, baseFactor: baseFactor.toString()}
      );
    }
  }

  /**
   * Enhance validation errors with additional context and suggestions
   */
  private enhanceValidationError(
    error: any,
    operation: string,
    parameters: Record<string, any>
  ): MockError {
    // If it's already a MockError, return as-is
    if (error instanceof MockError) {
      return error;
    }

    // If it's an EnhancedMiraV2Error, convert to MockError
    if (error instanceof EnhancedMiraV2Error) {
      return new MockError(
        this.mapMiraErrorToMockError(error.errorType),
        error.message,
        {
          operation,
          parameters,
          originalError: error,
          isRecoverable: error.isRecoverable(),
          userFriendlyMessage: error.getUserFriendlyMessage(),
        }
      );
    }

    // For other errors, wrap in a generic MockError
    return new MockError(
      MockErrorType.INVALID_PARAMETERS,
      error.message || "Parameter validation failed",
      {
        operation,
        parameters,
        originalError: error,
      }
    );
  }

  /**
   * Map MiraV2Error types to MockError types
   */
  private mapMiraErrorToMockError(
    errorType: PoolCurveStateError
  ): MockErrorType {
    switch (errorType) {
      case PoolCurveStateError.PoolNotFound:
        return MockErrorType.POOL_NOT_FOUND;
      case PoolCurveStateError.OutOfLiquidity:
      case PoolCurveStateError.InsufficientAmountIn:
      case PoolCurveStateError.InsufficientAmountOut:
        return MockErrorType.INSUFFICIENT_LIQUIDITY;
      case PoolCurveStateError.InvalidBinStep:
      case PoolCurveStateError.InvalidActiveId:
        return MockErrorType.INVALID_BIN_RANGE;
      default:
        return MockErrorType.INVALID_PARAMETERS;
    }
  }
}

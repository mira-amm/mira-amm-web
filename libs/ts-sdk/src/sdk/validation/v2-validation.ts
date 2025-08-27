import {BN, type BigNumberish, type AssetId} from "fuels";
import {
  PoolCurveStateError,
  type PoolIdV2,
  type LiquidityConfig,
  type PoolInput,
} from "../model";
import {EnhancedMiraV2Error, type ErrorContext} from "../errors/v2-errors";

/**
 * Validation options for different operations
 */
export interface ValidationOptions {
  allowZeroAmounts?: boolean;
  maxBinStep?: number;
  minBinStep?: number;
  maxSlippage?: number; // as percentage (e.g., 5 for 5%)
  maxDeadline?: number; // in seconds from now
}

/**
 * Default validation options
 */
export const DEFAULT_VALIDATION_OPTIONS: ValidationOptions = {
  allowZeroAmounts: false,
  maxBinStep: 100,
  minBinStep: 1,
  maxSlippage: 50, // 50%
  maxDeadline: 3600, // 1 hour
};

/**
 * Validate pool ID
 */
export function validatePoolId(poolId: PoolIdV2, context?: ErrorContext): void {
  if (!poolId) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidParameters,
      "Pool ID cannot be zero or null",
      {...context, poolId}
    );
  }
}

/**
 * Validate asset ID
 */
export function validateAssetId(
  assetId: AssetId,
  fieldName: string,
  context?: ErrorContext
): void {
  if (!assetId || !assetId.bits) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidParameters,
      `${fieldName} asset ID is invalid`,
      {...context, assetId}
    );
  }
}

/**
 * Validate that two assets are different
 */
export function validateDifferentAssets(
  assetA: AssetId,
  assetB: AssetId,
  context?: ErrorContext
): void {
  if (assetA.bits === assetB.bits) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.IdenticalAssets,
      "Assets must be different for pool operations",
      {...context, assetA, assetB}
    );
  }
}

/**
 * Validate amount (must be positive unless explicitly allowed to be zero)
 */
export function validateAmount(
  amount: BigNumberish,
  fieldName: string,
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS,
  context?: ErrorContext
): void {
  const bnAmount = new BN(amount.toString());

  if (bnAmount.isNeg()) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidParameters,
      `${fieldName} cannot be negative`,
      {...context, amount: bnAmount.toString()}
    );
  }

  if (!options.allowZeroAmounts && bnAmount.isZero()) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidParameters,
      `${fieldName} cannot be zero`,
      {...context, amount: bnAmount.toString()}
    );
  }
}

/**
 * Validate bin ID (must be within valid range)
 */
export function validateBinId(
  binId: BigNumberish,
  context?: ErrorContext
): void {
  const bnBinId = new BN(binId.toString());

  // Bin IDs are typically signed integers with a specific range
  // For Trader Joe v2, bin IDs range from -8388608 to 8388607 (24-bit signed integer)
  const MIN_BIN_ID = -8388608;
  const MAX_BIN_ID = 8388607;

  const binIdNumber = bnBinId.toNumber();

  if (binIdNumber < MIN_BIN_ID || binIdNumber > MAX_BIN_ID) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidActiveId,
      `Bin ID must be between ${MIN_BIN_ID} and ${MAX_BIN_ID}`,
      {...context, binId: binIdNumber}
    );
  }
}

/**
 * Validate bin step (must be within valid range)
 */
export function validateBinStep(
  binStep: BigNumberish,
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS,
  context?: ErrorContext
): void {
  const bnBinStep = new BN(binStep.toString());
  const binStepNumber = bnBinStep.toNumber();

  if (binStepNumber < (options.minBinStep || 1)) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidBinStep,
      `Bin step must be at least ${options.minBinStep || 1}`,
      {...context, binStep: binStepNumber}
    );
  }

  if (binStepNumber > (options.maxBinStep || 100)) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidBinStep,
      `Bin step cannot exceed ${options.maxBinStep || 100}`,
      {...context, binStep: binStepNumber}
    );
  }
}

/**
 * Validate slippage tolerance (as percentage)
 */
export function validateSlippage(
  slippage: number,
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS,
  context?: ErrorContext
): void {
  if (slippage < 0) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidParameters,
      "Slippage cannot be negative",
      {...context, slippage}
    );
  }

  if (slippage > (options.maxSlippage || 50)) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidParameters,
      `Slippage cannot exceed ${options.maxSlippage || 50}%`,
      {...context, slippage}
    );
  }
}

/**
 * Validate deadline (must be in the future)
 */
export function validateDeadline(
  deadline: BigNumberish,
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS,
  context?: ErrorContext
): void {
  const bnDeadline = new BN(deadline.toString());
  const deadlineSeconds = bnDeadline.toNumber();
  const currentTime = Math.floor(Date.now() / 1000);

  if (deadlineSeconds <= currentTime) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidParameters,
      "Deadline must be in the future",
      {...context, deadline: deadlineSeconds, currentTime}
    );
  }

  const maxDeadline = currentTime + (options.maxDeadline || 3600);
  if (deadlineSeconds > maxDeadline) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidParameters,
      `Deadline cannot be more than ${options.maxDeadline || 3600} seconds in the future`,
      {...context, deadline: deadlineSeconds, maxDeadline}
    );
  }
}

/**
 * Validate liquidity distribution arrays
 */
export function validateLiquidityDistribution(
  distributionX?: BigNumberish[],
  distributionY?: BigNumberish[],
  deltaIds?: any[],
  context?: ErrorContext
): void {
  if (distributionX && distributionY) {
    if (distributionX.length !== distributionY.length) {
      throw new EnhancedMiraV2Error(
        PoolCurveStateError.InvalidParameters,
        "Distribution arrays must have the same length",
        {
          ...context,
          distributionXLength: distributionX.length,
          distributionYLength: distributionY.length,
        }
      );
    }
  }

  if (deltaIds && distributionX && distributionX.length !== deltaIds.length) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidParameters,
      "Distribution arrays must match deltaIds length",
      {
        ...context,
        distributionLength: distributionX.length,
        deltaIdsLength: deltaIds.length,
      }
    );
  }

  // Validate distribution percentages sum to 100% (or close to it)
  if (distributionX) {
    const totalX = distributionX.reduce(
      (sum, dist) => sum + Number(dist.toString()),
      0
    );
    if (totalX > 0 && (totalX < 99 || totalX > 101)) {
      throw new EnhancedMiraV2Error(
        PoolCurveStateError.CompositionFactorFlawed,
        "Distribution X percentages should sum to approximately 100%",
        {...context, totalDistributionX: totalX}
      );
    }
  }

  if (distributionY) {
    const totalY = distributionY.reduce(
      (sum, dist) => sum + Number(dist.toString()),
      0
    );
    if (totalY > 0 && (totalY < 99 || totalY > 101)) {
      throw new EnhancedMiraV2Error(
        PoolCurveStateError.CompositionFactorFlawed,
        "Distribution Y percentages should sum to approximately 100%",
        {...context, totalDistributionY: totalY}
      );
    }
  }
}

/**
 * Validate liquidity configuration array
 */
export function validateLiquidityConfig(
  configs: LiquidityConfig[],
  context?: ErrorContext
): void {
  if (!configs || configs.length === 0) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidParameters,
      "Liquidity configuration cannot be empty",
      context
    );
  }

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];

    validateBinId(config.binId, {...context, configIndex: i});

    if (config.distributionX < 0 || config.distributionX > 100) {
      throw new EnhancedMiraV2Error(
        PoolCurveStateError.InvalidParameters,
        `Distribution X must be between 0 and 100 at index ${i}`,
        {...context, configIndex: i, distributionX: config.distributionX}
      );
    }

    if (config.distributionY < 0 || config.distributionY > 100) {
      throw new EnhancedMiraV2Error(
        PoolCurveStateError.InvalidParameters,
        `Distribution Y must be between 0 and 100 at index ${i}`,
        {...context, configIndex: i, distributionY: config.distributionY}
      );
    }
  }
}

/**
 * Validate pool input parameters
 */
export function validatePoolInput(
  poolInput: PoolInput,
  context?: ErrorContext
): void {
  validateAssetId(poolInput.assetX, "assetX", context);
  validateAssetId(poolInput.assetY, "assetY", context);
  validateDifferentAssets(poolInput.assetX, poolInput.assetY, context);
  validateBinStep(poolInput.binStep, DEFAULT_VALIDATION_OPTIONS, context);
  validateAmount(
    poolInput.baseFactor,
    "baseFactor",
    {allowZeroAmounts: false},
    context
  );
}

/**
 * Validate swap parameters
 */
export function validateSwapParams(
  amountIn: BigNumberish,
  amountOutMin: BigNumberish,
  pools: PoolIdV2[],
  deadline: BigNumberish,
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS,
  context?: ErrorContext
): void {
  validateAmount(amountIn, "amountIn", options, context);
  validateAmount(
    amountOutMin,
    "amountOutMin",
    {allowZeroAmounts: true},
    context
  );
  validateDeadline(deadline, options, context);

  if (!pools || pools.length === 0) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidParameters,
      "At least one pool must be provided for swap",
      context
    );
  }

  pools.forEach((poolId, index) => {
    validatePoolId(poolId, {...context, poolIndex: index});
  });
}

/**
 * Validate add liquidity parameters
 */
export function validateAddLiquidityParams(
  poolId: PoolIdV2,
  amountADesired: BigNumberish,
  amountBDesired: BigNumberish,
  amountAMin: BigNumberish,
  amountBMin: BigNumberish,
  deadline: BigNumberish,
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS,
  context?: ErrorContext
): void {
  validatePoolId(poolId, context);
  validateAmount(amountADesired, "amountADesired", options, context);
  validateAmount(amountBDesired, "amountBDesired", options, context);
  validateAmount(amountAMin, "amountAMin", {allowZeroAmounts: true}, context);
  validateAmount(amountBMin, "amountBMin", {allowZeroAmounts: true}, context);
  validateDeadline(deadline, options, context);

  // Validate that min amounts are not greater than desired amounts
  const bnAmountADesired = new BN(amountADesired.toString());
  const bnAmountAMin = new BN(amountAMin.toString());
  const bnAmountBDesired = new BN(amountBDesired.toString());
  const bnAmountBMin = new BN(amountBMin.toString());

  if (bnAmountAMin.gt(bnAmountADesired)) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidParameters,
      "Minimum amount A cannot be greater than desired amount A",
      {
        ...context,
        amountADesired: bnAmountADesired.toString(),
        amountAMin: bnAmountAMin.toString(),
      }
    );
  }

  if (bnAmountBMin.gt(bnAmountBDesired)) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidParameters,
      "Minimum amount B cannot be greater than desired amount B",
      {
        ...context,
        amountBDesired: bnAmountBDesired.toString(),
        amountBMin: bnAmountBMin.toString(),
      }
    );
  }
}

/**
 * Validate remove liquidity parameters
 */
export function validateRemoveLiquidityParams(
  poolId: PoolIdV2,
  binIds: BigNumberish[],
  amountAMin: BigNumberish,
  amountBMin: BigNumberish,
  deadline: BigNumberish,
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS,
  context?: ErrorContext
): void {
  validatePoolId(poolId, context);
  validateAmount(amountAMin, "amountAMin", {allowZeroAmounts: true}, context);
  validateAmount(amountBMin, "amountBMin", {allowZeroAmounts: true}, context);
  validateDeadline(deadline, options, context);

  if (!binIds || binIds.length === 0) {
    throw new EnhancedMiraV2Error(
      PoolCurveStateError.InvalidParameters,
      "At least one bin ID must be provided for liquidity removal",
      context
    );
  }

  binIds.forEach((binId, index) => {
    validateBinId(binId, {...context, binIndex: index});
  });
}

import {BN, type BigNumberish, type AssetId} from "fuels";
import {
  PoolCurveStateError,
  MiraV2Error,
  type PoolIdV2,
  type LiquidityConfig,
} from "../model";

/**
 * Error context for providing additional debugging information
 */
export interface ErrorContext {
  poolId?: PoolIdV2;
  binId?: number;
  assetId?: AssetId;
  amount?: BigNumberish;
  operation?: string;
  timestamp?: number;
  [key: string]: any;
}

/**
 * Enhanced MiraV2Error with better error messages and context
 */
export class EnhancedMiraV2Error extends MiraV2Error {
  constructor(
    errorType: PoolCurveStateError,
    message: string,
    context?: ErrorContext
  ) {
    const enhancedMessage = EnhancedMiraV2Error.buildErrorMessage(
      errorType,
      message,
      context
    );
    super(errorType, enhancedMessage, context);
  }

  private static buildErrorMessage(
    errorType: PoolCurveStateError,
    baseMessage: string,
    context?: ErrorContext
  ): string {
    let message = `[${errorType}] ${baseMessage}`;

    if (context) {
      const contextParts: string[] = [];

      if (context.poolId) {
        contextParts.push(`Pool: ${context.poolId.toString()}`);
      }

      if (context.binId !== undefined) {
        contextParts.push(`Bin: ${context.binId}`);
      }

      if (context.assetId) {
        contextParts.push(`Asset: ${context.assetId.bits}`);
      }

      if (context.amount !== undefined) {
        contextParts.push(`Amount: ${context.amount.toString()}`);
      }

      if (context.operation) {
        contextParts.push(`Operation: ${context.operation}`);
      }

      if (contextParts.length > 0) {
        message += ` | Context: ${contextParts.join(", ")}`;
      }
    }

    return message;
  }

  /**
   * Get user-friendly error message for display in UI
   */
  getUserFriendlyMessage(): string {
    switch (this.errorType) {
      case PoolCurveStateError.PoolNotFound:
        return "The requested pool does not exist. Please check the pool ID and try again.";

      case PoolCurveStateError.InsufficientAmountIn:
        return "Insufficient input amount for this swap. Please increase your input amount.";

      case PoolCurveStateError.InsufficientAmountOut:
        return "Cannot achieve the desired output amount. Please reduce your expected output or increase slippage tolerance.";

      case PoolCurveStateError.OutOfLiquidity:
        return "Insufficient liquidity in the pool for this operation. Try a smaller amount or different route.";

      case PoolCurveStateError.InvalidBinStep:
        return "Invalid bin step provided. Please use a valid bin step value.";

      case PoolCurveStateError.InvalidActiveId:
        return "Invalid active bin ID. Please check the bin ID and try again.";

      case PoolCurveStateError.IdenticalAssets:
        return "Cannot create pool or swap with identical assets. Please use different assets.";

      case PoolCurveStateError.MaxLiquidityPerBinExceeded:
        return "Maximum liquidity per bin exceeded. Please distribute liquidity across more bins.";

      case PoolCurveStateError.ZeroShares:
        return "Cannot perform operation with zero shares. Please provide a valid amount.";

      case PoolCurveStateError.InvalidLPTokenBalance:
        return "Invalid LP token balance. Please check your LP token holdings.";

      case PoolCurveStateError.SwapNotPossible:
        return "Swap is not possible with current pool conditions. Please try again later.";

      case PoolCurveStateError.PoolAlreadyExists:
        return "A pool with these parameters already exists. Use the existing pool instead.";

      case PoolCurveStateError.Unauthorized:
        return "You are not authorized to perform this operation.";

      case PoolCurveStateError.InvalidParameters:
        return "Invalid parameters provided. Please check your input values.";

      default:
        return this.message;
    }
  }

  /**
   * Check if error is recoverable (user can retry with different parameters)
   */
  isRecoverable(): boolean {
    const recoverableErrors = [
      PoolCurveStateError.InsufficientAmountIn,
      PoolCurveStateError.InsufficientAmountOut,
      PoolCurveStateError.OutOfLiquidity,
      PoolCurveStateError.MaxLiquidityPerBinExceeded,
      PoolCurveStateError.ZeroShares,
      PoolCurveStateError.SwapNotPossible,
    ];

    return recoverableErrors.includes(this.errorType);
  }
}

/**
 * Parse contract error and convert to MiraV2Error
 */
export function parseContractError(
  error: any,
  context?: ErrorContext
): EnhancedMiraV2Error {
  // Handle different error formats from Fuel SDK
  let errorMessage = error.message || error.toString();
  let errorType = PoolCurveStateError.InvalidParameters;

  // Try to extract error type from contract revert reason
  if (typeof errorMessage === "string") {
    // Look for specific error patterns in the message
    if (
      errorMessage.includes("PoolNotFound") ||
      errorMessage.includes("pool not found")
    ) {
      errorType = PoolCurveStateError.PoolNotFound;
    } else if (
      errorMessage.includes("InsufficientAmountIn") ||
      errorMessage.includes("insufficient input")
    ) {
      errorType = PoolCurveStateError.InsufficientAmountIn;
    } else if (
      errorMessage.includes("InsufficientAmountOut") ||
      errorMessage.includes("insufficient output")
    ) {
      errorType = PoolCurveStateError.InsufficientAmountOut;
    } else if (
      errorMessage.includes("OutOfLiquidity") ||
      errorMessage.includes("insufficient liquidity")
    ) {
      errorType = PoolCurveStateError.OutOfLiquidity;
    } else if (errorMessage.includes("InvalidBinStep")) {
      errorType = PoolCurveStateError.InvalidBinStep;
    } else if (errorMessage.includes("InvalidActiveId")) {
      errorType = PoolCurveStateError.InvalidActiveId;
    } else if (errorMessage.includes("IdenticalAssets")) {
      errorType = PoolCurveStateError.IdenticalAssets;
    } else if (errorMessage.includes("MaxLiquidityPerBinExceeded")) {
      errorType = PoolCurveStateError.MaxLiquidityPerBinExceeded;
    } else if (errorMessage.includes("ZeroShares")) {
      errorType = PoolCurveStateError.ZeroShares;
    } else if (errorMessage.includes("InvalidLPTokenBalance")) {
      errorType = PoolCurveStateError.InvalidLPTokenBalance;
    } else if (errorMessage.includes("SwapNotPossible")) {
      errorType = PoolCurveStateError.SwapNotPossible;
    } else if (errorMessage.includes("PoolAlreadyExists")) {
      errorType = PoolCurveStateError.PoolAlreadyExists;
    } else if (errorMessage.includes("Unauthorized")) {
      errorType = PoolCurveStateError.Unauthorized;
    }
  }

  return new EnhancedMiraV2Error(errorType, errorMessage, {
    ...context,
    timestamp: Date.now(),
    originalError: error,
  });
}

/**
 * Wrap async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: ErrorContext
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // If it's already a MiraV2Error, don't wrap it again
    if (error instanceof MiraV2Error || error instanceof EnhancedMiraV2Error) {
      throw error;
    }
    throw parseContractError(error, context);
  }
}

/**
 * Create error context for operations
 */
export function createErrorContext(
  operation: string,
  additionalContext?: Partial<ErrorContext>
): ErrorContext {
  return {
    operation,
    timestamp: Date.now(),
    ...additionalContext,
  };
}

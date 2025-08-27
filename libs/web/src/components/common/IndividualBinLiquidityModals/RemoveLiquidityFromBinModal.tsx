"use client";

import {useState, useEffect} from "react";
import {BN} from "fuels";
import {X, Minus, AlertCircle} from "lucide-react";
import {
  useRemoveLiquidityFromBin,
  usePartialRemoveLiquidityFromBin,
} from "@/src/hooks";
import {useAssetMetadata} from "@/src/hooks";
import {V2BinPosition} from "@/src/hooks/useUserBinPositionsV2";

interface RemoveLiquidityFromBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolId: BN;
  position: V2BinPosition;
  assetXId: string;
  assetYId: string;
  onSuccess?: () => void;
}

export function RemoveLiquidityFromBinModal({
  isOpen,
  onClose,
  poolId,
  position,
  assetXId,
  assetYId,
  onSuccess,
}: RemoveLiquidityFromBinModalProps) {
  const [removePercentage, setRemovePercentage] = useState(100);
  const [slippage, setSlippage] = useState(50); // 0.5% default
  const [isPartialRemoval, setIsPartialRemoval] = useState(false);

  const assetXMetadata = useAssetMetadata(assetXId);
  const assetYMetadata = useAssetMetadata(assetYId);
  const {
    removeLiquidityFromBin,
    isPending: isFullRemovalPending,
    error: fullRemovalError,
  } = useRemoveLiquidityFromBin();
  const {
    partialRemoveLiquidityFromBin,
    isPending: isPartialRemovalPending,
    error: partialRemovalError,
  } = usePartialRemoveLiquidityFromBin();

  const isPending = isFullRemovalPending || isPartialRemovalPending;
  const error = fullRemovalError || partialRemovalError;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRemovePercentage(100);
      setSlippage(50);
      setIsPartialRemoval(false);
    }
  }, [isOpen]);

  // Update partial removal flag based on percentage
  useEffect(() => {
    setIsPartialRemoval(removePercentage < 100);
  }, [removePercentage]);

  const formatAmount = (amount: BN, decimals: number = 9) => {
    try {
      return parseFloat(amount.formatUnits(decimals)).toFixed(4);
    } catch {
      return "0.0000";
    }
  };

  const calculateRemovalAmounts = () => {
    const percentage = removePercentage / 100;
    return {
      x: position.underlyingAmounts.x
        .mul(new BN(Math.floor(percentage * 10000)))
        .div(new BN(10000)),
      y: position.underlyingAmounts.y
        .mul(new BN(Math.floor(percentage * 10000)))
        .div(new BN(10000)),
      lpTokens: position.lpTokenAmount
        .mul(new BN(Math.floor(percentage * 10000)))
        .div(new BN(10000)),
    };
  };

  const removalAmounts = calculateRemovalAmounts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (removePercentage === 100) {
        // Full removal
        await removeLiquidityFromBin({
          poolId,
          binId: position.binId,
          lpTokenAmount: position.lpTokenAmount,
          slippage,
        });
      } else {
        // Partial removal
        await partialRemoveLiquidityFromBin({
          poolId,
          binId: position.binId,
          percentage: removePercentage,
          currentLpTokenAmount: position.lpTokenAmount,
          slippage,
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to remove liquidity from bin:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Remove Liquidity from Bin
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <div className="font-medium">Bin #{position.binId.toString()}</div>
            <div>
              Price: {position.price.toFixed(6)} {assetXMetadata.symbol} per{" "}
              {assetYMetadata.symbol}
            </div>
            {position.isActive && (
              <div className="text-green-600 dark:text-green-400 font-medium">
                Active Bin
              </div>
            )}
          </div>
        </div>

        {/* Current Position Summary */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <div className="font-medium mb-2">Current Position</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-gray-500">
                  {assetXMetadata.symbol}:
                </span>
                <div className="font-mono">
                  {formatAmount(
                    position.underlyingAmounts.x,
                    assetXMetadata.decimals
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">
                  {assetYMetadata.symbol}:
                </span>
                <div className="font-mono">
                  {formatAmount(
                    position.underlyingAmounts.y,
                    assetYMetadata.decimals
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Removal Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount to Remove: {removePercentage}%
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={removePercentage}
              onChange={(e) => setRemovePercentage(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Quick Percentage Buttons */}
          <div className="flex space-x-2">
            {[25, 50, 75, 100].map((percentage) => (
              <button
                key={percentage}
                type="button"
                onClick={() => setRemovePercentage(percentage)}
                className={`flex-1 px-3 py-1 text-sm rounded ${
                  removePercentage === percentage
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {percentage}%
              </button>
            ))}
          </div>

          {/* Removal Preview */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <div className="font-medium mb-2">You will receive:</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs">{assetXMetadata.symbol}:</span>
                  <div className="font-mono">
                    {formatAmount(removalAmounts.x, assetXMetadata.decimals)}
                  </div>
                </div>
                <div>
                  <span className="text-xs">{assetYMetadata.symbol}:</span>
                  <div className="font-mono">
                    {formatAmount(removalAmounts.y, assetYMetadata.decimals)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slippage Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slippage Tolerance
            </label>
            <div className="flex space-x-2">
              {[25, 50, 100].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSlippage(value)}
                  className={`px-3 py-1 text-sm rounded ${
                    slippage === value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {value / 100}%
                </button>
              ))}
              <input
                type="number"
                value={slippage / 100}
                onChange={(e) => setSlippage(parseFloat(e.target.value) * 100)}
                step="0.01"
                min="0.01"
                max="50"
                className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {error.message || "Failed to remove liquidity"}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Minus className="w-4 h-4" />
              )}
              <span>
                {isPending
                  ? "Removing..."
                  : isPartialRemoval
                    ? `Remove ${removePercentage}%`
                    : "Remove All"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

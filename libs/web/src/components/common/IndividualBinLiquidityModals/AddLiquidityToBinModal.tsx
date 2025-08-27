"use client";

import {useState, useEffect} from "react";
import {BN} from "fuels";
import {X, Plus, AlertCircle} from "lucide-react";
import {useAddLiquidityToBin} from "@/src/hooks";
import {useAssetMetadata} from "@/src/hooks";

interface AddLiquidityToBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolId: BN;
  binId: BN;
  binPrice: number;
  assetXId: string;
  assetYId: string;
  onSuccess?: () => void;
}

export function AddLiquidityToBinModal({
  isOpen,
  onClose,
  poolId,
  binId,
  binPrice,
  assetXId,
  assetYId,
  onSuccess,
}: AddLiquidityToBinModalProps) {
  const [amountX, setAmountX] = useState("");
  const [amountY, setAmountY] = useState("");
  const [slippage, setSlippage] = useState(50); // 0.5% default
  const [isBalanced, setIsBalanced] = useState(true);

  const assetXMetadata = useAssetMetadata(assetXId);
  const assetYMetadata = useAssetMetadata(assetYId);
  const {addLiquidityToBin, isPending, error} = useAddLiquidityToBin();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAmountX("");
      setAmountY("");
      setSlippage(50);
      setIsBalanced(true);
    }
  }, [isOpen]);

  const handleAmountXChange = (value: string) => {
    setAmountX(value);
    if (isBalanced && value) {
      // Calculate corresponding Y amount based on bin price
      const xAmount = parseFloat(value);
      const yAmount = xAmount * binPrice;
      setAmountY(yAmount.toString());
    }
  };

  const handleAmountYChange = (value: string) => {
    setAmountY(value);
    if (isBalanced && value) {
      // Calculate corresponding X amount based on bin price
      const yAmount = parseFloat(value);
      const xAmount = yAmount / binPrice;
      setAmountX(xAmount.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amountX || !amountY) {
      return;
    }

    try {
      const amountXBN = new BN(
        Math.floor(
          parseFloat(amountX) * Math.pow(10, assetXMetadata.decimals || 9)
        )
      );
      const amountYBN = new BN(
        Math.floor(
          parseFloat(amountY) * Math.pow(10, assetYMetadata.decimals || 9)
        )
      );

      await addLiquidityToBin({
        poolId,
        binId,
        amountX: amountXBN,
        amountY: amountYBN,
        slippage,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to add liquidity to bin:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add Liquidity to Bin
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
            <div className="font-medium">Bin #{binId.toString()}</div>
            <div>
              Price: {binPrice.toFixed(6)} {assetXMetadata.symbol} per{" "}
              {assetYMetadata.symbol}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Balanced Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="balanced"
              checked={isBalanced}
              onChange={(e) => setIsBalanced(e.target.checked)}
              className="rounded"
            />
            <label
              htmlFor="balanced"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Balanced liquidity (maintain price ratio)
            </label>
          </div>

          {/* Amount X Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {assetXMetadata.symbol || "Asset X"} Amount
            </label>
            <input
              type="number"
              value={amountX}
              onChange={(e) => handleAmountXChange(e.target.value)}
              placeholder="0.0"
              step="any"
              min="0"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Amount Y Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {assetYMetadata.symbol || "Asset Y"} Amount
            </label>
            <input
              type="number"
              value={amountY}
              onChange={(e) => handleAmountYChange(e.target.value)}
              placeholder="0.0"
              step="any"
              min="0"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
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
                {error.message || "Failed to add liquidity"}
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
              disabled={isPending || !amountX || !amountY}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isPending ? "Adding..." : "Add Liquidity"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import {BN} from "fuels";
import {useUserBinPositionsV2, usePositionSummaryV2} from "@/src/hooks";
import {PositionSummaryV2} from "@/src/components/common/PositionSummaryV2";
import {ConcentratedLiquidityMetrics} from "@/src/components/common";

interface PositionViewV2Props {
  poolId: BN;
  assetXId: string;
  assetYId: string;
}

export function PositionViewV2({
  poolId,
  assetXId,
  assetYId,
}: PositionViewV2Props) {
  const {data: positions, isLoading, error} = useUserBinPositionsV2(poolId);
  const summary = usePositionSummaryV2(positions || []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading positions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-300">
          Failed to load positions: {error.message}
        </p>
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-500">
          No liquidity positions found in this v2 pool.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Add liquidity to start earning fees from trades.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Position Summary */}
      <PositionSummaryV2
        poolId={poolId}
        positions={positions}
        assetXId={assetXId}
        assetYId={assetYId}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {summary.totalBins}
          </div>
          <div className="text-sm text-gray-500">Total Bins</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {summary.activeBins}
          </div>
          <div className="text-sm text-gray-500">Active Bins</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {summary.averagePrice.toFixed(4)}
          </div>
          <div className="text-sm text-gray-500">Avg Price</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 text-center">
          <div className="text-lg font-bold text-orange-600">
            {summary.priceRange.min.toFixed(4)} -{" "}
            {summary.priceRange.max.toFixed(4)}
          </div>
          <div className="text-sm text-gray-500">Price Range</div>
        </div>
      </div>

      {/* Concentrated Liquidity Metrics */}
      <ConcentratedLiquidityMetrics
        poolId={poolId}
        positions={positions}
        assetXId={assetXId}
        assetYId={assetYId}
        activeBinId={new BN(8388608)} // Mock active bin ID
        binStep={25}
        currentPrice={1.0}
      />

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
          Add More Liquidity
        </button>
        <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
          Remove Liquidity
        </button>
      </div>
    </div>
  );
}

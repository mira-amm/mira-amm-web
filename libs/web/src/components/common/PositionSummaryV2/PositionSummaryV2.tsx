import {useMemo} from "react";
import {BN} from "fuels";
import {V2BinPosition} from "@/src/hooks";
import {useAssetMetadata} from "@/src/hooks";

interface PositionSummaryV2Props {
  poolId: BN;
  positions: V2BinPosition[];
  assetXId: string;
  assetYId: string;
  className?: string;
}

export function PositionSummaryV2({
  poolId,
  positions,
  assetXId,
  assetYId,
  className = "",
}: PositionSummaryV2Props) {
  const assetXMetadata = useAssetMetadata(assetXId);
  const assetYMetadata = useAssetMetadata(assetYId);

  // Calculate totals across all bins
  const summary = useMemo(() => {
    const totalLiquidity = positions.reduce(
      (total, position) => ({
        x: total.x.add(position.underlyingAmounts.x),
        y: total.y.add(position.underlyingAmounts.y),
      }),
      {x: new BN(0), y: new BN(0)}
    );

    const totalFeesEarned = positions.reduce(
      (total, position) => ({
        x: total.x.add(position.feesEarned.x),
        y: total.y.add(position.feesEarned.y),
      }),
      {x: new BN(0), y: new BN(0)}
    );

    const activeBins = positions.filter((p) => p.isActive);
    const inactiveBins = positions.filter((p) => !p.isActive);

    return {
      totalLiquidity,
      totalFeesEarned,
      totalBins: positions.length,
      activeBins: activeBins.length,
      inactiveBins: inactiveBins.length,
    };
  }, [positions]);

  const formatAmount = (amount: BN, decimals: number = 9) => {
    try {
      return amount.formatUnits(decimals);
    } catch {
      return "0";
    }
  };

  if (positions.length === 0) {
    return (
      <div
        className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`}
      >
        <p className="text-center text-gray-500">
          No liquidity positions found
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border p-4 space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg  text-gray-900 dark:text-white">
          Position Summary
        </h3>
        <div className="text-sm text-gray-500">
          Pool ID: {poolId.toString()}
        </div>
      </div>

      {/* Total Liquidity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-sm text-blue-600 dark:text-blue-400 ">
            Total {assetXMetadata.symbol || "Asset X"}
          </div>
          <div className="text-lg  text-blue-900 dark:text-blue-100">
            {formatAmount(summary.totalLiquidity.x, assetXMetadata.decimals)}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="text-sm text-green-600 dark:text-green-400 ">
            Total {assetYMetadata.symbol || "Asset Y"}
          </div>
          <div className="text-lg  text-green-900 dark:text-green-100">
            {formatAmount(summary.totalLiquidity.y, assetYMetadata.decimals)}
          </div>
        </div>
      </div>

      {/* Fees Earned */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
        <div className="text-sm text-yellow-600 dark:text-yellow-400  mb-2">
          Total Fees Earned
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-yellow-900 dark:text-yellow-100">
              {formatAmount(summary.totalFeesEarned.x, assetXMetadata.decimals)}{" "}
              {assetXMetadata.symbol}
            </span>
          </div>
          <div>
            <span className="text-yellow-900 dark:text-yellow-100">
              {formatAmount(summary.totalFeesEarned.y, assetYMetadata.decimals)}{" "}
              {assetYMetadata.symbol}
            </span>
          </div>
        </div>
      </div>

      {/* Bin Statistics */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-2xl text-gray-900 dark:text-white">
            {summary.totalBins}
          </div>
          <div className="text-sm text-gray-500">Total Bins</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="text-2xl text-green-600 dark:text-green-400">
            {summary.activeBins}
          </div>
          <div className="text-sm text-gray-500">Active Bins</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-2xl text-gray-600 dark:text-gray-400">
            {summary.inactiveBins}
          </div>
          <div className="text-sm text-gray-500">Inactive Bins</div>
        </div>
      </div>

      {/* Individual Bin Details */}
      <div className="space-y-2">
        <div className="text-sm  text-gray-700 dark:text-gray-300">
          Bin Details
        </div>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {positions.map((position, index) => (
            <div
              key={index}
              className={`flex justify-between items-center p-2 rounded text-xs ${
                position.isActive
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-gray-50 dark:bg-gray-700"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="font-mono">
                  Bin {position.binId.toString()}
                </span>
                {position.isActive && (
                  <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-1 py-0.5 rounded text-xs">
                    Active
                  </span>
                )}
              </div>
              <div className="text-right">
                <div>
                  {formatAmount(
                    position.underlyingAmounts.x,
                    assetXMetadata.decimals
                  )}{" "}
                  /{" "}
                  {formatAmount(
                    position.underlyingAmounts.y,
                    assetYMetadata.decimals
                  )}
                </div>
                <div className="text-gray-500">
                  Price: {position.price.toFixed(6)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

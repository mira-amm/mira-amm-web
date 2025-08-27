import {useState, useEffect} from "react";
import {
  generateLiquidityDistribution,
  distributionToVisualizationData,
  getDistributionSummary,
  LiquidityDistributionResult,
} from "./liquidityDistributionGenerator";
import {LiquidityShape} from "./V2LiquidityConfig";

interface LiquidityDistributionDemoProps {
  numBins: number;
  binStep: number;
  currentPrice: number;
  priceRange: [number, number];
  liquidityShape: LiquidityShape;
}

export default function LiquidityDistributionDemo({
  numBins,
  binStep,
  currentPrice,
  priceRange,
  liquidityShape,
}: LiquidityDistributionDemoProps) {
  const [distribution, setDistribution] =
    useState<LiquidityDistributionResult | null>(null);
  const [visualizationData, setVisualizationData] = useState<any[]>([]);

  useEffect(() => {
    const newDistribution = generateLiquidityDistribution({
      numBins,
      binStep,
      currentPrice,
      priceRange,
      liquidityShape,
      totalLiquidityAmount: 10000,
    });

    setDistribution(newDistribution);
    setVisualizationData(distributionToVisualizationData(newDistribution));
  }, [numBins, binStep, currentPrice, priceRange, liquidityShape]);

  if (!distribution) {
    return <div>Loading...</div>;
  }

  const summary = getDistributionSummary(distribution);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">
        Liquidity Distribution Demo
      </h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Total Bins
          </div>
          <div className="text-xl font-bold">{summary.totalBins}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Active Bin
          </div>
          <div className="text-xl font-bold">#{summary.activeBinId}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Utilization
          </div>
          <div className="text-xl font-bold">
            {summary.utilizationRate.toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Total Value
          </div>
          <div className="text-xl font-bold">
            {summary.totalValue.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Bin Details */}
      <div className="mb-6">
        <h4 className="text-md font-medium mb-3">Bin Distribution</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {distribution.bins.map((bin) => (
            <div
              key={bin.binId}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                bin.isActive
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-200 dark:border-gray-600"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="font-medium">Bin #{bin.binId}</span>
                {bin.isActive && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                    Active
                  </span>
                )}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ${bin.price.toFixed(4)}
                </span>
              </div>
              <div className="text-right text-sm">
                <div>Asset0: {bin.liquidityX.toFixed(2)}</div>
                <div>Asset1: {bin.liquidityY.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visualization Preview */}
      <div>
        <h4 className="text-md font-medium mb-3">Visualization Data</h4>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-end justify-between h-32 space-x-1">
            {visualizationData.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center h-full justify-end"
              >
                {/* Asset B (blue) */}
                {item.assetBHeight > 0 && (
                  <div
                    className="bg-blue-500 rounded-t-sm w-4"
                    style={{height: `${item.assetBHeight}px`}}
                    title={`Asset1: ${item.asset1Value.toFixed(2)}`}
                  />
                )}
                {/* Asset A (red) */}
                {item.assetAHeight > 0 && (
                  <div
                    className={`bg-red-500 w-4 ${item.assetBHeight === 0 ? "rounded-t-sm" : ""} rounded-b-sm`}
                    style={{height: `${item.assetAHeight}px`}}
                    title={`Asset0: ${item.asset0Value.toFixed(2)}`}
                  />
                )}
                {/* Placeholder if no liquidity */}
                {item.assetAHeight === 0 && item.assetBHeight === 0 && (
                  <div className="bg-gray-300 w-4 h-1 rounded-sm" />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            {visualizationData
              .filter((item) => item.showPrice)
              .map((item, index) => (
                <span key={index}>{item.price}</span>
              ))}
          </div>
        </div>
      </div>

      {/* Configuration Display */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <h4 className="text-md font-medium mb-2">Current Configuration</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            Shape: <span className="font-medium">{liquidityShape}</span>
          </div>
          <div>
            Bins: <span className="font-medium">{numBins}</span>
          </div>
          <div>
            Bin Step: <span className="font-medium">{binStep}bp</span>
          </div>
          <div>
            Current Price: <span className="font-medium">${currentPrice}</span>
          </div>
          <div>
            Min Price: <span className="font-medium">${priceRange[0]}</span>
          </div>
          <div>
            Max Price: <span className="font-medium">${priceRange[1]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

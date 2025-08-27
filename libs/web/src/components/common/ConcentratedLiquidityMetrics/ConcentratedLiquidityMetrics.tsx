import {TrendingUp, Target, BarChart3, Zap} from "lucide-react";
import {cn} from "@/src/utils/cn";

export interface ConcentratedLiquidityMetrics {
  activeBin: number;
  binStep: number;
  totalBins: number;
  liquidityDistribution: {
    binId: number;
    price: number;
    liquidityX: string;
    liquidityY: string;
    isActive: boolean;
  }[];
  concentrationRange: {
    minPrice: number;
    maxPrice: number;
    currentPrice: number;
  };
  utilizationRate: number; // Percentage of liquidity in active range
  feeRate: number; // Current dynamic fee rate in basis points
}

interface ConcentratedLiquidityMetricsProps {
  metrics: ConcentratedLiquidityMetrics;
  asset0Symbol: string;
  asset1Symbol: string;
  className?: string;
}

export default function ConcentratedLiquidityMetrics({
  metrics,
  asset0Symbol,
  asset1Symbol,
  className,
}: ConcentratedLiquidityMetricsProps) {
  const {
    activeBin,
    binStep,
    totalBins,
    liquidityDistribution,
    concentrationRange,
    utilizationRate,
    feeRate,
  } = metrics;

  const formatPrice = (price: number) => price.toFixed(4);
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  const formatBasisPoints = (bp: number) => `${(bp / 100).toFixed(2)}%`;

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg p-6 border",
        className
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Concentrated Liquidity Metrics
        </h3>
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-purple-500" />
          <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            V2 Pool
          </span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Active Bin
            </span>
            <Zap className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            #{activeBin}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Price: {formatPrice(concentrationRange.currentPrice)}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Bin Step
            </span>
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {binStep}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            basis points
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Utilization
            </span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatPercentage(utilizationRate)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            of liquidity active
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Current Fee
            </span>
            <div className="w-4 h-4 bg-purple-500 rounded-full" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatBasisPoints(feeRate)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            dynamic rate
          </div>
        </div>
      </div>

      {/* Price Range Information */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
          Concentration Range
        </h4>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Min Price
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatPrice(concentrationRange.minPrice)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Current Price
              </div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatPrice(concentrationRange.currentPrice)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Max Price
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatPrice(concentrationRange.maxPrice)}
              </div>
            </div>
          </div>

          {/* Price Range Visualization */}
          <div className="relative h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
            <div
              className="absolute h-2 bg-purple-500 rounded-full"
              style={{
                left: "10%",
                width: "80%",
              }}
            />
            <div
              className="absolute w-3 h-3 bg-green-500 rounded-full transform -translate-y-0.5"
              style={{
                left: `${
                  ((concentrationRange.currentPrice -
                    concentrationRange.minPrice) /
                    (concentrationRange.maxPrice -
                      concentrationRange.minPrice)) *
                    80 +
                  10
                }%`,
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>
              {asset0Symbol} per {asset1Symbol}
            </span>
            <span>Current: {formatPrice(concentrationRange.currentPrice)}</span>
          </div>
        </div>
      </div>

      {/* Liquidity Distribution */}
      <div>
        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
          Liquidity Distribution ({totalBins} bins)
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {liquidityDistribution.slice(0, 5).map((bin) => (
            <div
              key={bin.binId}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                bin.isActive
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Bin #{bin.binId}
                  </span>
                  {bin.isActive && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatPrice(bin.price)}
                </span>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {parseFloat(bin.liquidityX).toFixed(2)} {asset0Symbol}
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {parseFloat(bin.liquidityY).toFixed(2)} {asset1Symbol}
                </div>
              </div>
            </div>
          ))}

          {liquidityDistribution.length > 5 && (
            <div className="text-center py-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                +{liquidityDistribution.length - 5} more bins
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for pool lists
export function ConcentratedLiquidityMetricsCompact({
  metrics,
  className,
}: {
  metrics: Pick<
    ConcentratedLiquidityMetrics,
    "activeBin" | "binStep" | "utilizationRate" | "feeRate"
  >;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center space-x-4 text-sm", className)}>
      <div className="flex items-center space-x-1">
        <Target className="w-3 h-3 text-purple-500" />
        <span className="text-gray-600 dark:text-gray-400">
          Bin #{metrics.activeBin}
        </span>
      </div>
      <div className="flex items-center space-x-1">
        <BarChart3 className="w-3 h-3 text-blue-500" />
        <span className="text-gray-600 dark:text-gray-400">
          {metrics.binStep}bp
        </span>
      </div>
      <div className="flex items-center space-x-1">
        <TrendingUp className="w-3 h-3 text-orange-500" />
        <span className="text-gray-600 dark:text-gray-400">
          {metrics.utilizationRate.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

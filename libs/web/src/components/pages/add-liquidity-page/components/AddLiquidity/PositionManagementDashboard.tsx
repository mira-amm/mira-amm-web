import {useState, useEffect} from "react";
import {Trash2, Plus, Minus, TrendingUp, DollarSign} from "lucide-react";

export interface V2BinPosition {
  binId: number;
  lpToken: string; // The specific LP token for this bin position
  lpTokenAmount: string;
  underlyingAmounts: {x: string; y: string};
  price: number; // Single price point for this bin
  feesEarned: {x: string; y: string};
  isActive: boolean; // Whether this bin contains the current active price
}

export interface V2Position {
  poolId: string;
  bins: V2BinPosition[];
  totalValue: {x: string; y: string};
  totalFeesEarned: {x: string; y: string};
}

interface PositionManagementDashboardProps {
  poolId: string;
  userAddress: string;
  asset0Symbol: string;
  asset1Symbol: string;
  onAddLiquidity?: (binId: number) => void;
  onRemoveLiquidity?: (binId: number, amount: string) => void;
}

// Mock data for demonstration
const mockPosition: V2Position = {
  poolId: "123",
  bins: [
    {
      binId: 8,
      lpToken: "0x123...abc",
      lpTokenAmount: "1000.0",
      underlyingAmounts: {x: "500.0", y: "0.0"},
      price: 0.95,
      feesEarned: {x: "2.5", y: "0.0"},
      isActive: false,
    },
    {
      binId: 9,
      lpToken: "0x456...def",
      lpTokenAmount: "2000.0",
      underlyingAmounts: {x: "800.0", y: "200.0"},
      price: 1.0,
      feesEarned: {x: "5.2", y: "1.3"},
      isActive: true,
    },
    {
      binId: 10,
      lpToken: "0x789...ghi",
      lpTokenAmount: "1500.0",
      underlyingAmounts: {x: "0.0", y: "750.0"},
      price: 1.05,
      feesEarned: {x: "0.0", y: "3.8"},
      isActive: false,
    },
  ],
  totalValue: {x: "1300.0", y: "950.0"},
  totalFeesEarned: {x: "7.7", y: "5.1"},
};

export default function PositionManagementDashboard({
  poolId,
  userAddress,
  asset0Symbol,
  asset1Symbol,
  onAddLiquidity,
  onRemoveLiquidity,
}: PositionManagementDashboardProps) {
  const [position, setPosition] = useState<V2Position | null>(null);
  const [selectedBins, setSelectedBins] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading position data
    const loadPosition = async () => {
      setIsLoading(true);
      // In real implementation, this would fetch from the SDK
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPosition(mockPosition);
      setIsLoading(false);
    };

    loadPosition();
  }, [poolId, userAddress]);

  const handleBinSelection = (binId: number) => {
    const newSelected = new Set(selectedBins);
    if (newSelected.has(binId)) {
      newSelected.delete(binId);
    } else {
      newSelected.add(binId);
    }
    setSelectedBins(newSelected);
  };

  const handleRemoveFromSelectedBins = () => {
    selectedBins.forEach((binId) => {
      onRemoveLiquidity?.(binId, "100"); // Remove 100% by default
    });
    setSelectedBins(new Set());
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!position || position.bins.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border text-center">
        <div className="text-gray-500 dark:text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg  mb-2">No Positions Found</h3>
          <p className="text-sm">
            You don't have any liquidity positions in this pool yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl  text-gray-900 dark:text-gray-100">
          Position Management
        </h2>
        {selectedBins.size > 0 && (
          <button
            onClick={handleRemoveFromSelectedBins}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove Selected ({selectedBins.size})
          </button>
        )}
      </div>

      {/* Position Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm  text-gray-600 dark:text-gray-300">
              Total Liquidity
            </span>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-1">
            <div className="text-lg  text-gray-900 dark:text-gray-100">
              {parseFloat(position.totalValue.x).toFixed(2)} {asset0Symbol}
            </div>
            <div className="text-lg  text-gray-900 dark:text-gray-100">
              {parseFloat(position.totalValue.y).toFixed(2)} {asset1Symbol}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm  text-gray-600 dark:text-gray-300">
              Total Fees Earned
            </span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="space-y-1">
            <div className="text-lg  text-green-600 dark:text-green-400">
              {parseFloat(position.totalFeesEarned.x).toFixed(2)} {asset0Symbol}
            </div>
            <div className="text-lg  text-green-600 dark:text-green-400">
              {parseFloat(position.totalFeesEarned.y).toFixed(2)} {asset1Symbol}
            </div>
          </div>
        </div>
      </div>

      {/* Bin Positions */}
      <div className="space-y-3">
        <h3 className="text-lg  text-gray-900 dark:text-gray-100 mb-3">
          Bin Positions ({position.bins.length})
        </h3>

        {position.bins.map((bin) => (
          <div
            key={bin.binId}
            className={`border rounded-lg p-4 transition-all cursor-pointer ${
              selectedBins.has(bin.binId)
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
            } ${bin.isActive ? "ring-2 ring-green-500 ring-opacity-50" : ""}`}
            onClick={() => handleBinSelection(bin.binId)}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg  text-gray-900 dark:text-gray-100">
                    Bin #{bin.binId}
                  </span>
                  {bin.isActive && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Price: {bin.price.toFixed(4)}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddLiquidity?.(bin.binId);
                  }}
                  className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Add liquidity to this bin"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveLiquidity?.(bin.binId, "50");
                  }}
                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Remove liquidity from this bin"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm  text-gray-600 dark:text-gray-300 mb-1">
                  Liquidity
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {parseFloat(bin.underlyingAmounts.x).toFixed(2)}{" "}
                    {asset0Symbol}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {parseFloat(bin.underlyingAmounts.y).toFixed(2)}{" "}
                    {asset1Symbol}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm  text-gray-600 dark:text-gray-300 mb-1">
                  Fees Earned
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-green-600 dark:text-green-400">
                    +{parseFloat(bin.feesEarned.x).toFixed(2)} {asset0Symbol}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    +{parseFloat(bin.feesEarned.y).toFixed(2)} {asset1Symbol}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                LP Token: {bin.lpToken} (
                {parseFloat(bin.lpTokenAmount).toFixed(2)})
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
        <div className="flex space-x-3">
          <button
            onClick={() => onAddLiquidity?.(0)} // 0 indicates new bin
            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Position
          </button>
          <button
            onClick={() => {
              const allBinIds = new Set(position.bins.map((bin) => bin.binId));
              setSelectedBins(allBinIds);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Select All
          </button>
        </div>
      </div>
    </div>
  );
}

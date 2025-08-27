"use client";

import {useState, useMemo} from "react";
import {BN} from "fuels";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Plus,
  Minus,
  Eye,
  EyeOff,
} from "lucide-react";
import {useUserBinPositionsV2, usePositionSummaryV2} from "@/src/hooks";
import {useAssetMetadata} from "@/src/hooks";
import {V2BinPosition} from "@/src/hooks/useUserBinPositionsV2";
import {
  AddLiquidityToBinModal,
  RemoveLiquidityFromBinModal,
} from "@/src/components/common";

interface PositionManagementDashboardProps {
  poolId: BN;
  assetXId: string;
  assetYId: string;
  onAddLiquidity?: (binId: BN) => void;
  onRemoveLiquidity?: (binId: BN, amount?: BN) => void;
}

type SortField = "binId" | "price" | "liquidity" | "fees" | "status";
type SortDirection = "asc" | "desc";

export function PositionManagementDashboard({
  poolId,
  assetXId,
  assetYId,
  onAddLiquidity,
  onRemoveLiquidity,
}: PositionManagementDashboardProps) {
  const {data: positions, isLoading, error} = useUserBinPositionsV2(poolId);
  const summary = usePositionSummaryV2(positions || []);
  const assetXMetadata = useAssetMetadata(assetXId);
  const assetYMetadata = useAssetMetadata(assetYId);

  const [sortField, setSortField] = useState<SortField>("binId");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showInactiveBins, setShowInactiveBins] = useState(true);
  const [selectedBins, setSelectedBins] = useState<Set<string>>(new Set());

  // Modal states
  const [addLiquidityModal, setAddLiquidityModal] = useState<{
    isOpen: boolean;
    binId?: BN;
    binPrice?: number;
  }>({isOpen: false});
  const [removeLiquidityModal, setRemoveLiquidityModal] = useState<{
    isOpen: boolean;
    position?: V2BinPosition;
  }>({isOpen: false});

  // Sort and filter positions
  const sortedPositions = useMemo(() => {
    if (!positions) return [];

    let filtered = positions;
    if (!showInactiveBins) {
      filtered = positions.filter((p) => p.isActive);
    }

    return filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case "binId":
          aValue = a.binId.toNumber();
          bValue = b.binId.toNumber();
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "liquidity":
          aValue = a.underlyingAmounts.x.add(a.underlyingAmounts.y).toNumber();
          bValue = b.underlyingAmounts.x.add(b.underlyingAmounts.y).toNumber();
          break;
        case "fees":
          aValue = a.feesEarned.x.add(a.feesEarned.y).toNumber();
          bValue = b.feesEarned.x.add(b.feesEarned.y).toNumber();
          break;
        case "status":
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [positions, sortField, sortDirection, showInactiveBins]);

  const formatAmount = (amount: BN, decimals: number = 9) => {
    try {
      const formatted = amount.formatUnits(decimals);
      return parseFloat(formatted).toFixed(4);
    } catch {
      return "0.0000";
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleBinSelection = (binId: string) => {
    const newSelected = new Set(selectedBins);
    if (newSelected.has(binId)) {
      newSelected.delete(binId);
    } else {
      newSelected.add(binId);
    }
    setSelectedBins(newSelected);
  };

  const handleBulkAction = (action: "add" | "remove") => {
    selectedBins.forEach((binIdStr) => {
      const binId = new BN(binIdStr);
      if (action === "add" && onAddLiquidity) {
        onAddLiquidity(binId);
      } else if (action === "remove" && onRemoveLiquidity) {
        onRemoveLiquidity(binId);
      }
    });
    setSelectedBins(new Set());
  };

  const handleAddLiquidityClick = (position: V2BinPosition) => {
    setAddLiquidityModal({
      isOpen: true,
      binId: position.binId,
      binPrice: position.price,
    });
  };

  const handleRemoveLiquidityClick = (position: V2BinPosition) => {
    setRemoveLiquidityModal({
      isOpen: true,
      position,
    });
  };

  const handleModalSuccess = () => {
    // Refresh data by invalidating queries - this will be handled by the hooks
    console.log("Liquidity operation completed successfully");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading position dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-300">
          Failed to load position dashboard: {error.message}
        </p>
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-medium">
          No liquidity positions found
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Add liquidity to start managing your positions across different price
          bins.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Position Management Dashboard
          </h2>
          <div className="text-sm text-gray-500">
            Pool ID: {poolId.toString()}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {summary.totalBins}
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              Total Bins
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.activeBins}
            </div>
            <div className="text-sm text-green-800 dark:text-green-200">
              Active Bins
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {summary.averagePrice.toFixed(4)}
            </div>
            <div className="text-sm text-purple-800 dark:text-purple-200">
              Avg Price
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
            <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
              {summary.priceRange.min.toFixed(4)} -{" "}
              {summary.priceRange.max.toFixed(4)}
            </div>
            <div className="text-sm text-orange-800 dark:text-orange-200">
              Price Range
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowInactiveBins(!showInactiveBins)}
              className="flex items-center space-x-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {showInactiveBins ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              <span>{showInactiveBins ? "Hide" : "Show"} Inactive Bins</span>
            </button>

            <div className="text-sm text-gray-500">
              Showing {sortedPositions.length} of {positions.length} bins
            </div>
          </div>

          {selectedBins.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedBins.size} selected
              </span>
              <button
                onClick={() => handleBulkAction("add")}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
              <button
                onClick={() => handleBulkAction("remove")}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <Minus className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Positions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedBins.size === sortedPositions.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBins(
                          new Set(
                            sortedPositions.map((p) => p.binId.toString())
                          )
                        );
                      } else {
                        setSelectedBins(new Set());
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort("binId")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Bin ID</span>
                    {sortField === "binId" && (
                      <span>
                        {sortDirection === "asc" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort("status")}
                >
                  Status
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Price</span>
                    {sortField === "price" && (
                      <span>
                        {sortDirection === "asc" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort("liquidity")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Liquidity</span>
                    {sortField === "liquidity" && (
                      <span>
                        {sortDirection === "asc" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort("fees")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Fees Earned</span>
                    {sortField === "fees" && (
                      <span>
                        {sortDirection === "asc" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedPositions.map((position, index) => (
                <tr
                  key={position.binId.toString()}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    position.isActive ? "bg-green-50 dark:bg-green-900/10" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedBins.has(position.binId.toString())}
                      onChange={() =>
                        handleBinSelection(position.binId.toString())
                      }
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900 dark:text-white">
                      {position.binId.toString()}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {position.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {position.price.toFixed(6)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div>
                        {formatAmount(
                          position.underlyingAmounts.x,
                          assetXMetadata.decimals
                        )}{" "}
                        {assetXMetadata.symbol}
                      </div>
                      <div>
                        {formatAmount(
                          position.underlyingAmounts.y,
                          assetYMetadata.decimals
                        )}{" "}
                        {assetYMetadata.symbol}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <DollarSign className="w-3 h-3 text-green-500 mr-1" />
                        {formatAmount(
                          position.feesEarned.x,
                          assetXMetadata.decimals
                        )}{" "}
                        {assetXMetadata.symbol}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-3 h-3 text-green-500 mr-1" />
                        {formatAmount(
                          position.feesEarned.y,
                          assetYMetadata.decimals
                        )}{" "}
                        {assetYMetadata.symbol}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAddLiquidityClick(position)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </button>
                      <button
                        onClick={() => handleRemoveLiquidityClick(position)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700"
                      >
                        <Minus className="w-3 h-3 mr-1" />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddLiquidityToBinModal
        isOpen={addLiquidityModal.isOpen}
        onClose={() => setAddLiquidityModal({isOpen: false})}
        poolId={poolId}
        binId={addLiquidityModal.binId || new BN(0)}
        binPrice={addLiquidityModal.binPrice || 0}
        assetXId={assetXId}
        assetYId={assetYId}
        onSuccess={handleModalSuccess}
      />

      <RemoveLiquidityFromBinModal
        isOpen={removeLiquidityModal.isOpen}
        onClose={() => setRemoveLiquidityModal({isOpen: false})}
        poolId={poolId}
        position={removeLiquidityModal.position!}
        assetXId={assetXId}
        assetYId={assetYId}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

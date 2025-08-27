import {useState} from "react";
import {BN} from "fuels";
import {Button} from "@/meshwave-ui/Button";
import {
  isV2MockEnabled,
  getAllMockV2Pools,
  getMockUserPositions,
  mockAddLiquidityV2,
  mockRemoveLiquidityV2,
} from "@/src/utils/mockConfig";

export function V2MockDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  if (!isV2MockEnabled()) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-gray-600 dark:text-gray-400">
          V2 Mock mode is not enabled. Set NEXT_PUBLIC_ENABLE_V2_MOCK=true to
          test mock functionality.
        </p>
      </div>
    );
  }

  const mockPools = getAllMockV2Pools();
  const mockPositions = getMockUserPositions("1001");

  const handleMockAddLiquidity = async () => {
    setIsLoading(true);
    try {
      const result = await mockAddLiquidityV2({
        poolId: "1001",
        amountX: "1000000000000000000", // 1 ETH
        amountY: "1000000000000000000", // 1 ETH
        binConfig: {strategy: "single-active-bin"},
      });
      setLastResult({type: "Add Liquidity", result});
    } catch (error) {
      setLastResult({type: "Error", result: error});
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockRemoveLiquidity = async () => {
    setIsLoading(true);
    try {
      const result = await mockRemoveLiquidityV2({
        poolId: "1001",
        binIds: [8388608, 8388609],
        amounts: {
          x: new BN("500000000000000000"),
          y: new BN("500000000000000000"),
        },
      });
      setLastResult({type: "Remove Liquidity", result});
    } catch (error) {
      setLastResult({type: "Error", result: error});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
        <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
          V2 Mock Testing Demo
        </h3>
      </div>

      {/* Mock Pools */}
      <div>
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          Available Mock Pools
        </h4>
        <div className="space-y-2">
          {mockPools.map((pool) => (
            <div
              key={pool.id}
              className="bg-white dark:bg-gray-800 rounded-md p-3 border"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{pool.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pool ID: {pool.id}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>Price: {pool.currentPrice}</p>
                  <p>
                    Bins: {pool.activeBins}/{pool.totalBins}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mock Positions */}
      <div>
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          Mock User Positions (Pool 1001)
        </h4>
        <div className="space-y-1">
          {mockPositions.map((position, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-md p-2 border text-sm"
            >
              <div className="flex justify-between">
                <span>
                  Bin {position.binId} {position.isActive ? "(Active)" : ""}
                </span>
                <span>
                  {(parseFloat(position.underlyingAmounts.x) / 1e18).toFixed(3)}{" "}
                  /{" "}
                  {(parseFloat(position.underlyingAmounts.y) / 1e18).toFixed(3)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mock Operations */}
      <div>
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          Test Mock Operations
        </h4>
        <div className="flex gap-2">
          <Button
            onClick={handleMockAddLiquidity}
            disabled={isLoading}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Adding..." : "Mock Add Liquidity"}
          </Button>
          <Button
            onClick={handleMockRemoveLiquidity}
            disabled={isLoading}
            size="sm"
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Removing..." : "Mock Remove Liquidity"}
          </Button>
        </div>
      </div>

      {/* Last Result */}
      {lastResult && (
        <div>
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Last Operation Result
          </h4>
          <div className="bg-white dark:bg-gray-800 rounded-md p-3 border">
            <p className="font-medium">{lastResult.type}</p>
            <pre className="text-xs mt-2 overflow-auto">
              {JSON.stringify(lastResult.result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="text-xs text-yellow-700 dark:text-yellow-300">
        <p>
          This demo shows the mock v2 functionality. All operations simulate
          real contract interactions with realistic delays and responses.
        </p>
      </div>
    </div>
  );
}

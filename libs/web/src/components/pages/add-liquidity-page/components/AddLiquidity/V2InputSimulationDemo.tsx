import React, {useState, useEffect} from "react";
import {Play, Settings, BarChart3} from "lucide-react";
import V2LiquidityConfig from "./V2LiquidityConfig";
import {simulateAddLiquidity} from "./mock/mockTransactionSimulator";
import {mockAddLiquidityV2} from "@/src/utils/mockConfig";

interface V2InputSimulationDemoProps {
  className?: string;
}

export default function V2InputSimulationDemo({
  className = "",
}: V2InputSimulationDemoProps) {
  const [v2Config, setV2Config] = useState<any>(null);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [inputAmounts, setInputAmounts] = useState({
    amountX: "1000",
    amountY: "1000",
  });

  // Mock asset metadata
  const mockAsset0 = {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    isLoading: false,
  };

  const mockAsset1 = {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    isLoading: false,
  };

  const runSimulation = async () => {
    if (!v2Config) {
      alert("Please configure liquidity distribution first");
      return;
    }

    setIsSimulating(true);
    setSimulationResult(null);

    try {
      // Simulate the transaction using the configured inputs
      const mockResult = await mockAddLiquidityV2({
        poolId: "1001",
        amountX: inputAmounts.amountX,
        amountY: inputAmounts.amountY,
        binConfig: {
          strategy: v2Config.liquidityShape,
          numBins: v2Config.numBins,
          priceRange: v2Config.priceRange,
          liquidityDistribution: v2Config.liquidityDistribution,
        },
      });

      // Also simulate the transaction mechanics
      const transactionResult = await simulateAddLiquidity(v2Config.numBins);

      setSimulationResult({
        mockResult,
        transactionResult,
        inputConfig: v2Config,
        inputAmounts,
      });
    } catch (error) {
      console.error("Simulation failed:", error);
      setSimulationResult({
        error: error.message,
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 border rounded-lg p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            V2 Input → Simulation Demo
          </h3>
        </div>
        <button
          onClick={runSimulation}
          disabled={isSimulating || !v2Config}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isSimulating || !v2Config
              ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          <Play className="w-4 h-4" />
          <span>{isSimulating ? "Simulating..." : "Run Simulation"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Configuration */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Configuration Inputs
          </h4>

          {/* Amount Inputs */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Liquidity Amounts
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Amount X (ETH)
                </label>
                <input
                  type="number"
                  value={inputAmounts.amountX}
                  onChange={(e) =>
                    setInputAmounts((prev) => ({
                      ...prev,
                      amountX: e.target.value,
                    }))
                  }
                  className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Amount Y (USDC)
                </label>
                <input
                  type="number"
                  value={inputAmounts.amountY}
                  onChange={(e) =>
                    setInputAmounts((prev) => ({
                      ...prev,
                      amountY: e.target.value,
                    }))
                  }
                  className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                />
              </div>
            </div>
          </div>

          {/* V2 Configuration */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Distribution Configuration
            </h5>
            <V2LiquidityConfig
              asset0Metadata={mockAsset0}
              asset1Metadata={mockAsset1}
              onConfigChange={setV2Config}
            />
          </div>

          {/* Current Config Display */}
          {v2Config && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Current Configuration
              </h5>
              <div className="text-xs space-y-1 text-blue-700 dark:text-blue-300">
                <div>
                  Shape:{" "}
                  <span className="font-mono">{v2Config.liquidityShape}</span>
                </div>
                <div>
                  Bins: <span className="font-mono">{v2Config.numBins}</span>
                </div>
                <div>
                  Range:{" "}
                  <span className="font-mono">
                    {v2Config.priceRange?.[0]?.toFixed(4)} -{" "}
                    {v2Config.priceRange?.[1]?.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Simulation Results */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Simulation Results
          </h4>

          {!simulationResult && !isSimulating && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Configure inputs and click "Run Simulation" to see results
              </p>
            </div>
          )}

          {isSimulating && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-blue-700 dark:text-blue-300">
                Running simulation with {v2Config?.numBins} bins...
              </p>
            </div>
          )}

          {simulationResult && !simulationResult.error && (
            <div className="space-y-4">
              {/* Transaction Result */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h5 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                  Transaction Simulation
                </h5>
                <div className="text-xs space-y-1 text-green-700 dark:text-green-300">
                  <div>
                    Status:{" "}
                    <span className="font-mono">
                      {simulationResult.transactionResult.success
                        ? "Success"
                        : "Failed"}
                    </span>
                  </div>
                  <div>
                    Gas Used:{" "}
                    <span className="font-mono">
                      {simulationResult.transactionResult.gasUsed}
                    </span>
                  </div>
                  <div>
                    Block:{" "}
                    <span className="font-mono">
                      {simulationResult.transactionResult.blockNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mock Result */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h5 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                  Liquidity Distribution
                </h5>
                <div className="text-xs space-y-1 text-purple-700 dark:text-purple-300">
                  <div>
                    Strategy:{" "}
                    <span className="font-mono">
                      {simulationResult.mockResult.strategy}
                    </span>
                  </div>
                  <div>
                    Bins Created:{" "}
                    <span className="font-mono">
                      {simulationResult.mockResult.binIds?.length || 0}
                    </span>
                  </div>
                  <div>
                    Bin IDs:{" "}
                    <span className="font-mono">
                      {simulationResult.mockResult.binIds?.join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Input Echo */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Input Echo
                </h5>
                <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                  <div>
                    Amount X:{" "}
                    <span className="font-mono">
                      {simulationResult.inputAmounts.amountX}
                    </span>
                  </div>
                  <div>
                    Amount Y:{" "}
                    <span className="font-mono">
                      {simulationResult.inputAmounts.amountY}
                    </span>
                  </div>
                  <div>
                    Shape:{" "}
                    <span className="font-mono">
                      {simulationResult.inputConfig.liquidityShape}
                    </span>
                  </div>
                  <div>
                    Bins:{" "}
                    <span className="font-mono">
                      {simulationResult.inputConfig.numBins}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {simulationResult?.error && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <h5 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Simulation Error
              </h5>
              <p className="text-xs text-red-700 dark:text-red-300">
                {simulationResult.error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

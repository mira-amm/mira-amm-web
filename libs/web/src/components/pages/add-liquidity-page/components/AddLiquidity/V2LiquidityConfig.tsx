import {useState, useEffect, useCallback} from "react";
import {RotateCw} from "lucide-react";
import {TradeUtils} from "@/src/components/pages/bin-liquidity/trade-utils";
import DoubleSlider from "@/src/components/pages/bin-liquidity/components/double-slider";
import LiquidityShapeSelector from "@/src/components/pages/bin-liquidity/components/liquidity-shape";
import SimulatedDistribution from "@/src/components/pages/bin-liquidity/components/simulated-distribution";
import {
  generateLiquidityDistribution,
  distributionToVisualizationData,
  LiquidityDistributionResult,
} from "./liquidityDistributionGenerator";
import {
  priceToSliderPosition,
  sliderPositionToPrice,
  createSliderBounds,
  alignPriceToBin,
  formatPriceForDisplay,
  calculateBinsBetweenPrices,
  getCurrentPriceSliderPosition,
} from "./priceSliderUtils";

export type LiquidityShape = "spot" | "curve" | "bidask";

type AssetMetadata = {
  name?: string;
  symbol?: string;
  decimals?: number;
} & {isLoading: boolean};

interface V2LiquidityConfigProps {
  asset0Metadata: AssetMetadata;
  asset1Metadata: AssetMetadata;
  onConfigChange?: (config: {
    liquidityShape: LiquidityShape;
    priceRange: [number, number];
    numBins: number;
    binResults?: any;
    liquidityDistribution?: LiquidityDistributionResult;
  }) => void;
}

const DEFAULT_BIN_STEP = 25;
const DEFAULT_BIN_NUMBER = 2000;

export default function V2LiquidityConfig({
  asset0Metadata,
  asset1Metadata,
  onConfigChange,
}: V2LiquidityConfigProps) {
  const [liquidityShape, setLiquidityShape] = useState<LiquidityShape>("curve");
  const [priceRange, setPriceRange] = useState<[number, number]>([0.8, 1.2]);
  const [numBins, setNumBins] = useState<number>(3);

  const currentPrice = 1.0; // Current market price

  const [minPrice, maxPrice] = priceRange;

  // Create exponential slider bounds based on bin steps
  const sliderBounds = createSliderBounds(
    currentPrice,
    DEFAULT_BIN_STEP,
    DEFAULT_BIN_NUMBER
  );

  // Convert current price range to slider positions
  const minSliderPosition = priceToSliderPosition(
    minPrice,
    currentPrice,
    DEFAULT_BIN_STEP,
    DEFAULT_BIN_NUMBER
  );
  const maxSliderPosition = priceToSliderPosition(
    maxPrice,
    currentPrice,
    DEFAULT_BIN_STEP,
    DEFAULT_BIN_NUMBER
  );

  // Get current price position (should always be 0.5)
  const currentPricePosition = getCurrentPriceSliderPosition(
    currentPrice,
    DEFAULT_BIN_STEP,
    DEFAULT_BIN_NUMBER
  );

  const [binResults, setBinResults] = useState<any>(null);
  const [liquidityDistribution, setLiquidityDistribution] = useState<
    LiquidityDistributionResult | undefined
  >(undefined);
  const [visualizationData, setVisualizationData] = useState<any>(null);

  const calculateResults = useCallback(
    (
      minPriceVal: number,
      maxPriceVal: number,
      binStepVal: number,
      currentPriceVal: number
    ) => {
      const result = TradeUtils.calculateLiquidityBook({
        minPrice: minPriceVal,
        maxPrice: maxPriceVal,
        binStep: binStepVal,
        currentPrice: currentPriceVal,
      });

      if (result) {
        setBinResults(result);
      }

      // Generate liquidity distribution
      const distribution = generateLiquidityDistribution({
        numBins,
        binStep: binStepVal,
        currentPrice: currentPriceVal,
        priceRange: [minPriceVal, maxPriceVal],
        liquidityShape,
        totalLiquidityAmount: 10000,
      });

      setLiquidityDistribution(distribution);

      // Convert to visualization data
      const vizData = distributionToVisualizationData(distribution);
      setVisualizationData(vizData);
    },
    [numBins, liquidityShape]
  );

  const handleMinPriceChange = (value: number) => {
    // Align price to nearest bin boundary
    const alignedPrice = alignPriceToBin(value, currentPrice, DEFAULT_BIN_STEP);
    setPriceRange([alignedPrice, maxPrice]);
    const calculatedBins = calculateBinsBetweenPrices(
      alignedPrice,
      maxPrice,
      DEFAULT_BIN_STEP
    );
    setNumBins(calculatedBins);
    calculateResults(alignedPrice, maxPrice, DEFAULT_BIN_STEP, currentPrice);
  };

  const handleMaxPriceChange = (value: number) => {
    // Align price to nearest bin boundary
    const alignedPrice = alignPriceToBin(value, currentPrice, DEFAULT_BIN_STEP);
    setPriceRange([minPrice, alignedPrice]);
    const calculatedBins = calculateBinsBetweenPrices(
      minPrice,
      alignedPrice,
      DEFAULT_BIN_STEP
    );
    setNumBins(calculatedBins);
    calculateResults(minPrice, alignedPrice, DEFAULT_BIN_STEP, currentPrice);
  };

  const handleSliderChange = (newSliderRange: [number, number]) => {
    // Convert slider positions to exponential prices
    const newMinPrice = sliderPositionToPrice(
      newSliderRange[0],
      currentPrice,
      DEFAULT_BIN_STEP,
      DEFAULT_BIN_NUMBER
    );
    const newMaxPrice = sliderPositionToPrice(
      newSliderRange[1],
      currentPrice,
      DEFAULT_BIN_STEP,
      DEFAULT_BIN_NUMBER
    );

    // Align prices to bin boundaries
    const alignedMinPrice = alignPriceToBin(
      newMinPrice,
      currentPrice,
      DEFAULT_BIN_STEP
    );
    const alignedMaxPrice = alignPriceToBin(
      newMaxPrice,
      currentPrice,
      DEFAULT_BIN_STEP
    );

    setPriceRange([alignedMinPrice, alignedMaxPrice]);
    const calculatedBins = calculateBinsBetweenPrices(
      alignedMinPrice,
      alignedMaxPrice,
      DEFAULT_BIN_STEP
    );
    setNumBins(calculatedBins);
    calculateResults(
      alignedMinPrice,
      alignedMaxPrice,
      DEFAULT_BIN_STEP,
      currentPrice
    );
  };

  const handleNumBinsChange = (newNumBins: number) => {
    setNumBins(newNumBins);
    const newMaxPrice = TradeUtils.calculateMaxPriceFromBins(
      minPrice,
      DEFAULT_BIN_STEP,
      newNumBins
    );
    setPriceRange([minPrice, newMaxPrice]);
    calculateResults(minPrice, newMaxPrice, DEFAULT_BIN_STEP, currentPrice);
  };

  const resetPrice = () => {
    setPriceRange([0.8, 1.2]);
  };

  // Notify parent component of config changes
  useEffect(() => {
    onConfigChange?.({
      liquidityShape,
      priceRange,
      numBins,
      binResults,
      liquidityDistribution,
    });
  }, [
    liquidityShape,
    priceRange,
    numBins,
    binResults,
    liquidityDistribution,
    onConfigChange,
  ]);

  // Initialize calculations
  useEffect(() => {
    calculateResults(minPrice, maxPrice, DEFAULT_BIN_STEP, currentPrice);
  }, [minPrice, maxPrice, calculateResults]);

  return (
    <div className="space-y-4">
      {/* Liquidity Shape Selection */}
      <div>
        <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
          Liquidity Distribution Strategy
        </div>
        <LiquidityShapeSelector
          liquidityShape={liquidityShape}
          setLiquidityShape={setLiquidityShape}
        />
      </div>

      {/* Price Range Configuration */}
      <div>
        <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
          Price Range
        </div>

        {/* Active Bin Display */}
        <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mx-auto px-3 py-2 rounded-lg text-sm mb-3 text-center border">
          <div>
            Active Bin: {formatPriceForDisplay(currentPrice, DEFAULT_BIN_STEP)}{" "}
            {asset0Metadata.symbol} per {asset1Metadata.symbol}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Bin Step: {DEFAULT_BIN_STEP} basis points (
            {(DEFAULT_BIN_STEP / 100).toFixed(2)}% per bin)
          </div>
        </div>

        {/* Price Range Slider - Exponential Movement */}
        <div className="mb-4">
          <div className="relative">
            <DoubleSlider
              min={sliderBounds.sliderMin}
              max={sliderBounds.sliderMax}
              step={sliderBounds.sliderStep}
              value={[minSliderPosition, maxSliderPosition]}
              onValueChange={handleSliderChange}
              className="mb-4"
            />
            {/* Current Price Indicator */}
            <div
              className="absolute top-0 w-0.5 h-6 bg-green-500 dark:bg-green-400 pointer-events-none"
              style={{
                left: `${currentPricePosition * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>
              {formatPriceForDisplay(
                sliderPositionToPrice(0, currentPrice, DEFAULT_BIN_STEP, 100),
                DEFAULT_BIN_STEP
              )}
            </span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              Current: {formatPriceForDisplay(currentPrice, DEFAULT_BIN_STEP)}{" "}
              (Center: {(currentPricePosition * 100).toFixed(1)}%)
            </span>
            <span>
              {formatPriceForDisplay(
                sliderPositionToPrice(1, currentPrice, DEFAULT_BIN_STEP, 100),
                DEFAULT_BIN_STEP
              )}
            </span>
          </div>
        </div>

        {/* Price Input Fields */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs mb-1 text-blue-800 dark:text-blue-200">
              Min price
            </label>
            <input
              type="number"
              value={formatPriceForDisplay(minPrice, DEFAULT_BIN_STEP)}
              onChange={(e) => handleMinPriceChange(Number(e.target.value))}
              step={DEFAULT_BIN_STEP < 10 ? "0.000001" : "0.0001"}
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-blue-800 dark:text-blue-200">
              Max price
            </label>
            <input
              type="number"
              value={formatPriceForDisplay(maxPrice, DEFAULT_BIN_STEP)}
              onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
              step={DEFAULT_BIN_STEP < 10 ? "0.000001" : "0.0001"}
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            />
          </div>
        </div>

        {/* Number of Bins */}
        <div className="mb-3">
          <label className="block text-xs mb-1 text-blue-800 dark:text-blue-200">
            Number of Bins
          </label>
          <input
            type="number"
            value={numBins}
            onChange={(e) => handleNumBinsChange(Number(e.target.value))}
            min="1"
            max="50"
            step="1"
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          />
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Price range spans {numBins} bins • Each bin ={" "}
            {(DEFAULT_BIN_STEP / 100).toFixed(2)}% price change
          </div>
        </div>

        <button
          onClick={resetPrice}
          className="text-blue-600 dark:text-blue-400 text-xs flex items-center hover:text-blue-800 dark:hover:text-blue-200"
        >
          <RotateCw className="size-3 mr-1" /> Reset to default range
        </button>
      </div>

      {/* Simulated Distribution Preview */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Liquidity Distribution Preview
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-[#F95465] rounded-full mr-1"></div>
              <span className="text-xs text-blue-800 dark:text-blue-200">
                {asset0Metadata.symbol}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-[#72A2FF] rounded-full mr-1"></div>
              <span className="text-xs text-blue-800 dark:text-blue-200">
                {asset1Metadata.symbol}
              </span>
            </div>
          </div>
        </div>

        <div className="h-32">
          <SimulatedDistribution
            liquidityShape={liquidityShape}
            data={visualizationData}
          />
        </div>
      </div>
    </div>
  );
}

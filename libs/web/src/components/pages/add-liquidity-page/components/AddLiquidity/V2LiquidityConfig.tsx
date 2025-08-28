import {useState, useEffect, useCallback} from "react";
import {RotateCw} from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import {TradeUtils} from "@/src/components/pages/bin-liquidity/trade-utils";
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

// Reusable heading component with consistent styling
const SectionHeading = ({children}: {children: React.ReactNode}) => (
  <h3
    className="text-base font-medium text-content-primary"
    style={{fontSize: "16px"}}
  >
    {children}
  </h3>
);

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
const SLIDER_BIN_RANGE = 150; // Fixed range for slider (75 bins on each side of current price)

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

  // Create simple slider bounds from 0 to 1 for the fixed 150-bin range
  const sliderBounds = {
    sliderMin: 0,
    sliderMax: 1,
    sliderStep: 0.001,
  };

  // Convert current price range to slider positions
  const minSliderPosition = priceToSliderPosition(
    minPrice,
    currentPrice,
    DEFAULT_BIN_STEP,
    SLIDER_BIN_RANGE
  );
  const maxSliderPosition = priceToSliderPosition(
    maxPrice,
    currentPrice,
    DEFAULT_BIN_STEP,
    SLIDER_BIN_RANGE
  );

  // Get current price position (should always be 0.5)
  const currentPricePosition = getCurrentPriceSliderPosition(
    currentPrice,
    DEFAULT_BIN_STEP,
    SLIDER_BIN_RANGE
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
    // Convert slider positions to exponential prices using slider range
    const newMinPrice = sliderPositionToPrice(
      newSliderRange[0],
      currentPrice,
      DEFAULT_BIN_STEP,
      SLIDER_BIN_RANGE
    );
    const newMaxPrice = sliderPositionToPrice(
      newSliderRange[1],
      currentPrice,
      DEFAULT_BIN_STEP,
      SLIDER_BIN_RANGE
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

    // Always update the price range when slider moves
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
    <div className="space-y-6">
      {/* Liquidity Shape Selection */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <SectionHeading>Liquidity shape</SectionHeading>
          <button className="text-accent-primary-2 text-sm flex items-center hover:opacity-80 gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Learn more
          </button>
        </div>
        <LiquidityShapeSelector
          liquidityShape={liquidityShape}
          setLiquidityShape={setLiquidityShape}
        />
      </div>

      {/* Price Range Configuration */}
      <div className="space-y-4">
        <SectionHeading>Price range</SectionHeading>

        {/* Active Bin Display */}
        <div
          className="bg-black text-white text-sm text-center mx-auto flex items-center justify-center gap-2.5 w-fit"
          style={{
            height: "29px",
            borderRadius: "10px",
            padding: "8px",
            opacity: 1,
          }}
        >
          Active Bin: {formatPriceForDisplay(currentPrice, DEFAULT_BIN_STEP)}{" "}
          {asset0Metadata.symbol} per {asset1Metadata.symbol}
        </div>

        {/* Price Range Slider */}
        <div className="mb-4">
          <div className="relative py-4">
            <div className="relative">
              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={[minSliderPosition, maxSliderPosition]}
                onValueChange={handleSliderChange}
                max={sliderBounds.sliderMax}
                min={sliderBounds.sliderMin}
                step={sliderBounds.sliderStep}
              >
                <Slider.Track className="bg-gray-300 relative grow rounded-full h-1">
                  <Slider.Range className="absolute bg-accent-primary rounded-full h-full" />
                </Slider.Track>

                <Slider.Thumb className="block w-5 h-5 bg-gray-600 border-2 border-white shadow-lg rounded-full hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 transition-transform" />
                <Slider.Thumb className="block w-5 h-5 bg-gray-600 border-2 border-white shadow-lg rounded-full hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 transition-transform" />
              </Slider.Root>

              <div className="absolute w-0.5 h-6 bg-gray-700 transform top-1/2 -translate-y-1/2 pointer-events-none left-1/2 -translate-x-1/2"></div>
            </div>
          </div>
        </div>

        {/* Price Input Fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2 text-content-primary">
              Min price
            </label>
            <div className="relative">
              <input
                type="number"
                value={formatPriceForDisplay(minPrice, DEFAULT_BIN_STEP)}
                onChange={(e) => handleMinPriceChange(Number(e.target.value))}
                step={DEFAULT_BIN_STEP < 10 ? "0.000001" : "0.0001"}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-400"
                placeholder="1200"
              />
              <span className="absolute right-3 top-3 text-gray-500 text-sm">
                {asset0Metadata.symbol} per {asset1Metadata.symbol}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2 text-content-primary">
              Max price
            </label>
            <div className="relative">
              <input
                type="number"
                value={formatPriceForDisplay(maxPrice, DEFAULT_BIN_STEP)}
                onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
                step={DEFAULT_BIN_STEP < 10 ? "0.000001" : "0.0001"}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-400"
                placeholder="1200"
              />
              <span className="absolute right-3 top-3 text-gray-500 text-sm">
                {asset0Metadata.symbol} per {asset1Metadata.symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Number of Bins */}
        <div className="mb-4">
          <label className="block text-sm mb-2 text-content-primary">
            Num Bins
          </label>
          <div className="relative">
            <input
              type="number"
              value={numBins}
              onChange={(e) => handleNumBinsChange(Number(e.target.value))}
              min="1"
              max="50"
              step="1"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-400 font-alt"
            />
            <div className="absolute right-3 top-3">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <button
          onClick={resetPrice}
          className="text-accent-primary-2 text-sm flex items-center hover:opacity-80 gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reset price
        </button>
      </div>

      {/* Simulated Distribution Preview */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <SectionHeading>Simulated distribution</SectionHeading>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm text-content-primary">
                {asset0Metadata.symbol}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-content-primary">
                {asset1Metadata.symbol}
              </span>
            </div>
          </div>
        </div>
        <div className="h-40">
          <SimulatedDistribution
            liquidityShape={liquidityShape}
            data={visualizationData}
            minPrice={minPrice}
            maxPrice={maxPrice}
            numBins={numBins}
            currentPrice={currentPrice}
          />
        </div>
      </div>
    </div>
  );
}

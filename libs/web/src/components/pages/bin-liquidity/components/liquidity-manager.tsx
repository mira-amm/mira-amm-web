import {Link, RotateCw} from "lucide-react";
import React, {useEffect, useState} from "react";
import SimulatedDistribution from "./simulated-distribution";
import LiquidityShapeSelector from "./liquidity-shape";
import DoubleSlider from "./double-slider";
import {TradeUtils} from "../trade-utils";

export type LiquidityShape = "spot" | "curve" | "bidask";

type AssetMetadata = {
  name?: string;
  symbol?: string;
  decimals?: number;
} & {isLoading: boolean};

const DEFAULT_BIN_STEP = 10.04;

const LiquidityManager = ({
  asset0Metadata,
  asset1Metadata,
}: {
  asset0Metadata: AssetMetadata;
  asset1Metadata: AssetMetadata;
}) => {
  const [liquidityShape, setLiquidityShape] = useState<LiquidityShape>("curve");
  const [activeBin, setActiveBin] = useState<string>("1.05200458");

  const [priceRange, setPriceRange] = useState<[number, number]>([0.8, 1.2]);
  const [numBins, setNumBins] = useState<number>(3);
  const currentPrice = 1.0; // Current market price

  const [minPrice, maxPrice] = priceRange;
  const sliderMin = 0.1;
  const sliderMax = 2.0;

  const [results, setResults] = useState<{
    minPriceVal: any;
    maxPriceVal: any;
    binStepVal: any;
    currentPriceVal: any;
    logBase: number;
    exactMinBinId: number;
    exactMaxBinId: number;
    alignedMinBinId: number;
    alignedMaxBinId: number;
    numberOfBins: number;
    actualMinPrice: number;
    actualMaxPrice: number;
    exactCurrentBinId: number;
    currentBinId: number;
    currentBinPrice: number;
    isCurrentBinInRange: boolean;
  } | null>(null);
  const [showResults, setShowResults] = useState(false);

  const calculateResults = (
    minPriceVal: any,
    maxPriceVal: any,
    binStepVal: any,
    currentPriceVal: any
  ) => {
    const result = TradeUtils.calculateLiquidityBook({
      minPrice: minPriceVal,
      maxPrice: maxPriceVal,
      binStep: binStepVal,
      currentPrice: currentPriceVal,
    });

    if (!result) return;

    const res = {
      minPriceVal: result.inputMinPrice,
      maxPriceVal: result.inputMaxPrice,
      binStepVal: result.binStep,
      currentPriceVal: result.currentPrice,
      logBase: TradeUtils.getLogBase(result.binStep),
      exactMinBinId: result.exactMinBinId,
      exactMaxBinId: result.exactMaxBinId,
      alignedMinBinId: result.minBinId,
      alignedMaxBinId: result.maxBinId,
      numberOfBins: result.numberOfBins,
      actualMinPrice: result.actualMinPrice,
      actualMaxPrice: result.actualMaxPrice,
      exactCurrentBinId: result.exactCurrentBinId,
      currentBinId: result.activeBinId,
      currentBinPrice: result.activeBinPrice,
      isCurrentBinInRange: result.isCurrentPriceInRange,
    };
    setResults(res);
    setShowResults(true);
  };

  const handleMinPriceChange = (value: number) => {
    setPriceRange([value, maxPrice]);

    // Price changed → calculate bins
    const calculatedBins = TradeUtils.calculateBinsFromPrices(
      value,
      maxPrice,
      DEFAULT_BIN_STEP
    );
    setNumBins(calculatedBins);
    calculateResults(value, maxPrice, DEFAULT_BIN_STEP, currentPrice);
  };

  const handleMaxPriceChange = (value: number) => {
    setPriceRange([minPrice, value]);

    // Price changed → calculate bins
    const calculatedBins = TradeUtils.calculateBinsFromPrices(
      minPrice,
      value,
      DEFAULT_BIN_STEP
    );
    setNumBins(calculatedBins);
    calculateResults(minPrice, value, DEFAULT_BIN_STEP, currentPrice);
  };

  const handleSliderChange = (newRange: [number, number]) => {
    setPriceRange(newRange);
  };

  const handleNumBinsChange = (newNumBins: number) => {
    // const clampedBins = Math.max(1, Math.min(50, Math.round(newNumBins)));
    // setNumBins(clampedBins);

    setNumBins(newNumBins);
    // Bins changed → calculate max price
    const newMaxPrice = TradeUtils.calculateMaxPriceFromBins(
      minPrice,
      DEFAULT_BIN_STEP,
      newNumBins
    );
    setPriceRange([minPrice, newMaxPrice]);
    calculateResults(minPrice, newMaxPrice, DEFAULT_BIN_STEP, currentPrice);
  };

  useEffect(() => {
    try {
      const result = TradeUtils.calculateLiquidityBook({
        minPrice,
        maxPrice,
        binStep: DEFAULT_BIN_STEP,
        currentPrice,
      });
      if (result) {
        setNumBins(result.numberOfBins);
      }
    } catch (error) {
      // Handle invalid price range silently
    }
  }, [minPrice, maxPrice]);

  const resetPrice = (): void => {
    setPriceRange([0.8, 1.2]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-content-primary text-base">Liquidity shape</div>
        <button className="text-accent-primary-2 text-sm flex items-center">
          <Link className="mr-1 size-4" /> Learn more
        </button>
      </div>

      {/* Liquidity Shape Selection */}
      <LiquidityShapeSelector
        liquidityShape={liquidityShape}
        setLiquidityShape={setLiquidityShape}
      />

      {/* Price Range Section */}
      <div className="flex flex-col">
        <div className="text-content-primary text-base mb-4">Price range</div>

        {/* Active Bin Display */}
        <div className="bg-background-primary text-page-background mx-auto px-3 py-2 rounded-lg text-sm mb-4 inline-block">
          Active Bin: {currentPrice} {asset0Metadata.symbol} per{" "}
          {asset1Metadata.symbol}
        </div>

        {/* Price Range Slider */}
        <div className="mb-6">
          <DoubleSlider
            min={sliderMin}
            max={sliderMax}
            step={0.0001}
            value={priceRange}
            onValueChange={handleSliderChange}
            className="mb-6"
          />
        </div>

        {/* Price Input Fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2">Min price</label>
            <div className="relative">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => handleMinPriceChange(Number(e.target.value))}
                step="0.0001"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
              <span className="absolute right-3 top-3 text-gray-500 text-sm">
                UNI per ETH
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">Max price</label>
            <div className="relative">
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
                step="0.0001"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
              <span className="absolute right-3 top-3 text-gray-500 text-sm">
                {asset0Metadata.symbol} per {asset1Metadata.symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Num Bins */}
        <div className="mb-4">
          <label className="block text-sm mb-2">Num Bins</label>
          <input
            type="number"
            value={numBins}
            onChange={(e) => handleNumBinsChange(Number(e.target.value))}
            min="1"
            step="1"
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Enter number of bins"
          />
        </div>

        <button
          onClick={resetPrice}
          className="text-accent-primary-2 text-sm flex items-center self-end"
        >
          <RotateCw className="size-4 mr-1" /> Reset price
        </button>
      </div>

      {/* Simulated Distribution */}
      <div className="">
        <div className="flex justify-between items-center mb-4">
          <div className="text-content-primary text-base">
            Simulated distribution
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#F95465] rounded-full mr-2"></div>
              <span className="text-sm text-content-primary">
                {asset0Metadata.symbol}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#72A2FF] rounded-full mr-2"></div>
              <span className="text-sm text-content-primary">
                {asset1Metadata.symbol}
              </span>
            </div>
          </div>
        </div>

        <SimulatedDistribution liquidityShape={liquidityShape} />
      </div>
    </div>
  );
};

export default LiquidityManager;

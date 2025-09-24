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
import type {DeltaIdDistribution} from "./liquidityDistributionGenerator";
import {
  priceToSliderPosition,
  sliderPositionToPrice,
  createSliderBounds,
  alignPriceToBin,
  formatPriceForDisplay,
  calculateBinsBetweenPrices,
  getCurrentPriceSliderPosition,
} from "./priceSliderUtils";
import {cn} from "@/src/utils/cn";
import {DEFAULT_SLIPPAGE_BASIS_POINT} from "@/src/utils/constants";
import {Input} from "@/meshwave-ui/input";

export type LiquidityShape = "spot" | "curve" | "bidask";

type AssetMetadata = {
  name?: string;
  symbol?: string;
  decimals?: number;
} & {isLoading: boolean};

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Sanitize numeric input by removing special characters
 * and allowing only digits and a single decimal point.
 *
 * @param value - The raw input string from the user
 * @returns A sanitized string safe to set as input value
 */
function sanitizeNumericInput(value: string): string {
  return value
    .replace(/[^0-9.]/g, "") // remove anything that's not a digit or dot
    .replace(/(\..*?)\./g, "$1"); // keep only the first dot
}

// parser for text input ("1,234.56", "  1234  ")
function parsePriceString(input: string): number | null {
  if (typeof input !== "string") return null;
  const cleaned = input.replace(/[^\d.]/g, ""); // keep digits + dot
  if (!cleaned || cleaned === "." || cleaned === "..") return null;
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

// Reusable heading component with consistent styling
const SectionHeading = ({children}: {children: React.ReactNode}) => (
  <h3 className="text-base  text-content-primary" style={{fontSize: "16px"}}>
    {children}
  </h3>
);

interface V2LiquidityConfigProps {
  asset0Metadata: AssetMetadata;
  asset1Metadata: AssetMetadata;
  currentPrice: number;
  asset0Price?: number;
  asset1Price?: number;
  totalAsset0Amount?: number;
  totalAsset1Amount?: number;
  onConfigChange?: (config: {
    liquidityShape: LiquidityShape;
    priceRange: [number, number];
    numBins: number;
    binResults?: any;
    liquidityDistribution?: LiquidityDistributionResult;
    deltaDistribution?: DeltaIdDistribution;
  }) => void;
}

const DEFAULT_BIN_STEP = 25;
const DEFAULT_BIN_NUMBER = 2000;
const SLIDER_BIN_RANGE = 150; // Fixed range for slider (75 bins on each side of current price)
const DEFAULT_INPUT_DEBOUNCE = 400;

const INVALID_MSG =
  "Invalid range. The min price must be lower than the max price.";

export default function V2LiquidityConfig({
  asset0Metadata,
  asset1Metadata,
  currentPrice,
  asset0Price,
  asset1Price,
  totalAsset0Amount,
  totalAsset1Amount,
  onConfigChange,
}: V2LiquidityConfigProps) {
  // Calculate initial price range as 20% difference on either side of current price
  const priceRangePercent = 0.2; // 20%
  const initialMinPrice = currentPrice * (1 - priceRangePercent);
  const initialMaxPrice = currentPrice * (1 + priceRangePercent);

  const [liquidityShape, setLiquidityShape] = useState<LiquidityShape>("curve");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    initialMinPrice,
    initialMaxPrice,
  ]);

  // Calculate initial number of bins based on the price range and bin step
  const initialBins = calculateBinsBetweenPrices(
    initialMinPrice,
    initialMaxPrice,
    DEFAULT_BIN_STEP
  );
  const [numBins, setNumBins] = useState<number>(initialBins);

  // Track if user has manually entered custom prices
  const [hasCustomMinPrice, setHasCustomMinPrice] = useState(false);
  const [hasCustomMaxPrice, setHasCustomMaxPrice] = useState(false);

  const [minPrice, maxPrice] = priceRange;

  // local string states for text inputs + "typing" flags
  const [minPriceInput, setMinPriceInput] = useState(
    formatPriceForDisplay(initialMinPrice, DEFAULT_BIN_STEP)
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    formatPriceForDisplay(initialMaxPrice, DEFAULT_BIN_STEP)
  );
  const [isTypingMin, setIsTypingMin] = useState(false);
  const [isTypingMax, setIsTypingMax] = useState(false);
  const [activeThumb, setActiveThumb] = useState<"min" | "max" | null>(null);

  // debounced input values
  const debouncedMinInput = useDebounce(minPriceInput, DEFAULT_INPUT_DEBOUNCE);
  const debouncedMaxInput = useDebounce(maxPriceInput, DEFAULT_INPUT_DEBOUNCE);

  // Create simple slider bounds from 0 to 1 for the fixed 150-bin range
  const sliderBounds = {
    sliderMin: 0,
    sliderMax: 1,
    sliderStep: 0.001,
  };

  // Convert current price range to slider positions
  const isCurrentPriceValid = Number.isFinite(currentPrice) && currentPrice > 0;
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

  const defaultSliderValue: [number, number] = isCurrentPriceValid
    ? [
        priceToSliderPosition(
          currentPrice * (1 - priceRangePercent),
          currentPrice,
          DEFAULT_BIN_STEP,
          SLIDER_BIN_RANGE
        ),
        priceToSliderPosition(
          currentPrice * (1 + priceRangePercent),
          currentPrice,
          DEFAULT_BIN_STEP,
          SLIDER_BIN_RANGE
        ),
      ]
    : [0.4, 0.6];

  // Render the slider by clamping positions so it stays interactive
  const clampPosition = (v: number) =>
    Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : v;
  let clampedMinPos = clampPosition(minSliderPosition);
  let clampedMaxPos = clampPosition(maxSliderPosition);

  // If either is invalid (NaN/Infinity), fall back to extremes so the handle is reachable
  if (!Number.isFinite(clampedMinPos)) clampedMinPos = 0;
  if (!Number.isFinite(clampedMaxPos)) clampedMaxPos = 1;

  // Ensure ordering with a small epsilon spacing
  const EPS = 0.001;
  if (clampedMinPos >= clampedMaxPos) {
    if (activeThumb === "min") {
      clampedMinPos = Math.max(0, clampedMaxPos - EPS);
    } else {
      clampedMaxPos = Math.min(1, clampedMinPos + EPS);
    }
  }

  const sliderValue: [number, number] = isCurrentPriceValid
    ? [clampedMinPos, clampedMaxPos]
    : defaultSliderValue;

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
  const [deltaDistribution, setDeltaDistribution] = useState<
    DeltaIdDistribution | undefined
  >(undefined);
  // const [visualizationData, setVisualizationData] = useState<any>(null);

  const [rangeError, setRangeError] = useState<string | null>(null);
  const hasAsset0 = (totalAsset0Amount ?? 0) > 0;
  const hasAsset1 = (totalAsset1Amount ?? 0) > 0;
  // Only show simulation when at least one non-zero amount is provided
  const shouldShowSimulation = hasAsset0 || hasAsset1;

  const calculateResults = useCallback(
    (
      minPriceVal: number,
      maxPriceVal: number,
      binStepVal: number,
      currentPriceVal: number
    ) => {
      // If simulation isn't eligible, clear derived state and bail.
      if (!shouldShowSimulation) {
        setBinResults(null);
        setLiquidityDistribution(undefined);
        // setVisualizationData(null);
        return;
      }

      const result = TradeUtils.calculateLiquidityBook({
        minPrice: minPriceVal,
        maxPrice: maxPriceVal,
        binStep: binStepVal,
        currentPrice: currentPriceVal,
      });

      if (result) {
        setBinResults(result);
      }

      // Generate liquidity distribution + delta distribution
      const ret = generateLiquidityDistribution({
        numBins,
        binStep: binStepVal,
        currentPrice: currentPriceVal,
        priceRange: [minPriceVal, maxPriceVal],
        liquidityShape,
        totalLiquidityAmount: 10000,
        slippageBps: DEFAULT_SLIPPAGE_BASIS_POINT,
      });

      setLiquidityDistribution(ret.liquidityDistribution);
      setDeltaDistribution(ret.deltaDistribution);

      // Convert to visualization data
      // const vizData = distributionToVisualizationData(distribution);
      // setVisualizationData(vizData);
    },
    [numBins, liquidityShape, shouldShowSimulation]
  );

  const resetIfError = () => {
    if (rangeError) {
      resetPrice();
    }
  };

  const handleMinPriceChange = (value: number) => {
    // Align price to nearest bin boundary
    const alignedPrice = alignPriceToBin(value, currentPrice, DEFAULT_BIN_STEP);

    // Validate: min must be strictly lower than current max
    if (alignedPrice >= maxPrice) {
      setRangeError(INVALID_MSG);
      return; // disengage: do not update anything else
    }

    // Clear error if previously set
    if (rangeError) setRangeError(null);

    setPriceRange([alignedPrice, maxPrice]);
    setHasCustomMinPrice(true); // Mark as manually entered
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

    // Validate: max must be strictly greater than current min
    if (alignedPrice <= minPrice) {
      setRangeError(INVALID_MSG);
      return; // disengage
    }

    if (rangeError) setRangeError(null);

    setPriceRange([minPrice, alignedPrice]);
    setHasCustomMaxPrice(true); // Mark as manually entered
    const calculatedBins = calculateBinsBetweenPrices(
      minPrice,
      alignedPrice,
      DEFAULT_BIN_STEP
    );
    setNumBins(calculatedBins);
    calculateResults(minPrice, alignedPrice, DEFAULT_BIN_STEP, currentPrice);
  };

  const handleSliderChange = (newSliderRange: [number, number]) => {
    // Infer which thumb moved when clicking the track (no pointerDown on thumb)
    let effectiveActive: "min" | "max" | null = activeThumb;
    if (!effectiveActive) {
      const deltaMin = Math.abs(newSliderRange[0] - sliderValue[0]);
      const deltaMax = Math.abs(newSliderRange[1] - sliderValue[1]);
      effectiveActive = deltaMin > deltaMax ? "min" : "max";
    }
    // Convert slider positions to exponential prices using slider range
    const computedMin = sliderPositionToPrice(
      newSliderRange[0],
      currentPrice,
      DEFAULT_BIN_STEP,
      SLIDER_BIN_RANGE
    );
    const computedMax = sliderPositionToPrice(
      newSliderRange[1],
      currentPrice,
      DEFAULT_BIN_STEP,
      SLIDER_BIN_RANGE
    );

    // Align to bin boundaries
    const alignedMin = alignPriceToBin(
      computedMin,
      currentPrice,
      DEFAULT_BIN_STEP
    );
    const alignedMax = alignPriceToBin(
      computedMax,
      currentPrice,
      DEFAULT_BIN_STEP
    );

    let finalMinPrice = minPrice;
    let finalMaxPrice = maxPrice;

    if (effectiveActive === "min") {
      finalMinPrice = alignedMin;
      setHasCustomMinPrice(true);
    } else if (effectiveActive === "max") {
      finalMaxPrice = alignedMax;
      setHasCustomMaxPrice(true);
    } else {
      // No active thumb detected (e.g., keyboard). Update both.
      finalMinPrice = alignedMin;
      finalMaxPrice = alignedMax;
      setHasCustomMinPrice(true);
      setHasCustomMaxPrice(true);
    }

    // Validate range
    if (finalMinPrice >= finalMaxPrice) {
      setRangeError(INVALID_MSG);
      return;
    }
    if (rangeError) setRangeError(null);

    setPriceRange([finalMinPrice, finalMaxPrice]);

    // keep inputs in sync when not typing
    if (!isTypingMin && finalMinPrice !== minPrice) {
      setMinPriceInput(formatPriceForDisplay(finalMinPrice, DEFAULT_BIN_STEP));
    }
    if (!isTypingMax && finalMaxPrice !== maxPrice) {
      setMaxPriceInput(formatPriceForDisplay(finalMaxPrice, DEFAULT_BIN_STEP));
    }

    const calculatedBins = calculateBinsBetweenPrices(
      finalMinPrice,
      finalMaxPrice,
      DEFAULT_BIN_STEP
    );
    setNumBins(calculatedBins);
    calculateResults(
      finalMinPrice,
      finalMaxPrice,
      DEFAULT_BIN_STEP,
      currentPrice
    );
  };

  const handleNumBinsChange = (newNumBins: number) => {
    // Disengage while in error; clicking into the field will reset via onFocus
    if (rangeError) return;

    setNumBins(newNumBins);
    const newMaxPrice = TradeUtils.calculateMaxPriceFromBins(
      minPrice,
      DEFAULT_BIN_STEP,
      newNumBins
    );

    if (newMaxPrice <= minPrice) {
      setRangeError(INVALID_MSG);
      return;
    } else if (rangeError) {
      setRangeError(null);
    }

    setPriceRange([minPrice, newMaxPrice]);
    // sync text inputs
    if (!isTypingMax) {
      setMaxPriceInput(formatPriceForDisplay(newMaxPrice, DEFAULT_BIN_STEP));
    }
    calculateResults(minPrice, newMaxPrice, DEFAULT_BIN_STEP, currentPrice);
  };

  const resetPrice = () => {
    setPriceRange([initialMinPrice, initialMaxPrice]);
    setHasCustomMinPrice(false);
    setHasCustomMaxPrice(false);

    setMinPriceInput(formatPriceForDisplay(initialMinPrice, DEFAULT_BIN_STEP));
    setMaxPriceInput(formatPriceForDisplay(initialMaxPrice, DEFAULT_BIN_STEP));
    setIsTypingMin(false);
    setIsTypingMax(false);

    const calculatedBins = calculateBinsBetweenPrices(
      initialMinPrice,
      initialMaxPrice,
      DEFAULT_BIN_STEP
    );
    setNumBins(calculatedBins);
    setRangeError(null);
  };

  // Notify parent component of config changes
  useEffect(() => {
    onConfigChange?.({
      liquidityShape,
      priceRange,
      numBins,
      binResults,
      liquidityDistribution,
      deltaDistribution,
    });
  }, [
    liquidityShape,
    priceRange,
    numBins,
    binResults,
    liquidityDistribution,
    deltaDistribution,
    onConfigChange,
  ]);

  // Initialize calculations
  useEffect(() => {
    if (!isCurrentPriceValid) return;
    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) return;
    if (minPrice <= 0 || maxPrice <= 0) return;
    calculateResults(minPrice, maxPrice, DEFAULT_BIN_STEP, currentPrice);
  }, [minPrice, maxPrice, calculateResults, currentPrice, isCurrentPriceValid]);

  // When currentPrice becomes valid for the first time (or changes),
  // initialize the default 20% price range if user hasn't set custom values
  useEffect(() => {
    if (!isCurrentPriceValid) return;
    if (hasCustomMinPrice || hasCustomMaxPrice) return;

    const newMin = currentPrice * (1 - priceRangePercent);
    const newMax = currentPrice * (1 + priceRangePercent);

    setPriceRange([newMin, newMax]);
    setMinPriceInput(formatPriceForDisplay(newMin, DEFAULT_BIN_STEP));
    setMaxPriceInput(formatPriceForDisplay(newMax, DEFAULT_BIN_STEP));
    const calculatedBins = calculateBinsBetweenPrices(
      newMin,
      newMax,
      DEFAULT_BIN_STEP
    );
    setNumBins(calculatedBins);
    setRangeError(null);
  }, [isCurrentPriceValid, currentPrice, hasCustomMinPrice, hasCustomMaxPrice]);

  // when priceRange changes externally (slider/reset), update text inputs if not typing
  useEffect(() => {
    if (!isTypingMin) {
      setMinPriceInput(formatPriceForDisplay(minPrice, DEFAULT_BIN_STEP));
    }
  }, [minPrice, isTypingMin]);
  useEffect(() => {
    if (!isTypingMax) {
      setMaxPriceInput(formatPriceForDisplay(maxPrice, DEFAULT_BIN_STEP));
    }
  }, [maxPrice, isTypingMax]);

  // commit debounced text edits
  useEffect(() => {
    if (!isTypingMin) return;
    const parsed = parsePriceString(debouncedMinInput);
    if (parsed !== null) handleMinPriceChange(parsed);
  }, [debouncedMinInput]);

  useEffect(() => {
    if (!isTypingMax) return;
    const parsed = parsePriceString(debouncedMaxInput);
    if (parsed !== null) handleMaxPriceChange(parsed);
  }, [debouncedMaxInput]);

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
          className="bg-black text-white text-center mx-auto flex items-center justify-center gap-1 w-fit"
          style={{
            height: "29px",
            borderRadius: "10px",
            padding: "8px",
            opacity: 1,
          }}
        >
          <span className="text-sm">Active Bin:</span>
          <span className="text-sm font-alt">
            {formatPriceForDisplay(currentPrice, DEFAULT_BIN_STEP)}
          </span>
          <span className="text-sm">
            {asset0Metadata.symbol} per {asset1Metadata.symbol}
          </span>
        </div>

        {/* Price Range Slider */}
        <div className="mb-4">
          <div className="relative py-4">
            <div className="relative">
              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={sliderValue}
                onValueChange={handleSliderChange}
                max={sliderBounds.sliderMax}
                min={sliderBounds.sliderMin}
                step={sliderBounds.sliderStep}
              >
                <Slider.Track className="bg-gray-300 relative grow rounded-full h-1">
                  <Slider.Range className="absolute bg-accent-primary rounded-full h-full" />
                </Slider.Track>

                <Slider.Thumb
                  className="block w-5 h-5 bg-gray-600 border-2 border-white shadow-lg rounded-full hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 transition-transform"
                  aria-label="Minimum price"
                  onPointerDown={() => setActiveThumb("min")}
                  onPointerUp={() => setActiveThumb(null)}
                  onBlur={() => setActiveThumb(null)}
                />
                <Slider.Thumb
                  className="block w-5 h-5 bg-gray-600 border-2 border-white shadow-lg rounded-full hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 transition-transform"
                  aria-label="Maximum price"
                  onPointerDown={() => setActiveThumb("max")}
                  onPointerUp={() => setActiveThumb(null)}
                  onBlur={() => setActiveThumb(null)}
                />
              </Slider.Root>

              <div className="absolute w-0.5 h-6 bg-gray-700 transform top-1/2 -translate-y-1/2 pointer-events-none left-1/2 -translate-x-1/2"></div>
            </div>
          </div>
        </div>

        {/* Price Input Fields */}
        <div
          className={cn(
            "grid grid-cols-1 md:grid-cols-2 gap-4",
            rangeError ? "mb-2" : "mb-4"
          )}
        >
          <div>
            <label className="block text-sm mb-2 text-content-primary">
              Min price
            </label>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.]?[0-9]*"
                value={
                  isTypingMin
                    ? minPriceInput
                    : formatPriceForDisplay(minPrice, DEFAULT_BIN_STEP)
                }
                onChange={(e) => {
                  setIsTypingMin(true);
                  setMinPriceInput(sanitizeNumericInput(e.target.value));
                }}
                onBlur={() => {
                  const parsed = parsePriceString(minPriceInput);
                  if (parsed !== null) handleMinPriceChange(parsed);
                  setIsTypingMin(false);
                  setMinPriceInput(
                    formatPriceForDisplay(minPrice, DEFAULT_BIN_STEP)
                  );
                  setRangeError(null);
                }}
                className="font-alt"
                placeholder="1200"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {asset0Metadata.symbol} per {asset1Metadata.symbol}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2 text-content-primary">
              Max price
            </label>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.]?[0-9]*"
                value={
                  isTypingMax
                    ? maxPriceInput
                    : formatPriceForDisplay(maxPrice, DEFAULT_BIN_STEP)
                }
                onChange={(e) => {
                  setIsTypingMax(true);
                  setMaxPriceInput(sanitizeNumericInput(e.target.value));
                }}
                onBlur={() => {
                  const parsed = parsePriceString(maxPriceInput);
                  if (parsed !== null) handleMaxPriceChange(parsed);
                  setIsTypingMax(false);
                  setMaxPriceInput(
                    formatPriceForDisplay(maxPrice, DEFAULT_BIN_STEP)
                  );
                  setRangeError(null);
                }}
                className="font-alt"
                placeholder="1200"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {asset0Metadata.symbol} per {asset1Metadata.symbol}
              </span>
            </div>
          </div>
        </div>

        {rangeError && (
          <div className="text-sm text-red-600 dark:text-red-400">
            {rangeError}
          </div>
        )}

        {/* Number of Bins */}
        <div className="mb-4">
          <label className="block text-sm mb-2 text-content-primary">
            Num Bins
          </label>
          <div className="relative">
            <Input
              type="number"
              value={numBins}
              onChange={(e) => handleNumBinsChange(Number(e.target.value))}
              onFocus={resetIfError} // reset if user clicks here while invalid
              min="1"
              max="50"
              step="1"
              className="font-alt"
            />
          </div>
        </div>

        <button
          onClick={resetPrice}
          className="text-accent-primary-2 text-sm flex items-center hover:opacity-80 gap-1 align-end ml-auto"
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
      {shouldShowSimulation && (
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
              minPrice={minPrice}
              maxPrice={maxPrice}
              currentPrice={currentPrice}
              binStepBasisPoints={DEFAULT_BIN_STEP}
              asset0Symbol={asset0Metadata.symbol}
              asset1Symbol={asset1Metadata.symbol}
              asset0Price={asset0Price}
              asset1Price={asset1Price}
              totalAsset0Amount={totalAsset0Amount}
              totalAsset1Amount={totalAsset1Amount}
            />
          </div>
        </div>
      )}
    </div>
  );
}

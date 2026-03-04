/**
 * Utility functions for converting between linear slider positions and exponential price values
 * based on bin steps in concentrated liquidity pools.
 */

/**
 * Convert a price to a linear slider position based on bin steps
 * @param price - The actual price value
 * @param currentPrice - The current market price (center point)
 * @param binStep - The bin step in basis points (e.g., 25 for 0.25%)
 * @param maxBinsFromCenter - Maximum number of bins from center in either direction
 * @returns Linear slider position (0 to 1)
 */
export function priceToSliderPosition(
  price: number,
  currentPrice: number,
  binStep: number,
  maxBinsFromCenter: number = 100
): number {
  // Calculate the bin step multiplier
  const stepMultiplier = 1 + binStep / 10000;

  // Calculate how many bins this price is from the current price
  const binsFromCenter =
    Math.log(price / currentPrice) / Math.log(stepMultiplier);

  // Convert to slider position (0 to 1)
  // Center is at 0.5, and we scale based on maxBinsFromCenter
  const sliderPosition = 0.5 + binsFromCenter / (maxBinsFromCenter * 2);

  // Clamp to valid range
  return Math.max(0, Math.min(1, sliderPosition));
}

/**
 * Convert a linear slider position to an exponential price based on bin steps
 * @param sliderPosition - Linear slider position (0 to 1)
 * @param currentPrice - The current market price (center point)
 * @param binStep - The bin step in basis points (e.g., 10.04 for 0.1004%)
 * @param maxBinsFromCenter - Maximum number of bins from center in either direction
 * @returns Actual price value
 */
export function sliderPositionToPrice(
  sliderPosition: number,
  currentPrice: number,
  binStep: number,
  maxBinsFromCenter: number = 100
): number {
  // Calculate the bin step multiplier
  const stepMultiplier = 1 + binStep / 10000;

  // Convert slider position to bins from center
  // Center is at 0.5, and we scale based on maxBinsFromCenter
  const binsFromCenter = (sliderPosition - 0.5) * (maxBinsFromCenter * 2);

  // Calculate the actual price
  const price = currentPrice * Math.pow(stepMultiplier, binsFromCenter);

  return price;
}

/**
 * Calculate the price range that encompasses a specific number of bins
 * @param currentPrice - The current market price (center point)
 * @param binStep - The bin step in basis points
 * @param numBins - Total number of bins desired
 * @returns [minPrice, maxPrice] tuple
 */
export function calculatePriceRangeForBins(
  currentPrice: number,
  binStep: number,
  numBins: number
): [number, number] {
  const stepMultiplier = 1 + binStep / 10000;
  const halfBins = Math.floor(numBins / 2);

  const minPrice = currentPrice / Math.pow(stepMultiplier, halfBins);
  const maxPrice = currentPrice * Math.pow(stepMultiplier, numBins - halfBins);

  return [minPrice, maxPrice];
}

/**
 * Calculate how many bins fit between two prices
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @param binStep - The bin step in basis points
 * @returns Number of bins
 */
export function calculateBinsBetweenPrices(
  minPrice: number,
  maxPrice: number,
  binStep: number
): number {
  const stepMultiplier = 1 + binStep / 10000;
  return (
    Math.floor(Math.log(maxPrice / minPrice) / Math.log(stepMultiplier)) + 1
  );
}

/**
 * Get the nearest valid price that aligns with bin boundaries
 * @param price - Input price
 * @param currentPrice - Current market price
 * @param binStep - The bin step in basis points
 * @returns Price aligned to nearest bin
 */
export function alignPriceToBin(
  price: number,
  currentPrice: number,
  binStep: number
): number {
  const stepMultiplier = 1 + binStep / 10000;

  // Calculate how many bins this price is from current price
  const binsFromCenter =
    Math.log(price / currentPrice) / Math.log(stepMultiplier);

  // Round to nearest integer bin
  const roundedBins = Math.round(binsFromCenter);

  // Calculate the aligned price
  return currentPrice * Math.pow(stepMultiplier, roundedBins);
}

/**
 * Create slider bounds that provide good UX for price selection
 * @param currentPrice - Current market price
 * @param binStep - The bin step in basis points
 * @param maxBinsFromCenter - Maximum bins to show in either direction
 * @returns Object with slider configuration
 */
export function createSliderBounds(
  currentPrice: number,
  binStep: number,
  maxBinsFromCenter: number = 100
) {
  const stepMultiplier = 1 + binStep / 10000;

  const minPrice = currentPrice / Math.pow(stepMultiplier, maxBinsFromCenter);
  const maxPrice = currentPrice * Math.pow(stepMultiplier, maxBinsFromCenter);

  return {
    minPrice,
    maxPrice,
    centerPrice: currentPrice,
    stepMultiplier,
    maxBinsFromCenter,
    // Slider always goes from 0 to 1 (linear)
    sliderMin: 0,
    sliderMax: 1,
    // Step size for smooth movement (1/1000th of range)
    sliderStep: 100,
  };
}

/**
 * Format price for display with appropriate precision
 * @param price - Price value
 * @param binStep - Bin step for determining precision
 * @returns Formatted price string
 */
export function formatPriceForDisplay(price: number, binStep: number): string {
  // Determine precision based on bin step
  // Smaller bin steps need more precision
  let decimals = 4;
  if (binStep < 1) decimals = 6;
  else if (binStep < 10) decimals = 5;
  else if (binStep > 100) decimals = 3;

  return price.toFixed(decimals);
}

/**
 * Get the slider position for the current price (should always be 0.5)
 * @param currentPrice - Current market price
 * @param binStep - Bin step in basis points
 * @param maxBinsFromCenter - Maximum bins from center
 * @returns Slider position (should be 0.5)
 */
export function getCurrentPriceSliderPosition(
  currentPrice: number,
  binStep: number,
  maxBinsFromCenter: number = 100
): number {
  return priceToSliderPosition(
    currentPrice,
    currentPrice,
    binStep,
    maxBinsFromCenter
  );
}

/**
 * Validate that a price range is reasonable for the given bin step
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @param binStep - Bin step in basis points
 * @returns Validation result with any issues
 */
export function validatePriceRange(
  minPrice: number,
  maxPrice: number,
  binStep: number
): {isValid: boolean; issues: string[]} {
  const issues: string[] = [];

  if (minPrice >= maxPrice) {
    issues.push("Minimum price must be less than maximum price");
  }

  if (minPrice <= 0 || maxPrice <= 0) {
    issues.push("Prices must be positive");
  }

  const numBins = calculateBinsBetweenPrices(minPrice, maxPrice, binStep);
  if (numBins > 200) {
    issues.push("Price range is too wide - would create too many bins");
  }

  if (numBins < 1) {
    issues.push("Price range is too narrow - would create no bins");
  }

  const priceRatio = maxPrice / minPrice;
  if (priceRatio > 1000) {
    issues.push("Price range is extremely wide - consider narrowing the range");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

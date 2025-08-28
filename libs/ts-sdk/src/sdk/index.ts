// Mira v1 SDK - Traditional constant product AMM
export * from "./mira_amm";
export * from "./readonly_mira_amm";

// Mira v2 SDK - Binned liquidity AMM with concentrated liquidity
export * from "./mira_amm_v2";
export * from "./readonly_mira_amm_v2";

// Shared types and models for both v1 and v2
export * from "./model";

// Error handling for both versions
export * from "./errors";

// Input validation utilities
export * from "./validation";

// Caching system for improved performance
export * from "./cache";

// Constants and configuration values
export * from "./constants";
// Utility functions for pool and asset management
export {
  // v1 utilities
  buildPoolId, // Build v1 pool ID from assets
  getAssetId, // Generate asset ID from contract and sub-ID
  getLPAssetId, // Generate LP token asset ID for v1 pools

  // v2 utilities
  buildPoolIdV2, // Build v2 pool ID (numeric)
  getLPAssetIdV2, // Generate LP token asset ID for v2 bins
  poolIdV2Input, // Format v2 pool ID for contract calls
  reorderPoolIdV2, // Reorder assets in v2 pool ID
  extractAssetsFromPoolIdV2, // Extract asset IDs from v2 pool
  arrangePoolParamsV2, // Arrange pool parameters for v2
  poolInputFromAssets, // Create pool input from asset pair
  poolContainsAssetV2, // Check if v2 pool contains asset

  // Bin-specific utilities (v2 only)
  binIdToDelta, // Convert bin ID to relative delta
  deltaToBinId, // Convert relative delta to bin ID
  binIdToPrice, // Convert bin ID to price
  priceToBinId, // Convert price to bin ID
  calculateLiquidityDistribution, // Calculate liquidity across bins
  calculateBinAmounts, // Calculate token amounts for bins
  getBinRange, // Get range of bin IDs
  getActiveBinRange, // Get range around active bin
  validateBinStep, // Validate bin step parameter
  validateBaseFactor, // Validate base factor parameter
  calculateBinPriceRange, // Calculate price range for bins
} from "./utils";

// Mathematical functions for AMM calculations
export {
  // v1 math functions (constant product formula)
  getAmountOut, // Calculate output amount for v1 swaps
  getAmountIn, // Calculate input amount for v1 swaps
  subtractFee, // Remove fee from amount
  addFee, // Add fee to amount
  roundingUpDivision, // Division with rounding up
  powDecimals, // Power function for decimal calculations

  // v2 math functions (binned liquidity)
  getAmountOutWithFeesV2, // Calculate v2 output with fees
  getAmountInWithFeesV2, // Calculate v2 input with fees
  getAmountsOutV2, // Multi-hop output calculation for v2
  getAmountsInV2, // Multi-hop input calculation for v2
  calculateProportionalAmountV2, // Proportional amount for v2 liquidity
  validateSlippageV2, // Validate slippage for v2 operations
} from "./math";

// Advanced v2 mathematical functions for binned liquidity
export {
  // Core v2 swap calculations
  getAmountOutV2, // Calculate output for v2 bin-based swaps
  getAmountInV2, // Calculate input for v2 bin-based swaps

  // Price and bin calculations
  getBinPrice, // Get price for specific bin ID
  getPriceBinId, // Get bin ID for specific price

  // Liquidity distribution and optimization
  calculateLiquidityDistributionV2, // Calculate optimal liquidity distribution
  calculateOptimalDistribution, // Find optimal bin distribution strategy
  calculatePositionValue, // Calculate total position value across bins

  // Advanced analytics
  calculateImpermanentLossV2, // Calculate impermanent loss for v2 positions
  calculateSwapFeeV2, // Calculate fees for v2 swaps
  calculateEffectivePrice, // Calculate effective price after swap
  calculatePriceImpact, // Calculate price impact of trade

  // Slippage and protection calculations
  calculateMinAmountOut, // Calculate minimum output with slippage
  calculateMaxAmountIn, // Calculate maximum input with slippage
  calculateBinLiquidity, // Calculate liquidity for specific bin
} from "./math-v2";

// Mock SDK for testing and development without blockchain interactions
export * from "./mock";

# Mira V2 Math Utilities

This document describes the math utilities implemented for Mira v2 binned liquidity pools.

## Overview

Mira v2 introduces binned liquidity (concentrated liquidity) following the Meteora/Trader Joe v2
model. Unlike v1's continuous liquidity curve, v2 distributes liquidity across discrete price bins,
allowing for more capital-efficient trading.

## Core Math Functions

### Swap Calculations

#### `getAmountOutV2(poolMetadata, amountIn, swapForY)`

Calculates the output amount for a swap in a v2 binned liquidity pool.

- Traverses bins starting from the active bin
- Uses constant product formula within each bin
- Handles multi-bin swaps when liquidity spans multiple bins

#### `getAmountInV2(poolMetadata, amountOut, swapForY)`

Calculates the required input amount for a desired output in a v2 pool.

- Works backwards from desired output
- Accounts for liquidity distribution across bins
- Uses rounding up division to ensure sufficient input

### Price and Bin Calculations

#### `getBinPrice(binId, binStep)`

Calculates the price at a specific bin ID using the formula:

```
price = (1 + binStep / 10000) ^ binId
```

#### `getPriceBinId(price, binStep)`

Inverse function to find the bin ID for a given price using binary search for accuracy.

### Liquidity Distribution

#### `calculateLiquidityDistributionV2(totalAmountX, totalAmountY, activeBinId, liquidityConfigs)`

Distributes liquidity across multiple bins based on configuration:

- Takes total amounts and distribution percentages
- Returns a map of bin ID to token amounts
- Validates that total distribution is not zero

#### `calculateOptimalDistribution(activeBinId, minBinId, maxBinId, concentrationFactor)`

Creates an optimal liquidity distribution using exponential decay:

- Concentrates liquidity around the active bin
- Uses concentration factor (0-1) to control distribution spread
- Returns array of liquidity configurations

### Position Management

#### `calculatePositionValue(binPositions, poolMetadata)`

Calculates the total value of a liquidity position across multiple bins.

#### `calculateImpermanentLossV2(initialAmounts, currentAmounts, initialPrice, currentPrice)`

Calculates impermanent loss for v2 positions considering price changes.

### Fee and Slippage Calculations

#### `calculateSwapFeeV2(amountIn, feeBasisPoints)`

Calculates swap fees in basis points.

#### `calculateMinAmountOut(amountOut, slippageBasisPoints)`

#### `calculateMaxAmountIn(amountIn, slippageBasisPoints)`

Helper functions for slippage protection.

### Price Impact and Efficiency

#### `calculateEffectivePrice(amountIn, amountOut)`

Calculates the effective price after a swap.

#### `calculatePriceImpact(spotPrice, effectivePrice)`

Measures price impact as a percentage.

## Integration Functions

The `math.ts` file includes integration functions that combine v2 math with existing v1 patterns:

### Multi-hop Routing

#### `getAmountsOutV2(poolsMetadata, amountIn, swapDirections, fees)`

#### `getAmountsInV2(poolsMetadata, amountOut, swapDirections, fees)`

Calculate amounts for multi-hop trades across v2 pools.

### Liquidity Management

#### `calculateProportionalAmountV2(poolMetadata, amountDesired, isTokenX)`

Calculates proportional amounts for adding liquidity to maintain pool ratios.

#### `validateSlippageV2(expectedAmount, actualAmount, slippageBasisPoints)`

Validates that amounts are within acceptable slippage tolerance.

## Key Differences from V1

1. **Discrete Bins**: Liquidity is distributed across discrete price ranges instead of a continuous
   curve
2. **Multi-bin Operations**: Swaps may traverse multiple bins to complete
3. **Concentrated Liquidity**: Allows for more capital-efficient liquidity provision
4. **Per-pool Fees**: Fees are configured per pool rather than globally
5. **Complex Position Management**: Positions can span multiple bins with different price ranges

## Usage Examples

```typescript
import {
  getAmountOutV2,
  calculateOptimalDistribution,
  calculateLiquidityDistributionV2,
} from "mira-dex-ts";

// Calculate swap output
const amountOut = getAmountOutV2(poolMetadata, amountIn, true);

// Create optimal liquidity distribution
const distribution = calculateOptimalDistribution(activeId, activeId - 10, activeId + 10, 0.7);

// Distribute liquidity across bins
const binAmounts = calculateLiquidityDistributionV2(totalX, totalY, activeId, distribution);
```

## Testing

Comprehensive tests are provided in `__tests__/math-v2.test.ts` covering:

- All core math functions
- Edge cases and error conditions
- Integration with existing v1 patterns
- Multi-bin operations and routing

The tests use mock pool metadata and simulate bin liquidity for testing purposes.

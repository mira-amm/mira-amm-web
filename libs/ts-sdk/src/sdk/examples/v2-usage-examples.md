# Mira v2 SDK Usage Examples

This document provides comprehensive examples of how to use the Mira v2 SDK for interacting with
binned liquidity pools.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Pool Operations](#pool-operations)
3. [Liquidity Management](#liquidity-management)
4. [Swap Operations](#swap-operations)
5. [Bin-Specific Operations](#bin-specific-operations)
6. [Advanced Features](#advanced-features)
7. [Migration from v1](#migration-from-v1)

## Basic Setup

```typescript
import {Provider, Account} from "fuels";
import {MiraAmmV2, ReadonlyMiraAmmV2} from "mira-dex-ts";

// Initialize provider and account
const provider = await Provider.create("https://testnet.fuel.network/v1/graphql");
const account = new Account("your-private-key", provider);

// Initialize SDK instances
const miraAmmV2 = new MiraAmmV2(account);
const readonlyMiraAmmV2 = new ReadonlyMiraAmmV2(provider);
```

## Pool Operations

### Creating a New Pool

```typescript
import {BN} from "fuels";
import {PoolInput, ACTIVE_BIN_ID, BIN_STEP_RANGES} from "mira-dex-ts";

const poolInput: PoolInput = {
  assetX: {bits: "0x..."}, // Token A asset ID
  assetY: {bits: "0x..."}, // Token B asset ID
  binStep: BIN_STEP_RANGES.MEDIUM, // 0.25% bin step
  baseFactor: 10000,
};

// Active bin ID represents the current price
// Center bin (8388608) represents 1:1 price ratio
const activeId = new BN(ACTIVE_BIN_ID.CENTER);

const transaction = await miraAmmV2.createPool(poolInput, activeId);
```

### Querying Pool Information

```typescript
// Get pool metadata
const poolId = new BN("12345");
const poolMetadata = await readonlyMiraAmmV2.poolMetadata(poolId);

console.log("Pool info:", {
  assetX: poolMetadata.pool.assetX,
  assetY: poolMetadata.pool.assetY,
  binStep: poolMetadata.pool.binStep,
  activeBinId: poolMetadata.active_id,
});

// Get multiple pools in batch
const poolIds = [new BN("12345"), new BN("67890")];
const poolsMetadata = await readonlyMiraAmmV2.poolMetadataBatch(poolIds);
```

## Liquidity Management

### Adding Liquidity with Custom Distribution

```typescript
import {LiquidityConfig} from "mira-dex-ts";

const poolId = new BN("12345");
const amountX = new BN("1000000"); // 1 token with 6 decimals
const amountY = new BN("2000000"); // 2 tokens with 6 decimals

// Define liquidity distribution across bins
// This creates a concentrated liquidity position around the active bin
const liquidityConfig: LiquidityConfig[] = [
  {binId: 8388606, distributionX: 10, distributionY: 0}, // Below active (more X)
  {binId: 8388607, distributionX: 20, distributionY: 10}, // Below active
  {binId: 8388608, distributionX: 40, distributionY: 80}, // Active bin (balanced)
  {binId: 8388609, distributionX: 20, distributionY: 10}, // Above active
  {binId: 8388610, distributionX: 10, distributionY: 0}, // Above active (more Y)
];

const deadline = new BN(Date.now() + 20 * 60 * 1000); // 20 minutes

const transaction = await miraAmmV2.addLiquidity(
  poolId,
  amountX,
  amountY,
  amountX.mul(95).div(100), // 5% slippage tolerance
  amountY.mul(95).div(100),
  deadline,
  liquidityConfig
);
```

### Removing Liquidity from Specific Bins

```typescript
// Remove liquidity from specific bins
const binIds = [new BN("8388607"), new BN("8388608"), new BN("8388609")];

const minAmountX = new BN("950000"); // Minimum X tokens expected
const minAmountY = new BN("1900000"); // Minimum Y tokens expected

const transaction = await miraAmmV2.removeLiquidity(
  poolId,
  binIds,
  minAmountX,
  minAmountY,
  deadline
);
```

### Getting Liquidity Position Information

```typescript
import {Address} from "fuels";

const userAddress = Address.fromString("fuel1...");

// Get user's positions across all bins in a pool
const userPositions = await readonlyMiraAmmV2.getUserBinPositions(poolId, userAddress);

console.log("User positions:");
userPositions.forEach((position) => {
  console.log(`Bin ${position.binId}: ${position.lpTokens} LP tokens`);
  console.log(`  Underlying: ${position.underlyingAmounts.x} X, ${position.underlyingAmounts.y} Y`);
});

// Get comprehensive position value
const positionValue = await readonlyMiraAmmV2.getLiquidityPositionV2(
  poolId,
  userAddress,
  new BN("1000000") // LP token amount
);

console.log("Position details:", {
  totalValue: positionValue.totalValue,
  assetXAmount: positionValue.assetXAmount,
  assetYAmount: positionValue.assetYAmount,
  binPositions: positionValue.binPositions,
});
```

## Swap Operations

### Basic Token Swap

```typescript
// Swap exact input amount
const assetIn = {bits: "0x..."};
const assetOut = {bits: "0x..."};
const amountIn = new BN("1000000");
const pools = [poolId]; // Route through single pool

// Preview the swap first
const previewResult = await readonlyMiraAmmV2.previewSwapExactInput(assetIn, amountIn, pools);

console.log(`Expected output: ${previewResult.amount} tokens`);

// Execute the swap with slippage protection
const minAmountOut = previewResult.amount.mul(95).div(100); // 5% slippage
const transaction = await miraAmmV2.swapExactInput(
  amountIn,
  assetIn,
  minAmountOut,
  pools,
  deadline
);
```

### Multi-hop Swaps

```typescript
// Swap through multiple pools: A -> B -> C
const multiHopPools = [
  new BN("12345"), // A/B pool
  new BN("67890"), // B/C pool
];

// Get amounts for each hop
const amountsOut = await readonlyMiraAmmV2.getAmountsOut(assetIn, amountIn, multiHopPools);

console.log("Swap route:");
amountsOut.forEach((amount, index) => {
  console.log(`Hop ${index + 1}: ${amount.amount} of asset ${amount.assetId.bits}`);
});

// Execute multi-hop swap
const finalAmountOut = amountsOut[amountsOut.length - 1];
const minFinalAmount = finalAmountOut.amount.mul(95).div(100);

const transaction = await miraAmmV2.swapExactInput(
  amountIn,
  assetIn,
  minFinalAmount,
  multiHopPools,
  deadline
);
```

## Bin-Specific Operations

### Querying Bin Information

```typescript
// Get liquidity in a specific bin
const binId = new BN("8388608");
const binLiquidity = await readonlyMiraAmmV2.getBinLiquidity(poolId, binId);

if (binLiquidity) {
  console.log(`Bin ${binId} liquidity:`, {
    tokenX: binLiquidity.x,
    tokenY: binLiquidity.y,
  });
}

// Get active bin for a pool
const activeBinId = await readonlyMiraAmmV2.getActiveBin(poolId);
console.log(`Active bin ID: ${activeBinId}`);

// Get liquidity across a range of bins
const startBin = new BN("8388600");
const endBin = new BN("8388620");
const binRange = await readonlyMiraAmmV2.getBinRange(poolId, startBin, endBin);

console.log("Bin range liquidity:");
binRange.forEach((bin, index) => {
  const binId = startBin.add(new BN(index));
  console.log(`Bin ${binId}: X=${bin.x}, Y=${bin.y}`);
});
```

### Understanding Bin Pricing

```typescript
// Convert between bin IDs and prices
const binId = 8388608; // Active bin
const price = await readonlyMiraAmmV2.getPriceFromId(poolId, binId);
console.log(`Bin ${binId} price: ${price}`);

// Calculate bin ID for a target price
const targetPrice = new BN("1500000"); // 1.5 with 6 decimal precision
const targetBinId = await readonlyMiraAmmV2.getBinIdFromPrice(poolId, targetPrice);
console.log(`Price ${targetPrice} corresponds to bin ${targetBinId}`);
```

### Liquidity Distribution Analysis

```typescript
// Get comprehensive liquidity distribution
const distribution = await readonlyMiraAmmV2.getLiquidityDistribution(poolId);

console.log("Pool liquidity distribution:", {
  activeBinId: distribution.activeBinId,
  totalLiquidity: distribution.totalLiquidity,
  numberOfBins: distribution.bins.length,
});

// Analyze bin distribution
distribution.bins.forEach((bin) => {
  console.log(`Bin ${bin.binId}: ${bin.liquidityX} X, ${bin.liquidityY} Y`);
});
```

## Advanced Features

### Optimal Liquidity Distribution

```typescript
// Calculate optimal liquidity distribution for a price range
const targetRange = {
  minPrice: new BN("900000"), // 0.9
  maxPrice: new BN("1100000"), // 1.1
};

const optimalDistribution = await readonlyMiraAmmV2.calculateOptimalDistribution(
  poolId,
  amountX,
  amountY,
  targetRange.minPrice,
  targetRange.maxPrice
);

console.log("Optimal distribution:");
optimalDistribution.forEach((config) => {
  console.log(`Bin ${config.binId}: ${config.distributionX}% X, ${config.distributionY}% Y`);
});
```

### Performance Optimization with Caching

```typescript
// Configure cache for different use cases
readonlyMiraAmmV2.configureCacheForUseCase("trading"); // Fast updates for trading
// readonlyMiraAmmV2.configureCacheForUseCase("analytics"); // Longer cache for analytics
// readonlyMiraAmmV2.configureCacheForUseCase("liquidity"); // Balanced for LP operations

// Batch operations for better performance
const poolIds = [new BN("1"), new BN("2"), new BN("3")];
const batchResults = await readonlyMiraAmmV2.poolMetadataBatch(poolIds);

// Preload data for a route
const route = [new BN("12345"), new BN("67890")];
// Cache manager automatically preloads relevant bin data
```

### Error Handling

```typescript
import {MiraV2Error, PoolCurveStateError} from "mira-dex-ts";

try {
  const result = await miraAmmV2.swapExactInput(amountIn, assetIn, minAmountOut, pools, deadline);
} catch (error) {
  if (error instanceof MiraV2Error) {
    switch (error.code) {
      case PoolCurveStateError.InsufficientReserves:
        console.log("Not enough liquidity for this swap");
        break;
      case PoolCurveStateError.InvalidParameters:
        console.log("Invalid swap parameters");
        break;
      case PoolCurveStateError.SlippageExceeded:
        console.log("Slippage tolerance exceeded");
        break;
      default:
        console.log("Unknown error:", error.message);
    }
  }
}
```

## Migration from v1

### Key Differences

1. **Pool IDs**: v2 uses `BN` instead of tuples
2. **Liquidity**: Distributed across bins instead of single position
3. **Fees**: Per-pool instead of global
4. **Price Discovery**: Bin-based pricing mechanism

### Migration Example

```typescript
// v1 approach
const v1PoolId = {assetX: "0x...", assetY: "0x..."};
const v1Liquidity = await readonlyMiraAmm.poolMetadata(v1PoolId);

// v2 approach
const v2PoolId = new BN("12345");
const v2Liquidity = await readonlyMiraAmmV2.poolMetadata(v2PoolId);

// v1 add liquidity (single position)
await miraAmm.addLiquidity(v1PoolId, amountX, amountY, minX, minY, deadline);

// v2 add liquidity (distributed across bins)
const liquidityConfig: LiquidityConfig[] = [
  {binId: 8388608, distributionX: 100, distributionY: 100},
];
await miraAmmV2.addLiquidity(v2PoolId, amountX, amountY, minX, minY, deadline, liquidityConfig);
```

### Best Practices for v2

1. **Concentrated Liquidity**: Focus liquidity around expected price ranges
2. **Bin Management**: Monitor and rebalance positions as prices move
3. **Gas Optimization**: Use batch operations when possible
4. **Slippage Protection**: Account for bin-based price impact
5. **Cache Usage**: Configure caching based on your use case

## Constants and Configuration

```typescript
import {
  BIN_STEP_RANGES,
  BASE_FACTOR_RANGES,
  ACTIVE_BIN_ID,
  LIQUIDITY_DISTRIBUTION,
  V2_TRANSACTION_CONFIG,
} from "mira-dex-ts";

// Use predefined constants for better maintainability
const poolConfig = {
  binStep: BIN_STEP_RANGES.MEDIUM, // 0.25%
  baseFactor: BASE_FACTOR_RANGES.DEFAULT, // 10000
  activeBinId: ACTIVE_BIN_ID.CENTER, // 8388608
};

// Transaction configuration
const slippage = V2_TRANSACTION_CONFIG.DEFAULT_SLIPPAGE; // 0.5%
const deadline = Date.now() + V2_TRANSACTION_CONFIG.DEFAULT_DEADLINE_MINUTES * 60 * 1000;
```

This documentation provides a comprehensive guide to using the Mira v2 SDK. The bin-based liquidity
system offers more flexibility and capital efficiency compared to v1, but requires understanding of
the underlying mechanics for optimal usage.

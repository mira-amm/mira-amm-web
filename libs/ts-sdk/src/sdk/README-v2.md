# Mira v2 TypeScript SDK

The Mira v2 SDK provides a comprehensive interface for interacting with Mira's binned liquidity
pools on the Fuel blockchain. This version introduces concentrated liquidity through discrete price
bins, offering improved capital efficiency compared to traditional AMMs.

## Table of Contents

- [Overview](#overview)
- [Key Concepts](#key-concepts)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Migration from v1](#migration-from-v1)
- [Best Practices](#best-practices)

## Overview

Mira v2 implements a binned liquidity model similar to Trader Joe v2, where liquidity is distributed
across discrete price points (bins) rather than continuously across all prices. This approach
provides:

- **Capital Efficiency**: Concentrate liquidity in specific price ranges
- **Flexible Positioning**: Multiple positions across different price points
- **Reduced Impermanent Loss**: Better control over price exposure
- **Improved Price Discovery**: More granular price levels

## Key Concepts

### Bins and Price Points

Each bin represents a discrete price level where liquidity can be concentrated:

```typescript
// Bin IDs increase with price
const lowerPriceBin = 8388607; // Below current price
const activeBin = 8388608; // Current price (center bin)
const higherPriceBin = 8388609; // Above current price
```

### Liquidity Distribution

Unlike v1's single position per pool, v2 allows distributing liquidity across multiple bins:

```typescript
const liquidityConfig: LiquidityConfig[] = [
  {binId: 8388607, distributionX: 20, distributionY: 0}, // 20% X below price
  {binId: 8388608, distributionX: 60, distributionY: 80}, // 60% X, 80% Y at price
  {binId: 8388609, distributionX: 20, distributionY: 20}, // 20% X, 20% Y above price
];
```

### Pool Identification

v2 uses simple numeric pool IDs instead of v1's tuple-based system:

```typescript
// v1 pool ID
const v1PoolId = {assetX: tokenA, assetY: tokenB};

// v2 pool ID
const v2PoolId = new BN("12345");
```

## Installation

```bash
npm install mira-dex-ts
# or
yarn add mira-dex-ts
```

## Quick Start

### Basic Setup

```typescript
import {Provider, Account} from "fuels";
import {MiraAmmV2, ReadonlyMiraAmmV2} from "mira-dex-ts";

// Initialize provider and account
const provider = await Provider.create("https://testnet.fuel.network/v1/graphql");
const account = new Account("your-private-key", provider);

// Create SDK instances
const miraAmm = new MiraAmmV2(account);
const readonlyAmm = new ReadonlyMiraAmmV2(provider);
```

### Query Pool Information

```typescript
const poolId = new BN("12345");

// Get pool metadata
const metadata = await readonlyAmm.poolMetadata(poolId);
console.log(`Active bin: ${metadata.activeId}`);
console.log(`Total reserves: ${metadata.reserves.x} X, ${metadata.reserves.y} Y`);

// Get current price
const activeBin = await readonlyAmm.getActiveBin(poolId);
const price = await readonlyAmm.getPriceFromId(poolId, activeBin);
console.log(`Current price: ${price}`);
```

### Add Concentrated Liquidity

```typescript
const poolId = new BN("12345");
const amountX = new BN("1000000");
const amountY = new BN("2000000");

// Concentrate liquidity around current price
const liquidityConfig: LiquidityConfig[] = [
  {binId: 8388607, distributionX: 25, distributionY: 0}, // Below price
  {binId: 8388608, distributionX: 50, distributionY: 80}, // At price
  {binId: 8388609, distributionX: 25, distributionY: 20}, // Above price
];

const deadline = new BN(Date.now() + 20 * 60 * 1000); // 20 minutes

const transaction = await miraAmm.addLiquidity(
  poolId,
  amountX,
  amountY,
  amountX.mul(95).div(100), // 5% slippage
  amountY.mul(95).div(100),
  deadline,
  undefined, // activeIdDesired (use current)
  5, // idSlippage (5 bins tolerance)
  [
    // deltaIds (relative to active bin)
    {Negative: 1}, // -1 bin
    {Positive: 0}, // active bin
    {Positive: 1}, // +1 bin
  ],
  [25, 50, 25], // distributionX
  [0, 80, 20] // distributionY
);
```

### Execute Swaps

```typescript
const assetIn = {bits: "0x..."};
const amountIn = new BN("1000000");
const pools = [poolId];

// Preview swap first
const preview = await readonlyAmm.previewSwapExactInput(assetIn, amountIn, pools);
console.log(`Expected output: ${preview[1]}`);

// Execute swap with slippage protection
const minAmountOut = preview[1].mul(95).div(100); // 5% slippage
const swapTx = await miraAmm.swapExactInput(amountIn, assetIn, minAmountOut, pools, deadline);
```

## API Reference

### MiraAmmV2 (Write Operations)

#### Core Methods

- `addLiquidity()` - Add liquidity with bin distribution
- `removeLiquidity()` - Remove liquidity from specific bins
- `swapExactInput()` - Swap exact input amount
- `swapExactOutput()` - Swap for exact output amount
- `createPool()` - Create new v2 pool
- `createPoolAndAddLiquidity()` - Create pool and add initial liquidity

### ReadonlyMiraAmmV2 (Read Operations)

#### Pool Queries

- `poolMetadata()` - Get single pool metadata
- `poolMetadataBatch()` - Get multiple pools metadata
- `fees()` - Get pool fee rate
- `ammMetadata()` - Get AMM contract metadata

#### Bin Operations

- `getBinLiquidity()` - Get liquidity in specific bin
- `getActiveBin()` - Get current active bin ID
- `getBinRange()` - Get liquidity across bin range
- `getLiquidityDistribution()` - Get complete liquidity analysis
- `getUserBinPositions()` - Get user's positions across bins

#### Swap Previews

- `previewSwapExactInput()` - Preview exact input swap
- `previewSwapExactOutput()` - Preview exact output swap
- `getAmountsOut()` - Get multi-hop output amounts
- `getAmountsIn()` - Get multi-hop input amounts

## Examples

### Analyzing Liquidity Distribution

```typescript
const poolId = new BN("12345");
const distribution = await readonlyAmm.getLiquidityDistribution(poolId);

console.log(`Pool Analysis:`);
console.log(
  `  Total Liquidity: ${distribution.totalLiquidity.x} X, ${distribution.totalLiquidity.y} Y`
);
console.log(`  Active Bin: ${distribution.activeBinId}`);

// Find bins with most liquidity
const topBins = distribution.bins
  .filter((bin) => bin.liquidity.x.gt(0) || bin.liquidity.y.gt(0))
  .sort((a, b) => {
    const totalA = a.liquidity.x.add(a.liquidity.y);
    const totalB = b.liquidity.x.add(b.liquidity.y);
    return totalB.sub(totalA).toNumber();
  })
  .slice(0, 5);

console.log(`Top 5 bins by liquidity:`);
topBins.forEach((bin) => {
  console.log(
    `  Bin ${bin.binId}: ${bin.liquidity.x} X, ${bin.liquidity.y} Y at price ${bin.price}`
  );
});
```

### Multi-hop Swaps

```typescript
const route = [
  new BN("12345"), // A/B pool
  new BN("67890"), // B/C pool
];

// Get amounts for each hop
const amountsOut = await readonlyAmm.getAmountsOut(assetA, amountIn, route);

console.log(`Multi-hop route:`);
amountsOut.forEach((amount, index) => {
  console.log(`  Hop ${index + 1}: ${amount[1]} of ${amount[0].bits}`);
});

// Execute multi-hop swap
const finalOutput = amountsOut[amountsOut.length - 1];
const minFinalAmount = finalOutput[1].mul(95).div(100);

const swapTx = await miraAmm.swapExactInput(amountIn, assetA, minFinalAmount, route, deadline);
```

### Position Management

```typescript
const userAddress = Address.fromString("fuel1...");

// Get user's positions across all bins
const positions = await readonlyAmm.getUserBinPositions(poolId, userAddress);

console.log(`User positions in pool ${poolId}:`);
positions.forEach((position) => {
  console.log(`  Bin ${position.binId}:`);
  console.log(`    LP Tokens: ${position.lpTokenAmount}`);
  console.log(
    `    Underlying: ${position.underlyingAmounts.x} X, ${position.underlyingAmounts.y} Y`
  );
});

// Calculate total position value
const totalValue = positions.reduce(
  (total, position) => ({
    x: total.x.add(position.underlyingAmounts.x),
    y: total.y.add(position.underlyingAmounts.y),
  }),
  {x: new BN(0), y: new BN(0)}
);

console.log(`Total position value: ${totalValue.x} X, ${totalValue.y} Y`);
```

## Migration from v1

### Key Changes

1. **Pool IDs**: Numeric instead of tuple-based
2. **Liquidity Model**: Binned instead of continuous
3. **Fees**: Per-pool instead of global
4. **Positions**: Multiple bins instead of single position

### Migration Steps

1. **Update Pool ID Format**:

   ```typescript
   // v1
   const v1PoolId = {assetX: tokenA, assetY: tokenB};

   // v2 - need to map to numeric ID
   const v2PoolId = new BN("12345");
   ```

2. **Adapt Liquidity Operations**:

   ```typescript
   // v1 - single position
   await miraAmm.addLiquidity(poolId, amountA, amountB, minA, minB, deadline);

   // v2 - distributed across bins
   const config: LiquidityConfig[] = [
     {
       binId: 8388608,
       distributionX: 100,
       distributionY: 100,
     },
   ];
   await miraAmmV2.addLiquidity(poolId, amountA, amountB, minA, minB, deadline, config);
   ```

3. **Update Fee Queries**:

   ```typescript
   // v1 - global fees
   const fees = await readonlyAmm.fees();

   // v2 - per-pool fees
   const fees = await readonlyAmmV2.fees(poolId);
   ```

See [Migration Guide](./examples/v1-to-v2-migration.md) for detailed migration instructions.

## Best Practices

### 1. Liquidity Distribution Strategy

- **Concentrated**: Focus liquidity around expected price range
- **Balanced**: Distribute across multiple bins for stability
- **Asymmetric**: Use different distributions for X and Y tokens

```typescript
// Concentrated strategy (tight range)
const concentrated: LiquidityConfig[] = [
  {binId: activeBin - 1, distributionX: 25, distributionY: 25},
  {binId: activeBin, distributionX: 50, distributionY: 50},
  {binId: activeBin + 1, distributionX: 25, distributionY: 25},
];

// Wide strategy (broader range)
const wide: LiquidityConfig[] = [
  {binId: activeBin - 5, distributionX: 10, distributionY: 0},
  {binId: activeBin - 2, distributionX: 20, distributionY: 20},
  {binId: activeBin, distributionX: 40, distributionY: 60},
  {binId: activeBin + 2, distributionX: 20, distributionY: 20},
  {binId: activeBin + 5, distributionX: 10, distributionY: 0},
];
```

### 2. Performance Optimization

- Use batch operations for multiple queries
- Configure caching based on use case
- Preload route data for better performance

```typescript
// Batch queries
const poolIds = [new BN("1"), new BN("2"), new BN("3")];
const metadataList = await readonlyAmm.poolMetadataBatch(poolIds);

// Configure caching
readonlyAmm.configureCacheForUseCase("trading"); // Fast updates
```

### 3. Error Handling

```typescript
import {MiraV2Error, PoolCurveStateError} from "mira-dex-ts";

try {
  await miraAmm.addLiquidity(/* ... */);
} catch (error) {
  if (error instanceof MiraV2Error) {
    switch (error.code) {
      case PoolCurveStateError.InsufficientReserves:
        console.log("Not enough liquidity in target bins");
        break;
      case PoolCurveStateError.InvalidParameters:
        console.log("Invalid bin configuration");
        break;
      default:
        console.log("Unknown v2 error:", error.message);
    }
  }
}
```

### 4. Gas Optimization

- Minimize number of bins in liquidity operations
- Use appropriate slippage tolerances
- Batch operations when possible

### 5. Monitoring and Rebalancing

```typescript
// Monitor position performance
const positions = await readonlyAmm.getUserBinPositions(poolId, userAddress);
const activeBin = await readonlyAmm.getActiveBin(poolId);

// Check if positions are still in range
const inRangePositions = positions.filter(
  (pos) => Math.abs(pos.binId - activeBin) <= 5 // Within 5 bins of active
);

if (inRangePositions.length < positions.length * 0.8) {
  console.log("Consider rebalancing - many positions out of range");
}
```

## Constants and Configuration

```typescript
import {
  BIN_STEP_RANGES,
  BASE_FACTOR_RANGES,
  ACTIVE_BIN_ID,
  LIQUIDITY_DISTRIBUTION,
  V2_TRANSACTION_CONFIG,
} from "mira-dex-ts";

// Common bin steps
BIN_STEP_RANGES.LOW; // 0.1% (1 basis point)
BIN_STEP_RANGES.MEDIUM; // 0.25% (25 basis points)
BIN_STEP_RANGES.HIGH; // 1.0% (100 basis points)

// Active bin reference
ACTIVE_BIN_ID.CENTER; // 8388608 (represents 1:1 price ratio)

// Default configurations
V2_TRANSACTION_CONFIG.DEFAULT_SLIPPAGE; // 0.5%
V2_TRANSACTION_CONFIG.DEFAULT_DEADLINE_MINUTES; // 20 minutes
```

For more detailed examples and advanced usage patterns, see the
[Usage Examples](./examples/v2-usage-examples.md) documentation.

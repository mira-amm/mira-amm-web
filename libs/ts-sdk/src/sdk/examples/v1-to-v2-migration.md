# Migration Guide: Mira v1 to v2

This comprehensive guide helps developers migrate from Mira v1 to v2, highlighting key differences
and providing migration strategies with detailed examples.

## Table of Contents

1. [Overview of Changes](#overview-of-changes)
2. [Understanding the Fundamental Differences](#understanding-the-fundamental-differences)
3. [Key Architectural Differences](#key-architectural-differences)
4. [Migration Strategies](#migration-strategies)
5. [Migration Wrapper Class](#migration-wrapper-class)
6. [Best Practices for Migration](#best-practices-for-migration)
7. [Common Migration Issues](#common-migration-issues)
8. [Performance Considerations](#performance-considerations)

## Overview of Changes

Mira v2 introduces a fundamentally different liquidity model based on **binned liquidity** instead
of the traditional constant product formula. This change provides:

- **Concentrated Liquidity**: Focus capital in specific price ranges
- **Capital Efficiency**: Better utilization of liquidity provider funds
- **Flexible Positioning**: Multiple discrete positions within a single pool
- **Improved Price Discovery**: More granular price levels

## Understanding the Fundamental Differences

### Liquidity Model Comparison

**v1 - Continuous Liquidity:**

```
Price Range: [0, ∞]
Liquidity:   ████████████████████████████████████████
             Uniform distribution across all prices
```

**v2 - Binned Liquidity:**

```
Price Range: [Bin 1][Bin 2][Bin 3][Bin 4][Bin 5]...
Liquidity:   ░░░░░░░██████████████░░░░░░░░░░░░░░░░░░░
             Concentrated in specific price ranges
```

### Capital Efficiency Example

```typescript
// v1: $10,000 spread across infinite price range
// Only ~$100 used for trades in 1% price range

// v2: $10,000 concentrated in 1% price range
// All $10,000 available for trades in that range
// Result: 100x capital efficiency
```

## Key Architectural Differences

### Pool Identification

**v1 (Tuple-based Pool IDs):**

```typescript
// v1 pool ID is a tuple of asset IDs and stable flag
const poolId: PoolId = [
  {bits: "0x..."}, // assetX
  {bits: "0x..."}, // assetY
  false, // isStable
];

// Pool identification based on asset pair
const poolExists = await readonlyMiraAmm.poolMetadata(poolId);
```

**v2 (Numeric Pool IDs):**

```typescript
// v2 pool ID is a simple number assigned at creation
const poolId: PoolIdV2 = new BN("12345");

// Pool identification based on unique numeric ID
const poolExists = await readonlyMiraAmmV2.poolMetadata(poolId);
```

### Liquidity Model

**v1 (Single Position):**

```typescript
// One liquidity position per pool
// Uniform distribution across all prices
// Simple add/remove operations

await miraAmm.addLiquidity(poolId, amountA, amountB, minAmountA, minAmountB, deadline);

// Single LP token represents entire position
const position = await readonlyMiraAmm.getLiquidityPosition(poolId, lpTokenAmount);
```

**v2 (Binned Liquidity):**

```typescript
// Multiple positions across discrete price bins
// Concentrated liquidity in specific ranges
// Complex distribution strategies

const liquidityConfig: LiquidityConfig[] = [
  {binId: 8388607, distributionX: 25, distributionY: 0}, // Below price
  {binId: 8388608, distributionX: 50, distributionY: 80}, // At price
  {binId: 8388609, distributionX: 25, distributionY: 20}, // Above price
];

await miraAmmV2.addLiquidity(
  poolId,
  amountA,
  amountB,
  minAmountA,
  minAmountB,
  deadline,
  undefined, // activeIdDesired
  5, // idSlippage
  [
    // deltaIds
    {Negative: 1},
    {Positive: 0},
    {Positive: 1},
  ],
  [25, 50, 25], // distributionX
  [0, 80, 20] // distributionY
);

// Multiple LP tokens (one per bin)
const positions = await readonlyMiraAmmV2.getUserBinPositions(poolId, userAddress);
```

### Fee Structure

**v1 (Global Fees):**

```typescript
// Single fee rate for all pools
const fees = await readonlyMiraAmm.fees();
console.log(`Global fee: ${fees.lpFeeVolatile} for volatile pools`);
console.log(`Global fee: ${fees.lpFeeStable} for stable pools`);
```

**v2 (Per-Pool Fees):**

```typescript
// Each pool has its own fee structure
const poolFee = await readonlyMiraAmmV2.fees(poolId);
console.log(`Pool ${poolId} fee: ${poolFee} basis points`);

// Different pools can have different fees
const pool1Fee = await readonlyMiraAmmV2.fees(new BN("12345"));
const pool2Fee = await readonlyMiraAmmV2.fees(new BN("67890"));
```

## Migration Strategies

### 1. Basic Pool Operations

#### Pool Metadata Query

**v1:**

```typescript
import {MiraAmm, ReadonlyMiraAmm} from "mira-dex-ts";

const poolId: PoolId = [assetA, assetB, false];
const metadata = await readonlyMiraAmm.poolMetadata(poolId);

if (metadata) {
  console.log(`Pool reserves: ${metadata.reserve0}, ${metadata.reserve1}`);
  console.log(`LP token: ${metadata.liquidity[0].bits}`);
}
```

**v2:**

```typescript
import {MiraAmmV2, ReadonlyMiraAmmV2} from "mira-dex-ts";

const poolId: PoolIdV2 = new BN("12345");
const metadata = await readonlyMiraAmmV2.poolMetadata(poolId);

if (metadata) {
  console.log(`Pool reserves: ${metadata.reserves.x}, ${metadata.reserves.y}`);
  console.log(`Active bin: ${metadata.activeId}`);
  console.log(`Assets: ${metadata.pool.assetX.bits}, ${metadata.pool.assetY.bits}`);
}
```

#### Pool Creation

**v1:**

```typescript
// Create pool with asset pair
await miraAmm.createPool(assetA, assetB, false); // false = volatile pool
```

**v2:**

```typescript
// Create pool with detailed configuration
const poolInput: PoolInput = {
  assetX: assetA,
  assetY: assetB,
  binStep: 25, // 0.25% bin step
  baseFactor: 10000,
};

const activeId = new BN(8388608); // Center bin (1:1 price ratio)
await miraAmmV2.createPool(poolInput, activeId);
```

### 2. Liquidity Management

#### Adding Liquidity

**v1 (Simple):**

```typescript
const poolId: PoolId = [assetA, assetB, false];

await miraAmm.addLiquidity(
  poolId,
  new BN("1000000"), // 1 token A
  new BN("2000000"), // 2 token B
  new BN("950000"), // min A (5% slippage)
  new BN("1900000"), // min B (5% slippage)
  new BN(Date.now() + 20 * 60 * 1000) // 20 min deadline
);
```

**v2 (Basic - Single Bin):**

```typescript
const poolId: PoolIdV2 = new BN("12345");

// Equivalent to v1: all liquidity in active bin
await miraAmmV2.addLiquidity(
  poolId,
  new BN("1000000"), // 1 token A
  new BN("2000000"), // 2 token B
  new BN("950000"), // min A (5% slippage)
  new BN("1900000"), // min B (5% slippage)
  new BN(Date.now() + 20 * 60 * 1000), // 20 min deadline
  undefined, // activeIdDesired (use current)
  0, // idSlippage (no bin movement allowed)
  [{Positive: 0}], // deltaIds (only active bin)
  [100], // distributionX (100% in active bin)
  [100] // distributionY (100% in active bin)
);
```

**v2 (Advanced - Concentrated):**

```typescript
// Concentrated liquidity around current price
const activeBin = await readonlyMiraAmmV2.getActiveBin(poolId);

await miraAmmV2.addLiquidity(
  poolId,
  new BN("1000000"), // 1 token A
  new BN("2000000"), // 2 token B
  new BN("950000"), // min A (5% slippage)
  new BN("1900000"), // min B (5% slippage)
  new BN(Date.now() + 20 * 60 * 1000), // 20 min deadline
  activeBin, // activeIdDesired
  5, // idSlippage (5 bins tolerance)
  [
    // deltaIds (bins relative to active)
    {Negative: 2}, // 2 bins below
    {Negative: 1}, // 1 bin below
    {Positive: 0}, // active bin
    {Positive: 1}, // 1 bin above
    {Positive: 2}, // 2 bins above
  ],
  [10, 20, 40, 20, 10], // distributionX (bell curve)
  [0, 10, 80, 10, 0] // distributionY (concentrated at active)
);
```

#### Removing Liquidity

**v1:**

```typescript
const lpTokenAmount = new BN("500000");

await miraAmm.removeLiquidity(
  poolId,
  lpTokenAmount,
  new BN("450000"), // min A
  new BN("900000"), // min B
  deadline
);
```

**v2:**

```typescript
// Get user's bin positions first
const userPositions = await readonlyMiraAmmV2.getUserBinPositions(poolId, userAddress);

// Remove liquidity from specific bins
const binIds = userPositions.map((pos) => new BN(pos.binId));

await miraAmmV2.removeLiquidity(
  poolId,
  binIds,
  new BN("450000"), // min A
  new BN("900000"), // min B
  deadline
);
```

### 3. Swap Operations

#### Basic Swaps

**v1:**

```typescript
const route: PoolId[] = [
  [assetA, assetB, false], // A/B pool
  [assetB, assetC, false], // B/C pool
];

await miraAmm.swapExactInput(
  new BN("1000000"), // amount in
  assetA, // input asset
  new BN("1900000"), // min amount out
  route,
  deadline
);
```

**v2:**

```typescript
// Route now uses numeric pool IDs
const route: PoolIdV2[] = [
  new BN("12345"), // A/B pool
  new BN("67890"), // B/C pool
];

await miraAmmV2.swapExactInput(
  new BN("1000000"), // amount in
  assetA, // input asset
  new BN("1900000"), // min amount out
  route,
  deadline
);
```

#### Swap Previews

**v1:**

```typescript
const preview = await readonlyMiraAmm.previewSwapExactInput(assetA, new BN("1000000"), route);

console.log(`Expected output: ${preview[1]}`);
```

**v2:**

```typescript
// Same interface, but now accounts for bin-based liquidity
const preview = await readonlyMiraAmmV2.previewSwapExactInput(assetA, new BN("1000000"), route);

console.log(`Expected output: ${preview[1]}`);

// Additional v2-specific analysis
const distribution = await readonlyMiraAmmV2.getLiquidityDistribution(route[0]);
console.log(`Liquidity concentrated in ${distribution.bins.length} bins`);
```

### 4. Position Management

#### Getting Position Information

**v1:**

```typescript
const lpTokenAmount = new BN("1000000");
const position = await readonlyMiraAmm.getLiquidityPosition(poolId, lpTokenAmount);

console.log(`Position value: ${position[0][1]} A, ${position[1][1]} B`);
```

**v2:**

```typescript
// More detailed position information across bins
const userAddress = Address.fromString("fuel1...");
const positions = await readonlyMiraAmmV2.getUserBinPositions(poolId, userAddress);

console.log(`User has positions in ${positions.length} bins:`);
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

console.log(`Total position: ${totalValue.x} X, ${totalValue.y} Y`);
```

## Migration Wrapper Class

To ease migration, you can create a wrapper class that provides v1-like interface:

```typescript
import {MiraAmmV2, ReadonlyMiraAmmV2, LiquidityConfig, PoolIdV2, PoolId} from "mira-dex-ts";
import {AssetId, BigNumberish, BN, Address} from "fuels";

export class MiraV1CompatibilityWrapper {
  constructor(
    private miraV2: MiraAmmV2,
    private readonlyV2: ReadonlyMiraAmmV2,
    private poolMapping: Map<string, PoolIdV2> // Map v1 pool keys to v2 IDs
  ) {}

  // Convert v1 pool ID to v2 pool ID
  private getV2PoolId(v1PoolId: PoolId): PoolIdV2 {
    const [assetX, assetY, isStable] = v1PoolId;
    const key = `${assetX.bits}-${assetY.bits}-${isStable}`;
    const v2Id = this.poolMapping.get(key);
    if (!v2Id) {
      throw new Error(`No v2 pool found for v1 pool: ${key}`);
    }
    return v2Id;
  }

  // v1-style add liquidity (all in active bin)
  async addLiquidity(
    v1PoolId: PoolId,
    amountA: BigNumberish,
    amountB: BigNumberish,
    minAmountA: BigNumberish,
    minAmountB: BigNumberish,
    deadline: BigNumberish
  ) {
    const v2PoolId = this.getV2PoolId(v1PoolId);

    // Simple single-bin configuration (equivalent to v1)
    return this.miraV2.addLiquidity(
      v2PoolId,
      amountA,
      amountB,
      minAmountA,
      minAmountB,
      deadline,
      undefined, // activeIdDesired (use current)
      0, // idSlippage (no movement)
      [{Positive: 0}], // deltaIds (only active bin)
      [100], // distributionX (100% in active)
      [100] // distributionY (100% in active)
    );
  }

  // v1-style remove liquidity
  async removeLiquidity(
    v1PoolId: PoolId,
    lpTokenAmount: BigNumberish,
    minAmountA: BigNumberish,
    minAmountB: BigNumberish,
    deadline: BigNumberish,
    userAddress: Address
  ) {
    const v2PoolId = this.getV2PoolId(v1PoolId);

    // Get user's bin positions
    const positions = await this.readonlyV2.getUserBinPositions(v2PoolId, userAddress);
    const binIds = positions.map((pos) => new BN(pos.binId));

    return this.miraV2.removeLiquidity(v2PoolId, binIds, minAmountA, minAmountB, deadline);
  }

  // v1-style swap
  async swapExactInput(
    amountIn: BigNumberish,
    assetIn: AssetId,
    minAmountOut: BigNumberish,
    v1Route: PoolId[],
    deadline: BigNumberish
  ) {
    const v2Route = v1Route.map((pool) => this.getV2PoolId(pool));

    return this.miraV2.swapExactInput(amountIn, assetIn, minAmountOut, v2Route, deadline);
  }

  // v1-style pool metadata
  async poolMetadata(v1PoolId: PoolId) {
    const v2PoolId = this.getV2PoolId(v1PoolId);
    const v2Metadata = await this.readonlyV2.poolMetadata(v2PoolId);

    if (!v2Metadata) return null;

    // Convert v2 metadata to v1-like format
    return {
      poolId: v1PoolId,
      reserve0: v2Metadata.reserves.x,
      reserve1: v2Metadata.reserves.y,
      liquidity: [
        v2Metadata.pool.assetX,
        v2Metadata.reserves.x.add(v2Metadata.reserves.y),
      ] as Asset,
      decimals0: 9, // Default decimals
      decimals1: 9,
    };
  }

  // Build pool mapping from v1 to v2
  static async buildPoolMapping(
    readonlyV2: ReadonlyMiraAmmV2,
    knownPools: Array<{v1: PoolId; v2: PoolIdV2}>
  ): Promise<Map<string, PoolIdV2>> {
    const mapping = new Map<string, PoolIdV2>();

    for (const {v1, v2} of knownPools) {
      const [assetX, assetY, isStable] = v1;
      const key = `${assetX.bits}-${assetY.bits}-${isStable}`;
      mapping.set(key, v2);
    }

    return mapping;
  }
}

// Usage example
async function migrateToV2() {
  const provider = await Provider.create("https://testnet.fuel.network/v1/graphql");
  const account = new Account("your-private-key", provider);

  const miraV2 = new MiraAmmV2(account);
  const readonlyV2 = new ReadonlyMiraAmmV2(provider);

  // Build mapping of known pools
  const knownPools = [
    {
      v1: [assetA, assetB, false] as PoolId,
      v2: new BN("12345"),
    },
    // Add more pool mappings...
  ];

  const poolMapping = await MiraV1CompatibilityWrapper.buildPoolMapping(readonlyV2, knownPools);

  const wrapper = new MiraV1CompatibilityWrapper(miraV2, readonlyV2, poolMapping);

  // Now use v1-style interface with v2 backend
  const v1PoolId: PoolId = [assetA, assetB, false];
  await wrapper.addLiquidity(
    v1PoolId,
    new BN("1000000"),
    new BN("2000000"),
    new BN("950000"),
    new BN("1900000"),
    new BN(Date.now() + 20 * 60 * 1000)
  );
}
```

## Best Practices for Migration

### 1. Gradual Migration

Start with read-only operations and gradually migrate write operations:

```typescript
// Phase 1: Migrate queries
const v2Metadata = await readonlyMiraAmmV2.poolMetadata(poolId);
const v2Distribution = await readonlyMiraAmmV2.getLiquidityDistribution(poolId);

// Phase 2: Migrate simple operations (single-bin liquidity)
await miraAmmV2.addLiquidity(/* single bin config */);

// Phase 3: Adopt advanced features (concentrated liquidity)
await miraAmmV2.addLiquidity(/* multi-bin config */);
```

### 2. Testing Strategy

Test both v1 and v2 in parallel during migration:

```typescript
// Compare swap outputs
const v1Route: PoolId[] = [[assetA, assetB, false]];
const v2Route: PoolIdV2[] = [new BN("12345")];

const [v1Result, v2Result] = await Promise.all([
  readonlyMiraAmm.previewSwapExactInput(assetA, amountIn, v1Route),
  readonlyMiraAmmV2.previewSwapExactInput(assetA, amountIn, v2Route),
]);

console.log("v1 output:", v1Result[1].toString());
console.log("v2 output:", v2Result[1].toString());

// Validate results are within expected range
const difference = v2Result[1].sub(v1Result[1]).abs();
const tolerance = v1Result[1].mul(5).div(100); // 5% tolerance

if (difference.gt(tolerance)) {
  console.warn("Significant difference between v1 and v2 outputs");
}
```

### 3. Pool Discovery and Mapping

Build comprehensive mapping from v1 pools to v2 pools:

```typescript
interface PoolMapping {
  v1: PoolId;
  v2: PoolIdV2;
  metadata: {
    name: string;
    description: string;
    migrationDate: Date;
  };
}

async function discoverV2Pools(): Promise<PoolMapping[]> {
  const mappings: PoolMapping[] = [];

  // Query all v2 pools from contract events or API
  const allV2Pools = await getAllV2PoolsFromEvents();

  for (const v2Pool of allV2Pools) {
    const metadata = await readonlyMiraAmmV2.poolMetadata(v2Pool.id);
    if (metadata) {
      // Try to find corresponding v1 pool
      const v1PoolId: PoolId = [
        metadata.pool.assetX,
        metadata.pool.assetY,
        false, // Assume volatile for now
      ];

      const v1Metadata = await readonlyMiraAmm.poolMetadata(v1PoolId);
      if (v1Metadata) {
        mappings.push({
          v1: v1PoolId,
          v2: v2Pool.id,
          metadata: {
            name: `${getAssetSymbol(metadata.pool.assetX)}/${getAssetSymbol(metadata.pool.assetY)}`,
            description: `Migrated from v1 pool`,
            migrationDate: new Date(),
          },
        });
      }
    }
  }

  return mappings;
}
```

### 4. Error Handling

Implement comprehensive error handling for migration:

```typescript
import {MiraV2Error, PoolCurveStateError} from "mira-dex-ts";

async function safeV2Operation<T>(
  operation: () => Promise<T>,
  fallbackToV1?: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof MiraV2Error) {
      console.warn(`v2 operation failed: ${error.message}`);

      switch (error.code) {
        case PoolCurveStateError.PoolNotFound:
          console.log("Pool not found in v2, trying v1...");
          break;
        case PoolCurveStateError.InsufficientReserves:
          console.log("Insufficient liquidity in v2 bins");
          break;
        case PoolCurveStateError.InvalidParameters:
          console.log("Invalid v2 parameters, check bin configuration");
          break;
      }

      if (fallbackToV1) {
        console.log("Falling back to v1 operation");
        return await fallbackToV1();
      }
    }

    throw error;
  }
}

// Usage
const result = await safeV2Operation(
  () => miraAmmV2.swapExactInput(amountIn, assetIn, minOut, v2Route, deadline),
  () => miraAmm.swapExactInput(amountIn, assetIn, minOut, v1Route, deadline)
);
```

## Common Migration Issues

### 1. Pool ID Confusion

**Problem:** Mixing v1 tuple-style and v2 numeric pool IDs

**Solution:** Use type-safe wrappers and clear naming conventions

```typescript
// Bad: Unclear which version
const poolId = getPoolId();

// Good: Clear version indication
const v1PoolId: PoolId = [assetA, assetB, false];
const v2PoolId: PoolIdV2 = new BN("12345");

// Better: Use wrapper types
type V1PoolId = PoolId & {__v1: true};
type V2PoolId = PoolIdV2 & {__v2: true};
```

### 2. Liquidity Distribution Misunderstanding

**Problem:** Not understanding bin-based liquidity distribution

**Solution:** Start with single-bin configurations, gradually adopt concentration

```typescript
// Migration Step 1: Single bin (v1-equivalent)
const singleBinConfig: LiquidityConfig[] = [
  {binId: activeBin, distributionX: 100, distributionY: 100},
];

// Migration Step 2: Simple concentration (3 bins)
const simpleConcentration: LiquidityConfig[] = [
  {binId: activeBin - 1, distributionX: 25, distributionY: 25},
  {binId: activeBin, distributionX: 50, distributionY: 50},
  {binId: activeBin + 1, distributionX: 25, distributionY: 25},
];

// Migration Step 3: Advanced strategies
const advancedStrategy: LiquidityConfig[] = [
  {binId: activeBin - 5, distributionX: 5, distributionY: 0},
  {binId: activeBin - 2, distributionX: 15, distributionY: 10},
  {binId: activeBin - 1, distributionX: 25, distributionY: 20},
  {binId: activeBin, distributionX: 30, distributionY: 40},
  {binId: activeBin + 1, distributionX: 20, distributionY: 25},
  {binId: activeBin + 2, distributionX: 5, distributionY: 5},
];
```

### 3. Price Impact Differences

**Problem:** Different price impact calculations due to binned liquidity

**Solution:** Use v2 preview functions and test thoroughly

```typescript
// Compare price impact between versions
async function comparePriceImpact(
  assetIn: AssetId,
  amountIn: BN,
  v1Route: PoolId[],
  v2Route: PoolIdV2[]
) {
  const [v1Preview, v2Preview] = await Promise.all([
    readonlyMiraAmm.previewSwapExactInput(assetIn, amountIn, v1Route),
    readonlyMiraAmmV2.previewSwapExactInput(assetIn, amountIn, v2Route),
  ]);

  const v1Output = v1Preview[1];
  const v2Output = v2Preview[1];

  // Calculate price impact
  const v1Impact = amountIn.sub(v1Output).mul(10000).div(amountIn); // basis points
  const v2Impact = amountIn.sub(v2Output).mul(10000).div(amountIn);

  console.log(`v1 price impact: ${v1Impact.toNumber() / 100}%`);
  console.log(`v2 price impact: ${v2Impact.toNumber() / 100}%`);

  if (v2Impact.lt(v1Impact)) {
    console.log("v2 provides better price impact due to concentrated liquidity");
  }
}
```

### 4. Gas Cost Differences

**Problem:** Higher gas costs for complex bin operations

**Solution:** Optimize bin configurations and use batch operations

```typescript
// Optimize gas usage
const gasOptimizedConfig: LiquidityConfig[] = [
  // Use fewer bins to reduce gas costs
  {binId: activeBin - 1, distributionX: 30, distributionY: 20},
  {binId: activeBin, distributionX: 40, distributionY: 60},
  {binId: activeBin + 1, distributionX: 30, distributionY: 20},
];

// Batch operations when possible
const poolIds = [new BN("1"), new BN("2"), new BN("3")];
const batchResults = await readonlyMiraAmmV2.poolMetadataBatch(poolIds);
```

## Performance Considerations

### 1. Caching Strategies

v2 introduces more complex caching due to bin-based data:

```typescript
// Configure cache for different use cases
readonlyMiraAmmV2.configureCacheForUseCase("trading"); // Fast updates for trading
readonlyMiraAmmV2.configureCacheForUseCase("analytics"); // Longer cache for analytics
readonlyMiraAmmV2.configureCacheForUseCase("liquidity"); // Balanced for LP operations

// Custom cache configuration
const customCacheOptions: CacheOptions = {
  useCache: true,
  cacheTTL: 30000, // 30 seconds
  refreshStaleData: true,
  preloadRoutes: true,
};

const metadata = await readonlyMiraAmmV2.poolMetadata(poolId, customCacheOptions);
```

### 2. Batch Operations

Take advantage of v2's improved batch capabilities:

```typescript
// Batch pool queries
const poolIds = [new BN("1"), new BN("2"), new BN("3")];
const metadataList = await readonlyMiraAmmV2.poolMetadataBatch(poolIds);

// Batch bin queries
const binRange = await readonlyMiraAmmV2.getBinRange(poolId, startBin, endBin);

// Batch swap previews
const routes = [[new BN("12345")], [new BN("67890")], [new BN("12345"), new BN("67890")]];

const previews = await readonlyMiraAmmV2.previewSwapExactInputBatch(assetIn, amountIn, routes);
```

### 3. Memory Management

```typescript
// Efficient position tracking
class PositionTracker {
  private positionCache = new Map<string, UserBinPosition[]>();

  async getUserPositions(poolId: PoolIdV2, userAddress: Address): Promise<UserBinPosition[]> {
    const key = `${poolId.toString()}-${userAddress.toString()}`;

    if (this.positionCache.has(key)) {
      return this.positionCache.get(key)!;
    }

    const positions = await readonlyMiraAmmV2.getUserBinPositions(poolId, userAddress);
    this.positionCache.set(key, positions);

    // Clean up old entries
    if (this.positionCache.size > 1000) {
      const firstKey = this.positionCache.keys().next().value;
      this.positionCache.delete(firstKey);
    }

    return positions;
  }
}
```

## Conclusion

Migrating from Mira v1 to v2 requires understanding the fundamental shift from uniform to
concentrated liquidity. The binned liquidity model offers significant advantages in capital
efficiency and flexibility, but requires careful consideration of:

1. **Liquidity Distribution Strategy**: How to allocate capital across bins
2. **Position Management**: Monitoring and rebalancing multi-bin positions
3. **Gas Optimization**: Balancing functionality with transaction costs
4. **Risk Management**: Understanding impermanent loss in concentrated positions

Start with simple migrations using single-bin configurations that mimic v1 behavior, then gradually
adopt more sophisticated concentrated liquidity strategies as you become comfortable with the
bin-based model.

The wrapper class approach provides a smooth transition path, allowing you to maintain v1-style
interfaces while leveraging v2's improved capital efficiency under the hood.

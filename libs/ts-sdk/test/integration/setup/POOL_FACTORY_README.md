# Pool Factory for V2 SDK Integration Testing

The Pool Factory provides standardized pool creation and management utilities for integration
testing of the Mira AMM V2 SDK.

## Features

### Standard Pool Configurations

The factory supports three standard pool types with predefined configurations:

#### STABLE Pools

- **Bin Step**: 1
- **Base Factor**: 5000
- **Protocol Share**: 0
- **Use Case**: Low volatility pairs (stablecoins) with minimal fees
- **Example**: USDC/USDT

#### VOLATILE Pools

- **Bin Step**: 20
- **Base Factor**: 8000
- **Protocol Share**: 0
- **Use Case**: Medium volatility pairs with standard fees
- **Example**: ETH/USDC

#### EXOTIC Pools

- **Bin Step**: 50
- **Base Factor**: 15000
- **Protocol Share**: 0
- **Use Case**: High volatility or exotic pairs with higher fees
- **Example**: mBTC/FUEL or FUEL/ETH

### Pool Creation Utilities

#### Create Standard Pool

```typescript
const poolFactory = new PoolFactory(wallet, proxyContractId);

// Create a stable pool
const stablePoolId = await poolFactory.createStandardPool("STABLE", tokens.usdc, tokens.usdt);

// Create a volatile pool
const volatilePoolId = await poolFactory.createStandardPool("VOLATILE", tokens.eth, tokens.usdc);

// Create an exotic pool
const exoticPoolId = await poolFactory.createStandardPool("EXOTIC", tokens.fuel, tokens.eth);
```

#### Create All Standard Pools

```typescript
const pools = await poolFactory.createStandardPools({
  usdc: tokens.usdc,
  usdt: tokens.usdt,
  eth: tokens.eth,
  fuel: tokens.fuel,
  mbtc: tokens.mbtc, // Optional
});

// Access pools by type
const stablePool = pools.get("STABLE");
const volatilePool = pools.get("VOLATILE");
const exoticPool = pools.get("EXOTIC");
```

### Pool Metadata Validation

#### Validate Pool Configuration

```typescript
const validation = await poolFactory.validatePoolMetadata(poolId, {
  tokenX: tokens.usdc,
  tokenY: tokens.usdt,
  binStep: 1,
  baseFactor: 5000,
});

if (validation.isValid) {
  console.log("Pool metadata is valid");
} else {
  console.log("Validation errors:", validation.errors);
}
```

#### Cross-Validate with Indexer

```typescript
const crossValidation = await poolFactory.crossValidateWithIndexer(poolId);

if (crossValidation.isConsistent) {
  console.log("SDK and indexer data are consistent");
} else {
  console.log("Differences found:", crossValidation.differences);
}
```

### Pool Discovery and Lookup

#### Discover Pools by Asset Pair

```typescript
const pools = await poolFactory.discoverPoolsByAssetPair(tokens.usdc.assetId, tokens.usdt.assetId);

console.log(`Found ${pools.length} pools for USDC/USDT`);
```

#### Find Pool by Configuration

```typescript
const poolId = await poolFactory.findPoolByConfig({
  tokenX: tokens.usdc.assetId,
  tokenY: tokens.usdt.assetId,
  binStep: 1,
  baseFactor: 5000,
});

if (poolId) {
  console.log("Pool found:", poolId.toHex());
}
```

#### Get All Pools with Filtering

```typescript
// Get all pools
const allPools = await poolFactory.getAllPools();

// Get pools with specific criteria
const stablePools = await poolFactory.getAllPools({
  minBinStep: 1,
  maxBinStep: 5,
});
```

#### Lookup Pool by ID

```typescript
const lookupResult = await poolFactory.lookupPool(poolId);

if (lookupResult.exists) {
  console.log("Pool exists");
  console.log("SDK metadata:", lookupResult.metadata);
  console.log("Indexer data:", lookupResult.indexerData);
  console.log("Data consistent:", lookupResult.isConsistent);
}
```

## Liquidity Management

### Add Liquidity with Different Shapes

```typescript
// Concentrated liquidity (single bin)
await poolFactory.addLiquidity(poolId, amountX, amountY, {type: "concentrated", bins: 1});

// Normal distribution (bell curve)
await poolFactory.addLiquidity(poolId, amountX, amountY, {type: "normal", bins: 21});

// Uniform distribution (flat)
await poolFactory.addLiquidity(poolId, amountX, amountY, {type: "uniform", bins: 10});

// Custom distribution
await poolFactory.addLiquidity(poolId, amountX, amountY, {
  type: "custom",
  bins: 5,
  distribution: [0.1, 0.2, 0.4, 0.2, 0.1], // Custom weights
});
```

### Remove Liquidity

```typescript
// Remove percentage of liquidity
await poolFactory.removeLiquidity(poolId, 50); // Remove 50%

// Remove liquidity from specific bins
await poolFactory.removeLiquidityFromBins(poolId, [8388607, 8388608, 8388609]);
```

### Query Liquidity Information

```typescript
// Get LP token balance
const lpBalance = await poolFactory.getLPTokenBalance(wallet, poolId);

// Get liquidity distribution across bins
const distribution = await poolFactory.getLiquidityDistribution(poolId);
```

## Usage in Tests

```typescript
import {PoolFactory, STANDARD_POOL_CONFIGS} from "./setup";

describe("Pool Operations Tests", () => {
  let poolFactory: PoolFactory;

  beforeAll(async () => {
    const wallet = await walletFactory.createTestWallet();
    poolFactory = new PoolFactory(wallet, proxyContractId);
  });

  it("should create and validate pools", async () => {
    const tokens = await tokenFactory.createTestTokens();

    // Create standard pools
    const pools = await poolFactory.createStandardPools(tokens);

    // Validate each pool
    for (const [type, poolId] of pools) {
      const config = STANDARD_POOL_CONFIGS[type];
      const validation = await poolFactory.validatePoolMetadata(poolId, {
        tokenX: tokens.usdc, // Adjust based on pool type
        tokenY: tokens.usdt,
        binStep: config.binStep,
        baseFactor: config.baseFactor,
      });

      expect(validation.isValid).toBe(true);
    }
  });
});
```

## SDK Integration

The Pool Factory properly integrates with the Mira V2 SDK:

- **Real Pool Creation**: Uses `MiraAmmV2.createPool()` method for actual on-chain pool creation
- **Proper Transaction Handling**: Submits transactions and waits for completion with proper error
  handling
- **Liquidity Operations**: Uses `MiraAmmV2.addLiquidity()` and `MiraAmmV2.removeLiquidity()` for
  real liquidity management
- **Asset ID Conversion**: Properly converts string asset IDs to `AssetId` objects with `bits`
  property
- **Pool ID Calculation**: Uses SDK's `buildPoolIdV2()` utility for consistent pool ID generation

## Error Handling

The Pool Factory includes comprehensive error handling:

- **Pool Creation**: Handles cases where pools already exist using SDK error handling
- **Transaction Failures**: Gracefully handles transaction failures and provides detailed error
  messages
- **Metadata Validation**: Provides detailed error messages for validation failures
- **Network Issues**: Gracefully handles connectivity problems with indexer
- **Invalid Parameters**: Validates input parameters and provides clear error messages

## Integration with Test Environment

The Pool Factory is designed to work seamlessly with the test environment infrastructure:

- Uses the same wallet and token management utilities
- Integrates with the service manager for node and indexer connectivity
- Supports cleanup and reset operations for test isolation
- Provides cross-validation between SDK and indexer data
- Properly handles transaction submission and confirmation

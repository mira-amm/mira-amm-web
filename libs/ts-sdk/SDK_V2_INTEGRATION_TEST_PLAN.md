# Mira AMM V2 SDK Integration Test Plan

## Overview

Integration testing for the Mira AMM V2 SDK focusing on core SDK functionality against local Fuel
node and indexer infrastructure.

## Test Environment

- **Fuel Node**: Port 4000 (`http://localhost:4000/v1/graphql`)
- **Indexer**: Port 4350 (`http://localhost:4350/graphql`)
- **Launch Command**: `nx dev indexer`
- **Contract IDs**: Located in `apps/indexer/mira-binned-liquidity-api/contract-ids.json`
- **Test Tokens**: USDC, FUEL, ETH, mBTC, USDT (from `libs/web/src/utils/verified-assets.json`)
- **Default Signer**: Available in `apps/indexer/fuels.config.ts`

## Test Priority

**PRIMARY FOCUS (SDK-Critical)**: Sections 1-4 are the core SDK functionality that must be
thoroughly tested. **SECONDARY**: Sections 5-8 are primarily smart contract concerns but included
for SDK integration validation.

## Progress Tracking

### ✅ Completed

- [x] Analyze existing SDK structure and test patterns
- [x] Design comprehensive integration test plan
- [x] Create test infrastructure setup with node and indexer
- [x] Implement pool operations tests
- [x] Implement liquidity management tests

### 🚧 In Progress

- [ ] Implement swap operations tests

### 📋 Priority 1 - Core SDK Functions (Remaining)

- [ ] Implement swap operations tests
- [ ] Implement position management tests

### 📋 Priority 2 - Supporting Tests

- [ ] Basic error handling tests (SDK-specific)
- [ ] Cache validation tests
- [ ] Performance benchmarks

## Test Infrastructure

### Setup Utilities (`test/setup/`)

- [x] `test-environment.ts` - Node and indexer lifecycle management
- [ ] `wallet-manager.ts` - Test wallet creation and funding
- [x] `token-factory.ts` - Token minting utilities
- [x] `pool-factory.ts` - Standardized pool creation
- [ ] `indexer-client.ts` - Indexer query utilities

### Test Helpers (`test/helpers/`)

- [ ] `transaction-helpers.ts` - TX monitoring and verification
- [ ] `math-helpers.ts` - Calculation verification utilities
- [ ] `snapshot-helpers.ts` - State snapshot/restore
- [ ] `data-generators.ts` - Test data generation

## Core Test Suites

### 🎯 PRIMARY FOCUS - Core SDK Functionality

### 1. Pool Operations (`pool-operations.integration.test.ts`)

**Priority**: 🔴 CRITICAL - Core SDK functionality **Status**: ✅ COMPLETED

**Test Cases**:

- [x] Create pool with USDC/FUEL pair
- [x] Create pool with ETH/USDT pair
- [x] Retrieve and validate pool metadata
- [x] Test different fee configurations (10, 30, 100 bps)
- [x] Test different bin steps
- [x] Verify pool state sync with indexer
- [x] Test pool discovery by assets
- [x] Validate pool ID generation

### 2. Liquidity Management (`liquidity-management.integration.test.ts`)

**Priority**: 🔴 CRITICAL - Core SDK functionality **Status**: ✅ COMPLETED

**Test Cases**:

- [x] Add concentrated liquidity (single bin)
- [x] Add normal distribution liquidity
- [x] Add uniform distribution liquidity
- [x] Add custom shape liquidity
- [x] Remove partial liquidity
- [x] Remove all liquidity from position
- [x] Remove liquidity from specific bins
- [x] Track LP token balances
- [x] Verify liquidity shape preservation
- [x] Test liquidity limits and boundaries

### 3. Swap Operations (`swap-operations.integration.test.ts`)

**Priority**: 🔴 CRITICAL - Core SDK functionality  
**Status**: ⏳ Not Started

**Test Cases**:

- [ ] Small exact input swap (< 1 bin)
- [ ] Medium exact input swap (2-5 bins)
- [ ] Large exact input swap (> 5 bins)
- [ ] Exact output swap with target precision
- [ ] Multi-hop swap (A -> B -> C)
- [ ] Swap preview accuracy validation
- [ ] Price impact calculations
- [ ] Slippage protection testing
- [ ] Fee collection verification
- [ ] Deadline enforcement

### 4. Position Management (`position-management.integration.test.ts`)

**Priority**: 🔴 CRITICAL - Core SDK functionality **Status**: ⏳ Not Started

**Test Cases**:

- [ ] Track user positions across bins
- [ ] Manage positions in multiple pools
- [ ] Calculate position values
- [ ] Track position P&L
- [ ] Test position migration
- [ ] Query historical positions
- [ ] Aggregate position analytics
- [ ] Test position limits

### 🟡 SECONDARY - Supporting/Contract-Level Tests

### 5. Cache System (`cache-system.integration.test.ts`)

**Priority**: 🟡 MEDIUM - Mostly validated at SDK unit test level **Status**: ⏳ Not Started

**Test Cases**:

- [ ] Cache invalidation on liquidity changes
- [ ] Cache invalidation on swaps
- [ ] Batch query caching
- [ ] TTL expiration and refresh
- [ ] Cache consistency validation
- [ ] Performance with/without cache
- [ ] Cache memory management
- [ ] Concurrent cache access

### 6. Error Handling (`error-handling.integration.test.ts`)

**Priority**: 🟡 MEDIUM - Should primarily be contract-level tests **Status**: ⏳ Not Started

**SDK-Specific Test Cases**:

- [ ] Insufficient balance for swap
- [ ] Insufficient balance for liquidity
- [ ] Slippage limit exceeded
- [ ] Deadline expired
- [ ] Invalid pool ID
- [ ] Invalid asset ID
- [ ] Invalid bin ID
- [ ] Transaction reversion handling
- [ ] Network failure recovery
- [ ] Gas estimation failures

### 7. Multi-User Scenarios (`multi-user.integration.test.ts`)

**Priority**: 🟢 LOW - Primarily contract-level concern **Status**: ⏳ Not Started

**Test Cases**:

- [ ] Concurrent swaps in same pool
- [ ] Competing liquidity additions
- [ ] Simultaneous position removals
- [ ] Price discovery under load
- [ ] Fair ordering verification
- [ ] MEV resistance testing

### 8. Edge Cases (`edge-cases.integration.test.ts`)

**Priority**: 🟢 LOW - Should be contract-level tests **Status**: ⏳ Not Started

**Test Cases**:

- [ ] Minimum liquidity amounts
- [ ] Maximum liquidity amounts
- [ ] Extreme price ranges
- [ ] Zero liquidity bins
- [ ] Maximum bin ID
- [ ] Minimum bin ID
- [ ] Overflow protection
- [ ] Precision loss scenarios
- [ ] Dust amount handling

## Performance Tests

### Batch Operations (`batch-operations.test.ts`)

**Status**: ⏳ Not Started

**Test Cases**:

- [ ] Batch swap previews (10+ swaps)
- [ ] Multi-pool metadata queries
- [ ] Parallel transaction submission
- [ ] Batch position queries
- [ ] Route optimization testing

### Gas Optimization (`gas-optimization.test.ts`)

**Status**: ⏳ Not Started

**Test Cases**:

- [ ] Gas usage benchmarks per operation
- [ ] Transaction batching efficiency
- [ ] Call data optimization
- [ ] Storage access patterns
- [ ] Event emission costs

## Validation Strategies

### Cross-Validation

- [ ] SDK calculations vs indexer data
- [ ] Event emission verification
- [ ] State consistency checks
- [ ] Historical data validation

### Mathematical Verification

- [ ] Bin math correctness
- [ ] Price calculation accuracy
- [ ] Fee computation validation
- [ ] Slippage calculation verification
- [ ] Liquidity math validation

## Test Data Management

### Standard Test Scenarios

```typescript
// Example test pools
const TEST_POOLS = {
  STABLE: {
    // USDC/USDT - 1 bps fee, 1 bin step
    assets: ["USDC", "USDT"],
    fee: 10,
    binStep: 1,
  },
  VOLATILE: {
    // ETH/USDC - 30 bps fee, 20 bin step
    assets: ["ETH", "USDC"],
    fee: 300,
    binStep: 20,
  },
  EXOTIC: {
    // mBTC/FUEL - 100 bps fee, 50 bin step
    assets: ["mBTC", "FUEL"],
    fee: 1000,
    binStep: 50,
  },
};

// Standard liquidity shapes
const LIQUIDITY_SHAPES = {
  CONCENTRATED: {bins: 1, distribution: "single"},
  NORMAL: {bins: 21, distribution: "gaussian"},
  UNIFORM: {bins: 10, distribution: "flat"},
  WIDE: {bins: 50, distribution: "gaussian"},
};
```

## Implementation Notes

### Test Execution Flow

1. Start local node and indexer via `nx dev indexer`
2. Wait for services to be ready
3. Deploy and initialize test contracts (if needed)
4. Fund test wallets
5. Run test suites (focus on Priority 1)
6. Clean up test data
7. Shutdown services

### Key Testing Principles

- **SDK Focus**: Prioritize SDK method testing over contract internals
- **Isolation**: Each test should be independent
- **Determinism**: Tests should produce consistent results
- **Coverage**: Focus on SDK API surface area
- **Validation**: Cross-check SDK calculations with indexer data

## Implementation Priority

### Phase 1: Critical SDK Functions (Sections 1-4)

1. **Test Infrastructure Setup** - Foundation for all tests
2. **Pool Operations** - Pool creation, metadata, discovery
3. **Liquidity Management** - Add/remove liquidity, LP tokens
4. **Swap Operations** - Exact in/out, previews, multi-hop
5. **Position Management** - User positions, P&L tracking

### Phase 2: Supporting Tests (If time permits)

- Basic SDK error handling (invalid inputs, network errors)
- Cache consistency validation
- Performance benchmarks

### Phase 3: Contract-Level (Out of SDK scope)

- Complex error scenarios
- Multi-user concurrency
- Edge cases and boundaries
- MEV and security testing

## Notes

- **Primary Goal**: Validate SDK methods work correctly with real contracts
- **Secondary Goal**: Ensure SDK calculations match on-chain results
- Focus on SDK integration, not smart contract testing
- Most error/edge cases should be tested at contract level
- CI/CD integration deferred to later phase

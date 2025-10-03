# SDK V2 Integration Tests

This directory contains comprehensive integration tests for the Mira AMM V2 SDK. These tests run
against a local Fuel node and indexer to validate SDK functionality with real contracts.

## Quick Start

### Run All Integration Tests (Recommended)

```bash
# From the workspace root
pnpm nx test:integration ts-sdk
```

This single command will:

1. 🚀 Start the local Fuel node and indexer
2. ⏳ Wait for services to be ready
3. 🧪 Run all integration tests
4. 🧹 Clean up processes when complete

### Manual Approach

If you prefer to manage services manually:

```bash
# Terminal 1: Start services
pnpm nx dev indexer

# Terminal 2: Run tests (once services are ready)
cd libs/ts-sdk
pnpm test:integration:watch
```

### Run Specific Test Suites

```bash
# Run only pool operations tests
cd libs/ts-sdk
vitest test/integration/pool-operations.integration.test.ts

# Run in watch mode for development
vitest test/integration/**/*.integration.test.ts --watch
```

## Test Structure

### Core Test Suites (Priority 1 - SDK Critical)

- ✅ **Pool Operations** (`pool-operations.integration.test.ts`)
  - Pool creation with different configurations
  - Metadata retrieval and validation
  - Pool discovery and ID generation
- 🚧 **Liquidity Management** (`liquidity-management.integration.test.ts`)
  - Add/remove liquidity with various distributions
  - LP token tracking and balance verification
- ⏳ **Swap Operations** (`swap-operations.integration.test.ts`)
  - Exact input/output swaps
  - Multi-hop swaps and slippage protection
- ⏳ **Position Management** (`position-management.integration.test.ts`)
  - User position tracking and P&L calculations

### Test Infrastructure (`setup/`)

- **`test-environment.ts`** - Service lifecycle and provider management
- **`token-factory.ts`** - Token minting and balance utilities
- **`pool-factory.ts`** - Pool creation with various configurations

## Test Environment

### Services

- **Fuel Node**: `http://localhost:4000/v1/graphql`
- **Indexer**: `http://localhost:4350/graphql`

### Test Data

- **Contract IDs**: Loaded from `apps/indexer/mira-binned-liquidity-api/contract-ids.json`
- **Test Tokens**: USDC, FUEL, ETH, mBTC, USDT (from verified-assets.json)
- **Default Wallet**: Pre-funded with test tokens

### Test Features

- ✅ Automatic service health checks
- ✅ Token minting and balance management
- ✅ Pool creation with standard configurations
- ✅ Indexer synchronization verification
- ✅ Transaction monitoring and validation

## Development

### Adding New Tests

1. Create a new test file in `test/integration/`
2. Use the existing setup utilities from `setup/`
3. Follow the established patterns in existing tests
4. Update the test plan in `SDK_V2_INTEGRATION_TEST_PLAN.md`

### Test Utilities

```typescript
import {testEnvironment} from "./setup/test-environment";
import {TokenFactory} from "./setup/token-factory";
import {PoolFactory} from "./setup/pool-factory";

// Standard test setup
beforeAll(async () => {
  await testEnvironment.start();
  const wallet = testEnvironment.getWallet();
  const contractIds = testEnvironment.getContractIds();

  tokenFactory = new TokenFactory(wallet, contractIds.fungible);
  poolFactory = new PoolFactory(wallet, contractIds.simpleProxy);
});
```

### Debugging

- Set `DEBUG=1` environment variable for verbose logging
- Use `vitest --reporter=verbose` for detailed test output
- Check service logs in the first terminal for contract interaction details

## CI/CD Integration

The integration tests are designed to be CI-friendly:

- Automatic service lifecycle management
- Configurable timeouts and retry logic
- Proper process cleanup on exit
- Exit codes that respect test results

For CI environments, consider:

- Pre-building contracts to reduce startup time
- Using Docker compose for service isolation
- Parallel test execution where appropriate

## Troubleshooting

### Services Won't Start

- Ensure ports 4000 and 4350 are available
- Check that `nx dev indexer` works manually
- Verify contract deployment completed successfully

### Tests Timeout

- Increase timeout values in test files
- Check network connectivity to services
- Verify wallet has sufficient balance for operations

### Token/Contract Issues

- Verify `contract-ids.json` contains valid contract addresses
- Check that verified-assets.json has local_testnet entries
- Ensure fungible contract is deployed and functional

### Getting Help

- Check the main test plan: `SDK_V2_INTEGRATION_TEST_PLAN.md`
- Review existing test patterns in completed test files
- Ensure you're using the latest SDK and contract versions

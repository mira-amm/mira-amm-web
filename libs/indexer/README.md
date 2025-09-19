# Mira Indexer Module

A comprehensive indexer abstraction layer for the Mira AMM application, providing dependency
injection, testing support, and centralized GraphQL query management.

## Overview

The indexer module encapsulates all Subsquid indexer interactions behind clean interfaces, enabling:

- **Dependency Injection**: Use real or mock indexers
- **Testing**: Easy mocking for unit and integration tests
- **Development**: Fast development with mock data
- **Type Safety**: Full TypeScript coverage
- **Centralization**: All GraphQL queries in one place

## Quick Start

### 1. Basic Usage

```tsx
import {IndexerProvider, useAssetPrice, usePoolsData} from "@/indexer";

// Wrap your app
<IndexerProvider>
  <App />
</IndexerProvider>;

// Use in components
function MyComponent() {
  const {data: pools} = usePoolsData({limit: 10});
  const {data: price} = useAssetPrice("asset_eth");

  return <div>Price: {price?.price}</div>;
}
```

### 2. Development with Mock Data

For fast development without network dependencies:

```bash
# Use mock indexer for development
pnpm dev:mock

# Or set environment variable
NEXT_PUBLIC_USE_MOCK_INDEXER=true pnpm nx dev web
```

### 3. Local Development with Local Fuel Network

For development with a local Fuel network and indexer:

**Usage:**

```bash
# Start web application with local development target
pnpm dev:local

# Or run nx target directly
nx dev:local web
```

When `NEXT_PUBLIC_NETWORK_URL` contains `localhost:4000`, the indexer automatically switches to
`http://localhost:4350/graphql`.

The mock indexer provides realistic data including:

- ETH, USDC, FUEL, BTC assets with real-looking prices
- Pool data with reserves and APR calculations
- Transaction history
- Protocol statistics

### 3. Testing Setup

```tsx
import {createMockIndexer} from "@/indexer";

// In tests
const mockIndexer = createMockIndexer(
  "https://test-endpoint",
  {},
  {
    assets: {
      getPrice: jest.fn().mockResolvedValue({price: 100}),
    },
  }
);

<IndexerProvider indexer={mockIndexer}>
  <ComponentUnderTest />
</IndexerProvider>;
```

## Architecture

### Core Interfaces

- **`ISubsquidIndexer`**: Main indexer interface
- **`IPoolIndexer`**: Pool-specific operations
- **`IAssetIndexer`**: Asset-specific operations
- **`IEventIndexer`**: Event/transaction operations
- **`IStatsIndexer`**: Protocol statistics

### Available Hooks

#### Pool Hooks

- `usePoolData(poolId)` - Single pool data
- `usePoolsData(params)` - Paginated pool list
- `usePoolAPR(poolId)` - Pool APR calculation
- `usePoolReserves(poolId)` - Pool reserves
- `useUserPositions(address)` - User positions

#### Asset Hooks

- `useAssetData(assetId)` - Single asset data
- `useAssetPrice(assetId)` - Asset price with auto-refresh
- `useAssetList()` - All assets
- `useAssetListWithPools()` - Assets with pool counts
- `useAssetImage(assetId)` - Asset images/icons

#### Event Hooks

- `useWalletTransactions(address)` - User transaction history
- `useLatestBlock()` - Latest block info
- `useSwaps(poolId)` - Swap events
- `useLiquidityEvents(poolId)` - Add/remove liquidity events

#### Stats Hooks

- `useProtocolStats()` - Protocol-wide statistics
- `useTVL()` - Total value locked
- `useVolume(period)` - Volume data
- `useHistoricalData(params)` - Time series data

## Development Modes

### 1. Production Mode (Default)

Uses real Subsquid GraphQL endpoint for live data.

### 2. Mock Mode

Uses mock data for development. Enabled by:

- `NEXT_PUBLIC_USE_MOCK_INDEXER=true` environment variable
- `forceMock={true}` prop on IndexerProvider
- `NODE_ENV=test` automatically enables mock mode

### 3. Local Development Mode

Uses local Fuel network and indexer. Enabled by:

- `NEXT_PUBLIC_NETWORK_URL=http://localhost:4000/v1/graphql` environment variable
- Automatically uses `http://localhost:4350/graphql` as indexer endpoint
- Run with `pnpm dev:local` script

### 4. Custom Indexer

Inject your own indexer implementation:

```tsx
const customIndexer = new CustomIndexer();

<IndexerProvider indexer={customIndexer}>
  <App />
</IndexerProvider>;
```

## Configuration

### Environment Variables

```bash
# Enable mock indexer (development)
NEXT_PUBLIC_USE_MOCK_INDEXER=true

# Use local Fuel network (auto-detects local indexer)
NEXT_PUBLIC_NETWORK_URL=http://localhost:4000/v1/graphql

# Override Subsquid endpoint (optional)
NEXT_PUBLIC_SUBSQUID_ENDPOINT=https://custom-indexer.com/graphql
```

### IndexerProvider Props

```tsx
interface IndexerProviderProps {
  children: React.ReactNode;
  indexer?: ISubsquidIndexer; // Custom indexer instance
  endpoint?: string; // Custom endpoint URL
  config?: IndexerConfig; // Indexer configuration
  forceMock?: boolean; // Force mock mode
}
```

### IndexerConfig Options

```tsx
interface IndexerConfig {
  headers?: Record<string, string>; // Custom headers
  retryAttempts?: number; // Retry failed requests (default: 3)
  retryDelay?: number; // Delay between retries (default: 1000ms)
  timeout?: number; // Request timeout
  cache?: {
    enabled: boolean;
    ttl?: number;
  };
}
```

## Development Scripts

```bash
# Full development environment
pnpm dev

# Web app only with mock indexer (fast)
pnpm dev:mock

# Web app only with real indexer
pnpm nx dev web

# Build and test
pnpm nx build web
pnpm nx test web
```

## Migration Guide

### Migrating Existing Hooks

Replace direct GraphQL requests:

```tsx
// Before: Direct GraphQL request
const {data} = useQuery({
  queryKey: ["asset", assetId],
  queryFn: () => request({url: SQDIndexerUrl, document: query}),
});

// After: Use indexer hook
const {data} = useAssetData(assetId);
```

### Migration Patterns

1. **Direct Replacement**: Simple hooks → indexer hooks
2. **Data Transformation**: Adapt indexer data to existing formats
3. **Composition**: Combine multiple indexer hooks
4. **Hybrid**: Gradual migration with fallbacks

## Testing

### Unit Tests

```tsx
import {createMockIndexer} from "@/indexer";

const mockIndexer = createMockIndexer();
// Test your components with predictable data
```

### Integration Tests

```tsx
// Test with real indexer against test endpoint
const testIndexer = new SubsquidIndexer("https://test-indexer.com");
```

### E2E Tests

Mock indexer automatically enabled in `NODE_ENV=test`.

## Performance

- **Caching**: Built-in React Query caching
- **Batching**: Batch similar requests automatically
- **Retries**: Exponential backoff for failed requests
- **Stale-while-revalidate**: Background updates

## Contributing

1. Add new queries to `src/queries/`
2. Implement in appropriate indexer class
3. Update interfaces if needed
4. Add corresponding React hooks
5. Update mock implementation
6. Add tests

## Troubleshooting

### Mock Indexer Not Loading

Ensure environment variable is set:

```bash
NEXT_PUBLIC_USE_MOCK_INDEXER=true
```

### GraphQL Errors

Check endpoint configuration and network connectivity.

### Type Errors

Ensure interfaces are updated when adding new methods.

## Examples

See `libs/web/src/hooks/` for migration examples of existing hooks.

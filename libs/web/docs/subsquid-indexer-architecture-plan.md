# Subsquid Indexer Module Architecture Plan

## Overview

This document outlines the plan for extracting all Subsquid indexer functionality into a dedicated,
well-encapsulated module with dependency injection support, similar to the Mira SDK implementation.

## Current State Analysis

### 1. Complete List of SQDIndexerUrl Usage

The constant `SQDIndexerUrl = "https://mira-dex.squids.live/mira-indexer@v3/api/graphql"` is
currently used in:

#### API Routes (5 files)

1. **apps/web/app/api/pair/route.ts**
   - Imports `SQDIndexerUrl` directly
   - Uses `request` from `graphql-request`
   - Fetches pool by ID

2. **apps/web/app/api/events/route.ts**
   - Imports `SQDIndexerUrl` directly
   - Uses `request` from `graphql-request`
   - Fetches swap/join/exit events

3. **apps/web/app/api/latest-block/route.ts**
   - Imports `SQDIndexerUrl` directly
   - Uses `request` from `graphql-request`
   - Gets latest block information

4. **apps/web/app/api/events/route.test.ts**
   - Test file using `SQDIndexerUrl`

5. **apps/web/app/api/pair/route.test.ts**
   - Test file referencing indexer

#### React Hooks (9 files)

1. **libs/web/src/hooks/useAssetList.ts**
   - Direct import of `SQDIndexerUrl`
   - Uses `request, {gql}` from `graphql-request`
   - Fetches asset list

2. **libs/web/src/hooks/useWalletTransactions.ts**
   - Direct import of `SQDIndexerUrl`
   - Uses `{gql, request}` from `graphql-request`
   - Fetches user transaction history

3. **libs/web/src/hooks/usePositions.ts**
   - Direct import of `SQDIndexerUrl`
   - Uses `request, {gql}` from `graphql-request`
   - Fetches user positions

4. **libs/web/src/hooks/useAssetImage.ts**
   - Direct import of `SQDIndexerUrl`
   - Uses `request, {gql}` from `graphql-request`
   - Fetches asset metadata including images

5. **libs/web/src/hooks/get-pools-with-reserve.ts**
   - Direct import of `SQDIndexerUrl`
   - Uses `request, {gql}` from `graphql-request`
   - Fetches pools with reserve data

6. **libs/web/src/hooks/usePoolsData.ts**
   - Direct import of `SQDIndexerUrl`
   - Uses `request, {gql}` from `graphql-request`
   - Fetches paginated pool data

7. **libs/web/src/hooks/useAssetPriceFromIndexer.ts**
   - Direct import of `SQDIndexerUrl`
   - Uses `request, {gql}` from `graphql-request`
   - Fetches asset prices

8. **libs/web/src/hooks/usePoolAPR.ts**
   - Direct import of `SQDIndexerUrl`
   - Uses `request, {gql}` from `graphql-request`
   - Calculates pool APR

9. **libs/web/src/hooks/useBoostedApr.ts**
   - Likely uses indexer indirectly

#### Core Module (2 files)

1. **libs/web/src/core/graphql-client.ts**
   - Central GraphQL client
   - Uses `SQDIndexerUrl` as fallback
   - Provides singleton instance

2. **libs/web/src/utils/constants.ts**
   - Defines `SQDIndexerUrl` constant

### 2. GraphQL Query Patterns Identified

#### Pool Queries

- `GetPoolById` - Single pool by ID
- `PoolsConnection` - Paginated pool list with filters
- `GetPoolsWithReserve` - Pools with reserve data
- Pool snapshots for time-based data

#### Asset Queries

- `GetAssetById` - Single asset with price
- `GetAssets` - Asset list with metadata
- Asset price queries
- Asset image/metadata queries

#### Event/Transaction Queries

- `GetActions` - Swap/join/exit events with block range
- `GetWalletTransactions` - User transaction history
- Latest block queries
- Historical snapshots

#### Statistics Queries

- Protocol TVL
- Volume (24h, 7d, all-time)
- Pool APR calculations
- Fee data

### 3. Current Issues Detailed

1. **Direct URL Usage (14+ locations)**
   - Every hook/route imports `SQDIndexerUrl` directly
   - No centralized configuration management
   - Hard to switch between environments

2. **Scattered GraphQL Queries**
   - Queries defined inline in hooks/routes
   - No query reuse or optimization
   - Difficult to maintain consistency

3. **Type Safety Issues**
   - Some queries use `any` type
   - Inconsistent response typing
   - No runtime validation

4. **Testing Challenges**
   - Direct `graphql-request` imports
   - Hard to mock indexer responses
   - No test utilities

## Proposed Architecture

### 1. Module Structure

```
libs/indexer/
├── src/
│   ├── index.ts                    # Main exports
│   ├── interfaces/
│   │   ├── ISubsquidIndexer.ts    # Main interface
│   │   ├── IPoolIndexer.ts        # Pool-specific operations
│   │   ├── IAssetIndexer.ts       # Asset-specific operations
│   │   ├── IEventIndexer.ts       # Event/transaction operations
│   │   └── IStatsIndexer.ts       # Protocol statistics
│   ├── implementations/
│   │   ├── SubsquidIndexer.ts     # Main implementation
│   │   ├── PoolIndexer.ts         # Pool queries
│   │   ├── AssetIndexer.ts        # Asset queries
│   │   ├── EventIndexer.ts        # Event queries
│   │   └── StatsIndexer.ts        # Statistics queries
│   ├── queries/
│   │   ├── pool.queries.ts        # Pool GraphQL queries
│   │   ├── asset.queries.ts       # Asset GraphQL queries
│   │   ├── event.queries.ts       # Event GraphQL queries
│   │   └── stats.queries.ts       # Stats GraphQL queries
│   ├── types/
│   │   ├── responses.ts           # Response types
│   │   ├── inputs.ts              # Input/parameter types
│   │   └── common.ts              # Shared types
│   ├── providers/
│   │   └── IndexerProvider.tsx    # React context provider
│   ├── hooks/
│   │   ├── useIndexer.ts          # Main hook
│   │   ├── usePoolData.ts         # Pool data hook
│   │   ├── useAssetData.ts        # Asset data hook
│   │   └── useProtocolStats.ts    # Stats hook
│   └── mock/
│       └── MockIndexer.ts         # Mock implementation for testing
```

### 2. Core Interfaces

#### ISubsquidIndexer (Main Interface)

```typescript
interface ISubsquidIndexer {
  // Sub-indexers
  pools: IPoolIndexer;
  assets: IAssetIndexer;
  events: IEventIndexer;
  stats: IStatsIndexer;

  // Configuration
  readonly endpoint: string;

  // Core query method
  query<T>(query: string, variables?: Record<string, any>): Promise<T>;
}
```

#### IPoolIndexer

```typescript
interface IPoolIndexer {
  getById(id: string): Promise<Pool>;
  list(params: PoolListParams): Promise<PoolListResponse>;
  getReserves(id: string): Promise<PoolReserves>;
  getSnapshots(id: string, from: number): Promise<PoolSnapshot[]>;
  search(query: string): Promise<Pool[]>;
  getWithReserves(): Promise<PoolWithReserve[]>;
  getAPR(poolId: string): Promise<number>;
}
```

#### IAssetIndexer

```typescript
interface IAssetIndexer {
  getById(id: string): Promise<Asset>;
  getPrice(id: string): Promise<number>;
  list(): Promise<Asset[]>;
  getMetadata(id: string): Promise<AssetMetadata>;
  getImage(id: string): Promise<string | null>;
  getBatch(ids: string[]): Promise<Asset[]>;
}
```

#### IEventIndexer

```typescript
interface IEventIndexer {
  getEvents(params: EventParams): Promise<Event[]>;
  getTransactions(address: string): Promise<Transaction[]>;
  getLatestBlock(): Promise<BlockInfo>;
  getActions(from: number, to: number): Promise<Action[]>;
  getSwaps(poolId?: string, limit?: number): Promise<SwapEvent[]>;
  getLiquidityEvents(poolId?: string): Promise<LiquidityEvent[]>;
}
```

#### IStatsIndexer

```typescript
interface IStatsIndexer {
  getTVL(): Promise<number>;
  getVolume(period: TimePeriod): Promise<number>;
  getProtocolStats(): Promise<ProtocolStats>;
  getHistoricalData(params: HistoricalParams): Promise<TimeSeriesData>;
  getPoolStats(poolId: string): Promise<PoolStats>;
}
```

### 3. Migration Mapping

| Current Location                         | New Location                       | Interface Method |
| ---------------------------------------- | ---------------------------------- | ---------------- |
| `apps/web/app/api/pair/route.ts`         | `indexer.pools.getById()`          | IPoolIndexer     |
| `apps/web/app/api/events/route.ts`       | `indexer.events.getActions()`      | IEventIndexer    |
| `apps/web/app/api/latest-block/route.ts` | `indexer.events.getLatestBlock()`  | IEventIndexer    |
| `useAssetList` hook                      | `indexer.assets.list()`            | IAssetIndexer    |
| `useWalletTransactions` hook             | `indexer.events.getTransactions()` | IEventIndexer    |
| `usePositions` hook                      | `indexer.pools.getUserPositions()` | IPoolIndexer     |
| `useAssetImage` hook                     | `indexer.assets.getImage()`        | IAssetIndexer    |
| `get-pools-with-reserve`                 | `indexer.pools.getWithReserves()`  | IPoolIndexer     |
| `usePoolsData` hook                      | `indexer.pools.list()`             | IPoolIndexer     |
| `useAssetPriceFromIndexer` hook          | `indexer.assets.getPrice()`        | IAssetIndexer    |
| `usePoolAPR` hook                        | `indexer.pools.getAPR()`           | IPoolIndexer     |
| Protocol stats                           | `indexer.stats.*`                  | IStatsIndexer    |

### 4. Provider Implementation

```typescript
interface IndexerProviderProps {
  children: React.ReactNode;
  indexer?: ISubsquidIndexer;
  endpoint?: string;
  config?: IndexerConfig;
}

export function IndexerProvider({
  children,
  indexer: injectedIndexer,
  endpoint = SQDIndexerUrl,
  config
}: IndexerProviderProps) {
  const indexerInstance = useMemo(() => {
    if (injectedIndexer) return injectedIndexer;

    return new SubsquidIndexer(endpoint, config);
  }, [injectedIndexer, endpoint, config]);

  return (
    <IndexerContext.Provider value={indexerInstance}>
      {children}
    </IndexerContext.Provider>
  );
}
```

### 5. Migration Strategy

#### Phase 1: Create Module Structure (Week 1)

1. Set up new `libs/indexer` package
2. Define all interfaces based on current usage
3. Create type definitions from existing types
4. Implement mock indexer for testing

#### Phase 2: Implement Core Functionality (Week 2)

1. Implement SubsquidIndexer class
2. Port all existing GraphQL queries:
   - Pool queries (6 unique queries)
   - Asset queries (4 unique queries)
   - Event queries (3 unique queries)
   - Stats queries (3 unique queries)
3. Add proper error handling
4. Implement caching strategy

#### Phase 3: Create React Integration (Week 3)

1. Build IndexerProvider component
2. Create replacement hooks:
   - `useIndexer` - Main hook
   - `usePoolData` - Replaces `usePoolsData`
   - `useAssetData` - Replaces `useAssetList`, `useAssetImage`
   - `useTransactions` - Replaces `useWalletTransactions`
   - `useProtocolStats` - New consolidated stats hook
3. Add React Query integration
4. Implement optimistic updates

#### Phase 4: Gradual Migration (Week 4-5)

1. **API Routes Migration**:
   - Update `/api/pair/route.ts`
   - Update `/api/events/route.ts`
   - Update `/api/latest-block/route.ts`

2. **Hooks Migration** (in order of complexity):
   - Simple price/image hooks first
   - Complex transaction/position hooks
   - Keep backward compatibility temporarily

3. **Component Updates**:
   - Update components to use new hooks
   - Test each component thoroughly

#### Phase 5: Cleanup (Week 6)

1. Remove old GraphQL client
2. Delete redundant queries
3. Remove `SQDIndexerUrl` imports
4. Update documentation
5. Remove deprecated code

### 6. Key Features

#### Dependency Injection

```typescript
// Test environment
const mockIndexer = new MockIndexer();
<IndexerProvider indexer={mockIndexer}>

// Production with custom endpoint
<IndexerProvider endpoint={CUSTOM_ENDPOINT}>

// Default production
<IndexerProvider>
```

#### Type Safety

- Full TypeScript support
- Zod schemas for runtime validation
- Auto-generated types from GraphQL schema

#### Error Handling

```typescript
class SubsquidIndexer {
  async query<T>(query: string, variables?: any): Promise<T> {
    try {
      return await this.client.request<T>(query, variables);
    } catch (error) {
      // Centralized error handling
      this.handleError(error);
    }
  }
}
```

#### Performance

- Request batching with DataLoader
- Built-in caching with React Query
- Automatic retry with exponential backoff
- Pagination support

### 7. Testing Strategy

```typescript
// Mock implementation
class MockIndexer implements ISubsquidIndexer {
  pools = new MockPoolIndexer();
  assets = new MockAssetIndexer();
  // ... etc
}

// Test utility
export function createMockIndexer(overrides?: Partial<ISubsquidIndexer>) {
  return new MockIndexer(overrides);
}

// Usage in tests
const mockIndexer = createMockIndexer({
  pools: {
    getById: jest.fn().mockResolvedValue(mockPool),
  },
});
```

### 8. Benefits

1. **Centralization**: All 14+ direct imports reduced to 1 provider
2. **Testability**: Easy mocking with dependency injection
3. **Flexibility**: Support multiple indexer backends
4. **Type Safety**: Full TypeScript coverage
5. **Performance**: Built-in caching and optimization
6. **Developer Experience**: Clean API, no more inline queries
7. **Maintainability**: All queries in one place
8. **Environment Management**: Easy to switch endpoints

### 9. Implementation Checklist

- [ ] Create `libs/indexer` package structure
- [ ] Define interfaces for all indexer operations
- [ ] Port existing types to new module
- [ ] Implement core SubsquidIndexer class
- [ ] Migrate all GraphQL queries (16 unique queries)
- [ ] Create IndexerProvider component
- [ ] Implement replacement hooks
- [ ] Create mock implementation
- [ ] Write migration guide
- [ ] Update API routes (3 routes)
- [ ] Update React hooks (9 hooks)
- [ ] Remove old dependencies
- [ ] Update documentation
- [ ] Performance testing
- [ ] Final cleanup

### 10. Success Metrics

- Zero direct `SQDIndexerUrl` imports outside indexer module
- All `graphql-request` imports contained in indexer module
- 100% type coverage for indexer operations
- Reduced bundle size through better code organization
- Improved test coverage with mock indexer
- Faster development through better DX

### 11. Risk Mitigation

- **Breaking Changes**: Provide compatibility layer during migration
- **Performance**: Monitor bundle size and query performance
- **Testing**: Extensive testing at each migration phase
- **Rollback Plan**: Keep old implementation available temporarily
- **Documentation**: Comprehensive migration guide for team

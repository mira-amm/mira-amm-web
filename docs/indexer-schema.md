# Indexer Schema ERD

This document provides an Entity Relationship Diagram for the GraphQL schema used in the Mira AMM
indexer.

```mermaid
erDiagram
    Asset {
        ID id PK
        String contractId
        String subId
        String name
        String symbol
        Int decimals
        BigInt supply
        String l1Address
        String image
        Int numPools
        BigInt tradeVolume
        String tradeVolumeDecimal
        String price
    }

    Pool {
        ID id PK
        ID asset0 FK
        ID asset1 FK
        Boolean isStable
        ID lpToken FK
        BigInt reserve0
        BigInt reserve1
        String reserve0Decimal
        String reserve1Decimal
        Float tvlUSD
        String price0
        String price1
        BigInt volumeAsset0
        BigInt volumeAsset1
        String volumeAsset0Decimal
        String volumeAsset1Decimal
        Float volumeUSD
        String feesUSD
        Int creationBlock
        Int creationTime
        String creationTx
    }

    Action {
        ID id PK
        Int blockNumber
        Int timestamp
        String transaction
        Type type
        ID pool FK
        String recipient
        ID asset0 FK
        ID asset1 FK
        BigInt amount0In
        BigInt amount1In
        BigInt amount0Out
        BigInt amount1Out
        BigInt reserves0Before
        BigInt reserves1Before
        BigInt reserves0After
        BigInt reserves1After
    }

    PoolHourlySnapshot {
        ID id PK
        ID pool FK
        Int timestamp
        BigInt reserve0
        BigInt reserve1
        String reserve0Decimal
        String reserve1Decimal
        Float tvlUSD
        BigInt volumeAsset0
        BigInt volumeAsset1
        String volumeAsset0Decimal
        String volumeAsset1Decimal
        Float volumeUSD
        String feesUSD
        String price0
        String price1
    }

    Pool ||--o{ PoolHourlySnapshot : "has snapshots"
    Pool }o--|| Asset : "asset0"
    Pool }o--|| Asset : "asset1"
    Pool }o--|| Asset : "lpToken"
    Action }o--|| Pool : "involves"
    Action }o--|| Asset : "asset0"
    Action }o--|| Asset : "asset1"
```

## Entity Descriptions

### Asset

Represents a tradeable asset/token in the system with metadata like name, symbol, decimals, and
trading statistics.

### Pool

Represents a liquidity pool containing two assets, tracking reserves, volumes, fees, and pricing
information.

### Action

Records all pool interactions including swaps, liquidity additions, and removals with before/after
state.

### PoolHourlySnapshot

Time-series data capturing pool state at hourly intervals for historical analysis.

## Relationships

- **Pool → Asset**: Each pool references three assets (asset0, asset1, and lpToken)
- **Pool → PoolHourlySnapshot**: One-to-many relationship for historical snapshots
- **Action → Pool**: Each action is associated with a specific pool
- **Action → Asset**: Each action involves two assets

## Action Types

The `Type` enum defines three types of pool actions:

- `ADD_LIQUIDITY`: Adding liquidity to a pool
- `REMOVE_LIQUIDITY`: Removing liquidity from a pool
- `SWAP`: Token swap transaction

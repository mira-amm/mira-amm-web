# Sequence Diagrams

## Overview

This document contains detailed sequence diagrams for all major user flows in the Mira AMM platform.

> Note: With the addition of binned liquidity contracts we now have two sets of SDKs and Contracts.
> For liquidity operations, the version used is determined by the pool type and the user selection.
> For swaps, routing is done in the SDK. WE DO NOT CURRENTLY SUPPORT CROSS CONTRACT SWAPS (I.e. V1 +
> V2 liquidity for a single atomic swap)

## 1. Swap Assets

```mermaid
sequenceDiagram
    participant Trader
    participant WebApp
    participant SDK
    participant Subsquid as Subsquid Indexer
    participant V1 as V1 Contracts
    participant V2 as V2 Contracts
    participant Fuel as Fuel Network

    Trader->>WebApp: Navigate to swap page
    WebApp->>WebApp: Connect wallet (fuel-connectors)

    Trader->>WebApp: Select source asset
    Trader->>WebApp: Select target asset
    Trader->>WebApp: Enter amount

    WebApp->>Subsquid: Query available pools
    Subsquid-->>WebApp: Return pool data

    WebApp->>SDK: Request swap quote
    SDK->>SDK: Calculate routes across V1 & V2
    SDK->>SDK: Find optimal path
    SDK-->>WebApp: Return quote & route details

    WebApp-->>Trader: Display quote, rate, fees

    Trader->>WebApp: Confirm swap
    WebApp->>SDK: Execute swap transaction

    alt V1 Pool Route
        SDK->>V1: Call swap function
        V1->>Fuel: Execute transaction
    else V2 Pool Route
        SDK->>V2: Call swap function
        V2->>Fuel: Execute transaction
    end

    Fuel-->>SDK: Transaction result
    SDK-->>WebApp: Swap confirmation
    WebApp-->>Trader: Show success & tx details
```

## 2. Deposit Liquidity

```mermaid
sequenceDiagram
    participant LP as Liquidity Provider
    participant WebApp
    participant SDK
    participant Subsquid as Subsquid Indexer
    participant Contracts
    participant Fuel as Fuel Network

    LP->>WebApp: Navigate to pools page
    WebApp->>Subsquid: Fetch all pools
    Subsquid-->>WebApp: Return pool list
    WebApp-->>LP: Display available pools

    LP->>WebApp: Select pool to add liquidity
    WebApp->>Subsquid: Get pool details
    Subsquid-->>WebApp: Pool data (TVL, APR, etc)

    LP->>WebApp: Click "Add Liquidity"
    WebApp-->>LP: Show liquidity form

    LP->>WebApp: V1: Enter token amounts, V2: token amounts bin distribution, and slippage
    WebApp->>SDK: Calculate LP tokens
    SDK-->>WebApp: Expected LP tokens & share

    LP->>WebApp: Confirm deposit
    WebApp->>SDK: Prepare deposit transaction

    alt V1 Pool (Broad/Stable)
        SDK->>Contracts: Call addLiquidity
        Note over SDK,Contracts: Standard liquidity provision
    else V2 Pool (Concentrated)
        LP->>WebApp: Set price range
        SDK->>Contracts: Call mint with range
        Note over SDK,Contracts: Concentrated liquidity with ticks
    end

    Contracts->>Fuel: Execute transaction
    Fuel-->>Contracts: Transaction result
    Contracts-->>SDK: LP tokens minted
    SDK-->>WebApp: Deposit confirmation
    WebApp-->>LP: Show LP position details
```

## 3. Create New Pool

```mermaid
sequenceDiagram
    participant LP as Liquidity Provider
    participant WebApp
    participant SDK
    participant Factory as Factory Contract
    participant Fuel as Fuel Network

    LP->>WebApp: Navigate to "Create Pool"
    WebApp-->>LP: Show pool creation form

    LP->>WebApp: Select token pair
    WebApp->>SDK: Validate token compatibility
    SDK-->>WebApp: Validation result

    LP->>WebApp: Choose pool type

    alt Concentrated Pool (V2)
        LP->>WebApp: Set bin step
        LP->>WebApp: Set initial price
        LP->>WebApp: Choose price range
    else Stable Pool (V1)
        LP->>WebApp: Confirm stable pair
        LP->>WebApp: Set amplification
    else Volatile Pool (V1)
        LP->>WebApp: Confirm standard AMM
    end

    LP->>WebApp: Set trading fee
    LP->>WebApp: Input initial liquidity amounts

    WebApp->>SDK: Validate all parameters
    SDK-->>WebApp: Show creation preview

    LP->>WebApp: Confirm pool creation
    WebApp->>SDK: Create pool transaction

    SDK->>Factory: Call createPool function
    Factory->>Factory: Deploy new pool contract
    Factory->>Fuel: Execute deployment
    Fuel-->>Factory: Pool deployed
    Factory-->>SDK: Pool address

    SDK->>SDK: Add initial liquidity
    SDK-->>WebApp: Pool created successfully
    WebApp-->>LP: Redirect to pool page
```

## 4. Remove Liquidity

```mermaid
sequenceDiagram
    participant LP as Liquidity Provider
    participant WebApp
    participant SDK
    participant Subsquid as Subsquid Indexer
    participant Pool as Pool Contract
    participant Fuel as Fuel Network

    LP->>WebApp: Navigate to portfolio
    WebApp->>Subsquid: Query user positions
    Subsquid-->>WebApp: LP positions data
    WebApp-->>LP: Display positions

    LP->>WebApp: Select position to remove
    WebApp->>SDK: Get position details
    SDK-->>WebApp: Current value & fees earned

    LP->>WebApp: Enter removal amount (%)
    WebApp->>SDK: Calculate output amounts
    SDK-->>WebApp: Expected tokens out

    LP->>WebApp: Confirm removal
    WebApp->>SDK: Prepare removal transaction

    alt Full Removal
        SDK->>Pool: Call removeLiquidity(100%)
        Pool->>Pool: Burn all LP tokens
        Pool->>Pool: Collect all fees
    else Partial Removal
        SDK->>Pool: Call removeLiquidity(X%)
        Pool->>Pool: Burn proportional LP tokens
        Pool->>Pool: Collect proportional fees
    end

    Pool->>Fuel: Execute transaction
    Fuel-->>Pool: Transaction result
    Pool-->>SDK: Tokens transferred
    SDK-->>WebApp: Removal confirmation
    WebApp-->>LP: Show received amounts
```

## 5. Check Points Status

```mermaid
sequenceDiagram
    participant LP as Liquidity Provider
    participant WebApp
    participant ServerlessFunc as Serverless Functions
    participant Sentio as Sentio Indexer

    LP->>WebApp: Navigate to Points/Rewards
    WebApp->>ServerlessFunc: Request user points (account  address)

    ServerlessFunc->>Sentio: Query user activity
    Sentio-->>ServerlessFunc: Historical data

    ServerlessFunc->>ServerlessFunc: Calculate points
    ServerlessFunc->>ServerlessFunc: Determine tier
    ServerlessFunc-->>WebApp: Points & tier data

    WebApp-->>LP: Display points balance
    WebApp-->>LP: Show current tier
    WebApp-->>LP: Show progress to next tier

    LP->>WebApp: View points history
    WebApp->>ServerlessFunc: Request detailed history
    ServerlessFunc->>Sentio: Get transaction history
    Sentio-->>ServerlessFunc: Detailed records
    ServerlessFunc-->>WebApp: Formatted history
    WebApp-->>LP: Display points timeline
```

## 6. Check Liquidity Status

```mermaid
sequenceDiagram
    participant LP as Liquidity Provider
    participant WebApp
    participant Subsquid as Subsquid Indexer
    participant SDK

    LP->>WebApp: Navigate to portfolio
    WebApp->>Subsquid: Query user positions
    Subsquid-->>WebApp: All LP positions

    loop For each position
        WebApp->>SDK: Calculate current value
        SDK->>SDK: Get pool reserves
        SDK->>SDK: Calculate LP token value
        SDK-->>WebApp: Position value

        WebApp->>SDK: Calculate fees earned
        SDK-->>WebApp: Accumulated fees

        WebApp->>SDK: Calculate IL
        SDK->>SDK: Compare vs HODL
        SDK-->>WebApp: IL percentage
    end

    WebApp->>WebApp: Aggregate totals
    WebApp-->>LP: Display portfolio summary
    WebApp-->>LP: Show individual positions
    WebApp-->>LP: Display total P&L

    LP->>WebApp: Click specific position
    WebApp-->>LP: Detailed position view
    WebApp-->>LP: Historical performance
    WebApp-->>LP: Fee earnings over time
```

## 7. View Pool List

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant Subsquid as Subsquid Indexer

    User->>WebApp: Navigate to Pools page

    WebApp->>Subsquid: Query all pools
    Note over WebApp,Subsquid: Request includes filters
    Subsquid-->>WebApp: Pool data array

    WebApp->>WebApp: Process pool data
    Note over WebApp: Calculate APRs, sort by TVL

    WebApp-->>User: Display pool list
    Note over WebApp,User: Shows TVL, Volume, APR

    User->>WebApp: Apply filters
    Note over User,WebApp: Token type, fee tier, pool type
    WebApp->>WebApp: Filter client-side
    WebApp-->>User: Updated pool list

    User->>WebApp: Sort by column
    WebApp->>WebApp: Re-sort data
    WebApp-->>User: Sorted pool list

    User->>WebApp: Search for token
    WebApp->>WebApp: Filter by token symbol
    WebApp-->>User: Matching pools
```

## 8. View Pool Details

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant Subsquid as Subsquid Indexer
    participant SDK

    User->>WebApp: Click on pool
    WebApp->>Subsquid: Query pool details
    Subsquid-->>WebApp: Pool metadata

    WebApp->>Subsquid: Query pool analytics
    Subsquid-->>WebApp: Historical data

    WebApp->>SDK: Get real-time data
    SDK->>SDK: Query contracts
    SDK-->>WebApp: Current reserves & price

    WebApp-->>User: Display pool info
    Note over WebApp,User: Price, TVL, Volume, Fees

    WebApp-->>User: Show Volume, TVL, and Reserve balances
    WebApp-->>User: If V2, show bin distribution


    User->>WebApp: View my liquidity
    WebApp->>Subsquid: Query user position
    Subsquid-->>WebApp: Position data
    WebApp-->>User: Show user's share
    WebApp-->>User: If V2, show user's bin distribution

```

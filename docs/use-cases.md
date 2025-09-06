# Use Case Diagrams

## Overview
This document contains use case diagrams for the Mira AMM platform, derived from the architecture brief.

## Trader Use Cases

```mermaid
graph TD
    Trader[Trader]
    
    UC1[Swap Assets]
    
    Trader --> UC1
    
    subgraph "Swap Assets Details"
        UC1 --> SelectAssets[Select Source & Target Assets]
        SelectAssets --> FindOptimalRoute[Find Optimal Route]
        FindOptimalRoute --> ExecuteSwap[Execute Swap]
        ExecuteSwap --> ReceiveAssets[Receive Target Assets]
    end
```

## Liquidity Provider Use Cases

```mermaid
graph TD
    LP[Liquidity Provider]
    
    UC3[Deposit Liquidity]
    UC4[Create New Pool]
    UC5[Remove Liquidity]
    UC6[Check Points Status]
    UC7[Check Liquidity Status]
    UC8[View Pool List]
    UC9[View Pool Details]
    
    LP --> UC3
    LP --> UC4
    LP --> UC5
    LP --> UC6
    LP --> UC7
    LP --> UC8
    LP --> UC9
    
    subgraph "Create Pool Details"
        UC4 --> SelectPair[Select Asset Pair]
        SelectPair --> SetFee[Set Trading Fee]
        SetFee --> ChooseType[Choose Pool Type]
        ChooseType --> PoolTypes{Pool Types}
        PoolTypes --> Concentrated[Concentrated]
        PoolTypes --> Stable[Stable]
        PoolTypes --> Volatile[Volatile]
    end
    
    subgraph "Liquidity Management"
        UC3 --> AddToPool[Add to Existing Pool]
        UC3 --> EarnFees[Earn Trading Fees]
        UC5 --> WithdrawAssets[Withdraw Assets]
        UC5 --> CollectFees[Collect Trading Fees]
    end
    
    subgraph "Monitoring"
        UC6 --> ViewPoints[View Points Balance]
        UC6 --> CheckTier[Check Program Tier]
        UC7 --> ViewPositions[View Current Positions]
        UC7 --> CheckReturns[Check Returns]
    end
```

## System Components Interaction

```mermaid
graph LR
    subgraph "Frontend"
        WebApp[Web App<br/>NextJS/Vercel]
    end
    
    subgraph "SDK Layer"
        SDK[SDK<br/>v1 & v2]
    end
    
    subgraph "Backend Infrastructure"
        Indexer1[Subsquid<br/>Pool Data]
        Indexer2[Sentio<br/>Points Program]
        ServerlessFunc[Serverless Functions<br/>Points Program]
    end
    
    subgraph "Smart Contracts"
        V1[MiraV1<br/>Broad/Stable]
        V2[V2 Contracts<br/>Concentrated]
    end
    
    subgraph "Blockchain"
        Fuel[Fuel Network]
    end
    
    WebApp --> SDK
    SDK --> V1
    SDK --> V2
    WebApp --> Indexer1
    WebApp --> ServerlessFunc
    ServerlessFunc --> Indexer2
    V1 --> Fuel
    V2 --> Fuel
    Indexer1 --> Fuel
    Indexer2 --> Fuel
```

## Detailed Use Case: Swap Assets

```mermaid
sequenceDiagram
    participant Trader
    participant WebApp
    participant SDK
    participant Contracts
    participant Fuel
    
    Trader->>WebApp: Select source & target assets
    WebApp->>SDK: Request swap quote
    SDK->>Contracts: Query pools & routes
    Contracts-->>SDK: Return available routes
    SDK->>SDK: Calculate optimal route
    SDK-->>WebApp: Return quote & route
    WebApp-->>Trader: Display swap details
    Trader->>WebApp: Confirm swap
    WebApp->>SDK: Execute swap
    SDK->>Contracts: Submit swap transaction
    Contracts->>Fuel: Execute on-chain
    Fuel-->>Contracts: Transaction result
    Contracts-->>SDK: Swap confirmation
    SDK-->>WebApp: Transaction complete
    WebApp-->>Trader: Show success & receipt
```

## Detailed Use Case: Create New Pool

```mermaid
sequenceDiagram
    participant LP as Liquidity Provider
    participant WebApp
    participant SDK
    participant Contracts
    
    LP->>WebApp: Navigate to Create Pool
    WebApp->>LP: Show pool creation form
    LP->>WebApp: Select asset pair
    LP->>WebApp: Set trading fee
    LP->>WebApp: Choose pool type
    
    alt Concentrated Pool
        LP->>WebApp: Set bin step spacing
    else Stable Pool
        LP->>WebApp: Confirm stable pair
    else Volatile Pool
        LP->>WebApp: Confirm standard AMM
    end
    
    LP->>WebApp: Input initial liquidity
    WebApp->>SDK: Validate pool parameters
    SDK-->>WebApp: Validation result
    LP->>WebApp: Confirm creation
    WebApp->>SDK: Create pool transaction
    SDK->>Contracts: Deploy new pool
    Contracts-->>SDK: Pool address
    SDK-->>WebApp: Pool created
    WebApp-->>LP: Show pool details
```
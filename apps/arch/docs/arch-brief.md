## Microchain Architecture Brief

## Actors

- Liquidity Providers
- Traders

## Use Cases

1. Trader swaps from one asset to another, through the optimal route
2. Liquidity providers deposit liquidity in order to receive trading fees
3. Trader participates in an external trading competition and swaps assets on fuel
4. Liquidity Provider creates a new pool to allow for access to different assets

- Selects the assets they want, the trading fee, and the pool type (concentrated, stable, volatile)

5. Liquidity Provider removes liquidity (and trading fees)
6. Liquidity Provider checks the status of their points in the points program
7. Liquidity provider checks the status of their liquidity
8. Liquidity provided sees a list of all pools that
9. Liquidity provider sees details about a specific pool

## Overall architecture

### Web App

NextJS app running on Vercel we use tailwind, tanstack query

#### Pages

- Swap
- Pool List
- Pool view
- Add liquidity
- Remove liquidity
- Create Pool

#### Other dependencies

- Auth/Wallet connection through the fuel-connectors

### SDK

Lives in the client, two versions v1, and v2 corresponding with the version of the contracts
Abstracts write and read operations to contracts

#### Other dependencies

- Interacts using the fuels-ts-sdk

### Server infra

Serverless functions (points program only) Nextjs running on vercel Indexer 1: Subsquid (used for
all pool data)

- Directly called from the Frontend Indexer 2: Sentio (used for points program info)

### Contracts

V1 Contracts (MiraV1) for broad spectrum liquidity and stable swaps V2 Contracts (Binned liquidity)
for concentrated liquidity

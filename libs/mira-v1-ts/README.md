# Mira DEX TypeScript SDK

Typescript SDK for [Mira DEX](https://mira.ly/) -
the Decentralized Exchange on [Fuel blockchain](https://fuel.network/).

## Table of contents
1. [Overview](#overview)
2. [Installation](#installation)
3. [Setup](#setup)
4. [Data types](#data_types)
5. [MiraAmm Class](#mira-amm)
6. [ReadonlyMiraAmm Class](#readonly-mira-amm)
7. [Deployments](#deployments)
8. [Contributions](#contributions)

## Overview <a name="overview"></a>

The SDK provides a set of tools to interact with the Mira Decentralized Exchange.
It allows developers to perform actions such as adding/removing liquidity,
swapping tokens, querying liquidity pools, and more.
The SDK is built on top of the `fuels` library and supports both transaction-based and readonly operations.

## Installation <a name="installation"></a>

To use the Mira DEX SDK, you need to have the following dependencies installed:

```bash
npm install fuels
npm install mira-dex-ts
```

## Setup <a name="setup"></a>

To start using the SDK, you need to instantiate the `MiraAmm` or `ReadonlyMiraAmm` classes by providing the appropriate
parameters like `Account` for signing transactions or `Provider` for read-only operations.

### Example Setup

```typescript
import {MiraAmm, ReadonlyMiraAmm} from "mira-dex-ts";
import {Account, Provider} from "fuels";

// For transaction-based operations
const provider = await Provider.create(RPC);
const wallet = new WalletUnlocked(SECRET_KEY, provider);
const miraAmm = new MiraAmm(wallet);

// For readonly operations
const readonlyMiraAmm = new ReadonlyMiraAmm(provider);
```

---

## Data types <a name="data_types"></a>

### PoolId

Identifier of a pool. Consists of two assets and a boolean flag indicating whether the pool is stable.

```typescript
export type PoolId = [AssetId, AssetId, boolean];
```

## MiraAmm Class <a name="mira-amm"></a>

The MiraAmm class is used for building transaction requests to interact with the AMM.

### Methods

#### id

Returns the AMM contract ID.

```typescript
const ammId = miraAmm.id();
```

#### addLiquidity

Adds liquidity to an existing pool.

```typescript
const txRequest = await miraAmm.addLiquidity(
  poolId, amount0Desired, amount1Desired, amount0Min, amount1Min, deadline, txParams
);
```

- `poolId`: ID of the pool.
- `amount0Desired`: Desired amount of token 0.
- `amount1Desired`: Desired amount of token 1.
- `amount0Min`: Minimum amount of token 0.
- `amount1Min`: Minimum amount of token 1.
- `deadline`: Deadline block for the transaction.

The function will add two assets to the pool in the same proportion as the existing reserves in the pool.
Desired and min amounts specify the amount of each asset to add.
The actual amounts would be as close as possible to the desired amounts, not exceeding them and more than the min
amounts.

#### createPoolAndAddLiquidity

Creates a new pool and adds liquidity in a single transaction.

```typescript
const txRequest = await miraAmm.createPoolAndAddLiquidity(
  token0Contract, token0SubId, token1Contract, token1SubId, isStable, amount0Desired, amount1Desired, deadline, txParams
);
```

- `token0Contract`, `token1Contract`: Contract addresses for the tokens.
- `token0SubId`, `token1SubId`: Sub ids of the tokens within the context of provided contracts.
- `isStable`: Whether the pool is stable or volatile.
- `amount0Desired`, `amount1Desired`: Desired amounts of token 0 and token 1.
- `deadline`: Deadline block for the transaction.

The same as `addLiquidity` but creates a new pool.
The pool is created with the provided tokens and the desired amounts.
The function will throw an error if the pool already exists.

#### removeLiquidity

Removes liquidity from a pool.

```typescript
const txRequest = await miraAmm.removeLiquidity(
  poolId, liquidity, amount0Min, amount1Min, deadline, txParams
);
```

- `poolId`: ID of the pool.
- `liquidity`: Number of LP tokens to exchange for liquidity.
- `amount0Min`, `amount1Min`: Minimum numbers of tokens to receive from the pool.
- `deadline`: Deadline block for the transaction.

Exchanges LP tokens for the underlying assets.
The LP tokens are burned, and the assets are transferred to the user.

#### swapExactInput

Performs a swap where the exact input amount is known.

```typescript
const txRequest = await miraAmm.swapExactInput(
  amountIn, assetIn, amountOutMin, pools, deadline, txParams
);
```

- `amountIn`: Number of input tokens.
- `assetIn`: Asset ID of the input token.
- `amountOutMin`: Minimum number of output tokens.
- `pools`: List of pools to route the swap.
- `deadline`: Deadline block for the transaction.

Performs the swap specifying the exact number of input tokens. Supports multi-hop swaps if several pools are provided.

#### swapExactOutput

Performs a swap where the exact output amount is known.

```typescript
const txRequest = await miraAmm.swapExactOutput(
  amountOut, assetOut, amountInMax, pools, deadline, txParams
);
```

- `amountOut`: Desired output amount.
- `assetOut`: Asset ID of the output token.
- `amountInMax`: Maximum number of input tokens.
- `pools`: List of pools to route the swap.
- `deadline`: Deadline block for the transaction.

Performs the swap specifying the exact number of output tokens. Supports multi-hop swaps if several pools are provided.

## ReadonlyMiraAmm Class <a name="readonly-mira-amm"></a>

The `ReadonlyMiraAmm` class is used for reading information from the AMM.

---

### Methods

#### id

Returns the AMM contract ID.

```typescript
const ammId = readonlyMiraAmm.id();
```

#### ammMetadata

Fetches metadata for the AMM contract, including fees and owner details.

```typescript
const metadata = await readonlyMiraAmm.ammMetadata();
```

#### poolMetadata

Fetches metadata for a specific pool.

```typescript
const poolData = await readonlyMiraAmm.poolMetadata(poolId);
```

- `poolId`: ID of the pool.

#### lpAssetInfo

Fetches LP token asset info such as name, symbol, and total supply.

```typescript
const lpInfo = await readonlyMiraAmm.lpAssetInfo(assetId);
```

#### totalAssets

Returns the total number of LP tokens created within the AMM.
This number equals to the number of creates pools.

```typescript
const totalAssets = await readonlyMiraAmm.totalAssets();
```

#### getLiquidityPosition

Fetches the position corresponding to the number of LP tokens for a specific pool.

```typescript
const liquidityPosition = await readonlyMiraAmm.getLiquidityPosition(poolId, lpTokensAmount);
```

- `poolId`: ID of the pool.
- `lpTokensAmount`: Number of LP tokens.

#### getOtherTokenToAddLiquidity

Calculates the required amount of the second asset in a token pair based on the provided amount of the first asset.
Returns the corresponding amount needed for the second asset to add to the pool. 

```typescript
const assetToAdd = await readonlyMiraAmm.getOtherTokenToAddLiquidity(poolId, amount, isFirstToken);
```

- `poolId`: ID of the pool.
- `isFirstToken`: whether the `amount` corresponds to the first asset in the pool or to the second.
- `amount`: Number of tokens of one of the assets of the pool.

#### previewSwapExactInput

Calculates the output result of a swap operation with the exact input amount routed through the provided pools.

```typescript
const expectedOutputAmount = await readonlyMiraAmm.previewSwapExactInput(assetIdIn, assetAmountIn, pools);
```

- `assetIdIn`: Asset ID of the input token.
- `assetAmountIn`: Number of input tokens.
- `pools`: List of pools to route the swap.

#### previewSwapExactOutput

Calculates the amount of the input token to perform a swap operation routed through the provided pools
to receive the specified output number of tokens.

```typescript
const requiredInputAmount = await readonlyMiraAmm.previewSwapExactOutput(assetIdOut, assetAmountOut, pools);
```

- `assetIdOut`: Asset ID of the output token.
- `assetAmountOut`: Number of output tokens.
- `pools`: List of pools to route the swap.

## Deployments <a name="deployments"></a>

Mainnet contract id: `0x2e40f2b244b98ed6b8204b3de0156c6961f98525c8162f80162fcf53eebd90e7`

Testnet contract id: `0x05e5fa8c29cbc326beac9758634946e74f69b293b7e7d326f1b539f33b8c7f56`

---

## Contributions <a name="contributions"></a>

Contributions are welcome.
Feel free to open a pull request or an issue on the [GitHub repository](https://github.com/mira-amm/mira-v1-ts).

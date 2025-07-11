# mira-v1-core

**Mira Exchange** is an automated market maker (AMM) protocol, enabling peer-to-peer trading and liquidity provision
for [SRC-20](https://github.com/FuelLabs/sway-standards/blob/master/docs/src/src-20-native-asset.md) tokens on the Fuel
blockchain.

The `mira-v1-core` repository contains the core smart contract for the Mira decentralized exchange (DEX), which is built
and operates on the [Fuel blockchain](https://fuel.network/). The core functionality is implemented in a single smart
contract, handling low-level functions for asset swapping and liquidity management. Higher-level interfaces and
convenience functions are available in the [periphery scripts](https://github.com/mira-amm/mira-v1-periphery).

## Overview

Mira facilitates the trading of asset pairs by maintaining liquidity pools with reserves of both assets. The protocol
involves two key participants:

- **Traders:** Users who swap SRC-20 tokens in exchange for another asset.
- **Liquidity Providers (LPs):** Users who deposit liquidity into the pools, earning fees from trades executed against
  their liquidity.

The price of each token pair is determined by the pool's reserves, with the size of the reserves directly influencing
the exchange rate.

## Key Concepts

### Liquidity

Liquidity is the foundation of Mira's AMM protocol. Anyone can create a pool, which represents a pair of tokens and
their liquidity reserves. When a user provides liquidity to a pool, they receive LP tokens, representing their share of
the pool. These LP tokens can be redeemed later for the underlying liquidity, including fees earned from trades.

The incentives for liquidity providers come from the trading fees collected by the protocol. As trading volume
increases, providing liquidity becomes more attractive. Likewise, the larger the pool's liquidity, the more appealing it
is for traders looking to execute swaps.

### Fees

#### Swap Fees

Each swap incurs a small fee, which is distributed proportionally among the liquidity providers of the pool. The fee
structure is designed to increase the liquidity providers’ returns over time, as fees are reinvested back into the pool.
To claim these fees, LPs can burn their LP tokens and withdraw their liquidity, including any accrued fees.

#### Fee Tiers

Mira supports two distinct fee tiers, depending on the type of pool:

- **0.05%** for stable asset pools.
- **0.3%** for volatile asset pools.

These fees are fixed in the deployed version but can be customized during contract deployment.

#### Protocol Fees

Mira has a protocol-level fee that can be enabled by protocol administrators or, in the future, through governance. This
fee cannot exceed 40% of the LP fee and is initially set to 0%.

### Immutability

Once deployed on the Fuel blockchain, the Mira smart contract is immutable. It cannot be upgraded or altered after
deployment, ensuring long-term stability and security.

### Permissionless Access

The Mira protocol is open for anyone to use. There are no restrictions or barriers preventing users from interacting
with the core smart contract on the Fuel blockchain.

Note: Web interfaces for Mira, such as external websites, may introduce additional permission requirements or execute
swaps differently compared to interacting directly with the core smart contract.

### Constant Product Market Maker

The price of two assets in a Mira pool is determined by the reserves ratio within the pool. Mira employs different
formulas for volatile and stable pools to regulate asset prices. These formulas ensure that the product of reserves
cannot decrease after a swap, maintaining market stability.

- **Volatile Pools:** The price is determined by the constant product formula `k = x * y`, where `k` remains constant.
- **Stable Pools:** A more complex formula, `k = x^3 * y + y^3 * x`, is used for assets with relatively stable price
  movements.

## Pool Types

### Volatile Pools

Volatile pools are designed for asset pairs that experience significant price fluctuations. These pools use the constant
product formula, ensuring that price changes follow the curve `k = x * y`, where `k` remains constant.

### Stable Pools

Stable pools are optimized for pairs of assets that are expected to maintain a consistent price relationship (e.g.,
stablecoins). These pools use a modified formula to create a price curve that is less sensitive to reserve imbalances
under normal conditions but reacts more sharply as the reserves approach zero.

## Technical Reference

Mira adheres to the [SRC20](https://github.com/FuelLabs/sway-standards/blob/master/docs/src/src-20-native-asset.md)
standard for LP tokens. It is a singleton contract, meaning that the entire functionality resides in a single
deployment, which tracks the state of all user-created pools. Each pool represents a unique asset pair, identified by:

- **`asset_0` and `asset_1`:** The token IDs, sorted to avoid duplicates.
- **`is_stable`:** A boolean flag indicating whether the pool is stable or volatile.

### Core Functions

- **`mint`:** Adds liquidity to a pool. It verifies that the correct tokens are transferred to the contract, calculates
  the appropriate LP tokens, and issues them to the liquidity provider.

- **`burn`:** Removes liquidity from a pool. It burns the provided LP tokens and calculates the amount of underlying
  assets to return to the liquidity provider.

- **`swap`:** Facilitates token swaps. It transfers the specified assets, checks the reserves to ensure the formula is
  maintained, and executes the swap if the conditions are met. If the formula is violated, the transaction reverts,
  ensuring the pool’s integrity.

**Caution:** These functions are low-level and require a strong understanding of the protocol. Improper use can result
in loss of funds. Users should refer to the [periphery scripts](https://github.com/mira-amm/mira-v1-periphery) for a
safer, higher-level interface.

## Resources

- [Mira Website](https://mira.ly/)
- [Periphery Scripts](https://github.com/mira-amm/mira-v1-periphery)
- [Mira Frontend Sources](https://github.com/mira-amm/mira-amm-web)
- [TypeScript SDK](https://github.com/mira-amm/mira-v1-ts)
- [Rust SDK](https://github.com/mira-amm/mira-v1-rs)

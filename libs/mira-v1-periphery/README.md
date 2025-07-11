# mira-v1-periphery

This repository provides high-level [scripts](https://docs.fuel.network/docs/sway/sway-program-types/scripts/) for interacting with the [Mira Exchange](https://mira.ly/) on the [Fuel blockchain](https://fuel.network/). These scripts enhance and extend the functionality of the lower-level [core contract](https://github.com/mira-amm/mira-v1-core) by offering a more user-friendly interface for contract interaction.

The periphery scripts abstract much of the underlying complexity by handling essential tasks such as asset transfers and function calls. Additionally, they introduce important safety mechanisms, including:

- **Transaction Deadlines:** The ability to set a block number deadline by which the transaction must be completed, preventing transactions from being stuck in the blockchain queue for an extended period.
- **Boundary Checks:** Define minimum/maximum asset amounts to send or receive during a transaction. If these limits are exceeded, the transaction is reverted, ensuring protection from slippage.
- **Arbitrary Recipients:** Transactions can be configured to send output assets to any specified address, rather than requiring them to be sent to the transaction caller’s address.

### Swap Functions

The scripts support various types of swaps, including:

- **Exact Input Swaps:** Allows the user to specify the exact amount of the input asset they wish to spend.
- **Exact Output Swaps:** Allows the user to specify the exact amount of output asset they wish to receive from the transaction.
- **Multi-Hop Swaps:** Enables swapping through multiple liquidity pools in a single transaction. For example, instead of swapping directly in an ETH-USDC pool, a multi-hop swap could route from ETH to USDT, then from USDT to USDC. This can be more efficient or necessary when liquidity for a direct swap is insufficient.

## Resources

- [Mira Website](https://mira.ly/)
- [Core Contract](https://github.com/mira-amm/mira-v1-core)
- [Mira Frontend Sources](https://github.com/mira-amm/mira-amm-web)
- [TypeScript SDK](https://github.com/mira-amm/mira-v1-ts)
- [Rust SDK](https://github.com/mira-amm/mira-v1-rs)

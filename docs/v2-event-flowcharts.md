# V2 Event Processing Flowcharts

This document shows the step-by-step entity modifications required for each V2 concentrated
liquidity event type.

## Event Types Overview

Based on the ABI analysis, V2 supports the following event types:

- **MintLiquidityEvent**: Adding liquidity to specific bins
- **BurnLiquidityEvent**: Removing liquidity from specific bins
- **SwapEvent**: Trading between assets through bins
- **PoolCreatedEvent**: Creating new concentrated liquidity pools
- **BinLiquidityEvent**: Tracking granular bin-level state changes
- **CompositionFeesEvent**: Composition fee collected when adding liquidity

## 1. MintLiquidityEvent

**Event Fields:**

- `sender`: Identity - who initiated the mint
- `to`: Identity - who receives the position NFT
- `pool_id`: u256 - pool identifier
- `lp_token_minted`: AssetId - the NFT position token created

**Entity Modification Flow:**

```mermaid
graph TD
    A[MintLiquidityEvent] --> B[Create Position Entity]
    B --> C[Create Action Entity]
```

**Step-by-step modifications:**

1. **Position Entity Creation:**
   - Create an entity with `lp_token_minted` as primary key (NFT AssetId)
   - Set `pool` = `pool_id` reference and transaction data fields

2. **Action Entity Creation:**
   - Retrieve pool data
   - Set `type` = ADD_LIQUIDITY_V2
   - Set `position` to  Position Entity created in prev. step and fill other fields with transaction data and data from retrieved Pool Entity

## 2. BurnLiquidityEvent

**Event Fields:**

- `sender`: Identity - who initiated the burn
- `to`: Identity - who receives the withdrawn assets
- `pool_id`: u256 - pool identifier
- `lp_token_burned`: AssetId - the NFT position token burned

**Step-by-step modifications:**

1. **Position Entity Management:**
   - Delete Position entity identified by `lp_token_burned`

## 3. SwapEvent

**Event Fields:**

- `sender`: Identity - who initiated the swap
- `to`: Identity - who receives the output tokens
- `pool_id`: u256 - pool identifier
- `bin_id`: u32 - the specific bin where swap occurred
- `amounts_in`: Amounts - input amounts
- `amounts_out`: Amounts - output amounts
- `total_fees`: Amounts - total fees paid
- `protocol_fees`: Amounts - protocol portion of fees

**Entity Modification Flow:**

```mermaid
graph TD
    A[SwapEvent] --> B[Update Pool Entity reserves & volume]
    B --> C[Update Pool price based on active bin]
    C --> D[Update Bin Entity]
    D --> E[Update BinPosition entities with fee shares]
    E --> F[Update protocol fee tracking]
    F --> G[Create Action Entity]
    G --> H[Update PoolHourlySnapshot]
```

**Step-by-step modifications:**

1. **Pool Entity Updates:**
   - Update `reserve0`, `reserve1` based on net amounts
   - Add to `volumeAsset0`, `volumeAsset1`, `volumeUSD`
   - Add to `feesUSD`
   - Update `price0`, `price1` from new bin price

3. **Action Entity Creation:**
   - Set `type` = SWAP
   - Record input/output amounts, fees, etc.

4. **Snapshot Updates:**
   - Update PoolHourlySnapshot with volume and fees

## 4. PoolCreatedEvent

**Event Fields:**

- `creator`: Identity - who created the pool
- `pool_id`: u256 - new pool identifier
- `asset_x`: AssetId - first asset in pool
- `asset_y`: AssetId - second asset in pool
- `bin_step`: u16 - price increment between bins
- `active_id`: u32 - initial active bin ID

**Entity Modification Flow:**

```mermaid
graph TD
    A[PoolCreatedEvent] --> B[Create/Update Asset Entities]
    B --> C[Create Pool Entity]
    C --> D[Update Asset numPools counters]
    D --> E[Create initial PoolHourlySnapshot]
```

**Step-by-step modifications:**

1. **Asset Entity Updates:**
   - Create Asset entities for `asset_x`, `asset_y` if not exist
   - Increment `numPools` for both assets

2. **Pool Entity Creation:**
   - Set `id` = `pool_id`
   - Link `asset0`, `asset1` to Asset entities
   - Set `protocolVersion` = "v2"
   - Set `binStep` = bin_step parameter
   - Set `activeId` = active_id
   - Calculate and set `baseFee` from bin_step (baseFee = bin_step \* base_factor)
   - Initialize reserves, prices, volumes to 0
   - Set creation metadata

3. **Snapshot Initialization:**
   - Create initial PoolHourlySnapshot

## 5. BinLiquidityEvent

**Event Fields:**

```rust
/// Asset amounts with explicit X and Y amounts
///
/// This struct represents the amounts of two assets in a pool or bin or fees owed.
/// The x field is the amount of asset X, the y field is the amount of asset Y.
pub struct Amounts {
   x: u64,
   y: u64,
}
/// Event emitted when liquidity distribution changes within a bin
///
/// # Fields
///
/// * `pool_id` - The pool identifier where the bin change occurred
/// * `bin_id` - The specific bin that was modified
/// * `new_reserves` - New reserves in the bin
/// * `new_total_shares` - New total LP shares in the bin
/// * `triggered_by` - The transaction type that caused this change (mint, burn, swap)
/// * `position_id` - Optional position asset (LP token) ID if change is position-specific
pub struct BinLiquidityEvent {
    pub pool_id: PoolId,
    pub bin_id: BinId,
    pub new_reserves: Amounts,
    pub new_total_shares: u256,
    pub triggered_by: BinLiquidityChangeType,
    pub position_id: AssetId,
}

/// Enum representing the type of operation that triggered a bin change
pub enum BinLiquidityChangeType {
    Mint: (),
    Burn: (),
}
```

**Entity Modification Flow:**

```mermaid
graph TD
    A[BinChangeEvent] --> B[Update/Create Bin Entity]
    B --> C[Create/Update BinPosition Entities]
    C --> D[Create/Update BinSnapshot]
```

**Step-by-step modifications:**

1. **Bin Entity Updates:**
   - **Find/Create**: Locate Bin by `pool_id` and `bin_id`, create if doesn't exist
   - **reserveX**: Set to `new_reserves.x` from event
   - **reserveY**: Set to `new_reserves.y` from event
   - **liquidity**: Calculated from reserves and price
   - **totalSupply**: Set to `new_total_shares` from event
   - **price**: Calculate using `basePrice * (1 + binStep/10000)^binId`
   - **isActive**: Set to `true` if `bin_id` equals pool's `activeBinId`
   - **tvlUSD**: Calculate from reserves and token prices
   - **accTokenXPerShare**: Update based on fee distribution
   - **accTokenYPerShare**: Update based on fee distribution
   - **lastUpdateBlock**: Set to current block number
   - **lastUpdateTime**: Set to current timestamp

2. **BinPosition Entity Management:**
   - **Determine Position**: Use `position_id` from event (if provided)
   - **Find/Create BinPosition**: Locate by position and bin IDs
   - **liquidityShares**: Calculate share changes from total supply delta
   - **positionReserveX**: Calculate proportional share of bin's reserveX
   - **positionReserveY**: Calculate proportional share of bin's reserveY
   - **positionReserveXDecimal**: Convert to decimal representation
   - **positionReserveYDecimal**: Convert to decimal representation
   - **feesX**: Update accumulated fees based on `accTokenXPerShare`
   - **feesY**: Update accumulated fees based on `accTokenYPerShare`
   - **positionTvlUSD**: Calculate USD value of position's reserves
   - **lastUpdateBlock**: Set to current block number
   - **lastUpdateTime**: Set to current timestamp
   - **Delete logic**: Remove BinPosition if `triggered_by` = `BinLiquidityChangeType::Burn`

3. **BinSnapshot Creation or Update:**
   - **Find PoolHourlySnapshot**: Get current hourly snapshot for the pool
   - **Create or find existing BinSnapshot**: Link to both bin and pool snapshot
   - **timestamp**: Use pool snapshot timestamp for consistency
   - **reserveX**: Set to updated bin's reserveX
   - **reserveY**: Set to updated bin's reserveY
   - **liquidity**: Set to updated bin's liquidity
   - **totalSupply**: Set to updated bin's totalSupply
   - **price**: Set to bin's calculated price
   - **volumeX**: Calculate from operation type and amounts
   - **volumeY**: Calculate from operation type and amounts
   - **feesX**: Calculate fees generated for this bin
   - **feesY**: Calculate fees generated for this bin

**Use Cases:**

- **Bin State Management**: Track individual bin reserve and share changes
- **Position Tracking**: Manage user position allocations across bins
- **Snapshot Creation**: Maintain historical bin state records

**Critical constraints:**

- Position IDs must match NFT AssetIds exactly
- BinPosition entities track individual user shares in specific bins
- Fee distribution requires updating all BinPosition entities in affected bins
- Snapshots maintain temporal consistency with foreign keys

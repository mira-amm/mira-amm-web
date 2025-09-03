library;

use std::vec::Vec;

// Type definitions for binned liquidity
pub type PoolId = u256;
pub type BinStep = u16;
pub type BinId = u32;

pub struct Amounts {
    pub x: u64,
    pub y: u64,
}

// Pool creation event
pub struct PoolCreatedEvent {
    pub creator: Identity,
    pub pool_id: PoolId,
    pub asset_x: AssetId,
    pub asset_y: AssetId,
    pub bin_step: BinStep,
    pub active_id: BinId,
}

// Swap event - emitted for each bin during a swap
pub struct SwapEvent {
    pub sender: Identity,
    pub to: Identity,
    pub pool_id: PoolId,
    pub bin_id: BinId,
    pub amounts_in: Amounts,
    pub amounts_out: Amounts,
    pub total_fees: Amounts,
    pub protocol_fees: Amounts,
}

// Mint liquidity event
pub struct MintLiquidityEvent {
    pub sender: Identity,
    pub to: Identity,
    pub pool_id: PoolId,
    pub bin_ids: Vec<BinId>,
    pub amounts: Vec<Amounts>,
    pub lp_token_minted: AssetId,
}

// Burn liquidity event
pub struct BurnLiquidityEvent {
    pub sender: Identity,
    pub to: Identity,
    pub pool_id: PoolId,
    pub bin_ids: Vec<BinId>,
    pub amounts_withdrawn: Vec<Amounts>,
    pub lp_token_burned: AssetId,
}

// Protocol fees collection event
pub struct CollectProtocolFeesEvent {
    pub recipient: Identity,
    pub pool_id: PoolId,
    pub amounts: Amounts,
}

// Protocol fees configuration event
pub struct ProtocolFeesSetEvent {
    pub setter: Identity,
    pub old_protocol_fees: Option<u16>,
    pub new_protocol_fees: u16,
}

// Fee recipient configuration event
pub struct FeeRecipientSetEvent {
    pub setter: Identity,
    pub old_recipient: Option<Identity>,
    pub new_recipient: Identity,
}

// Hook configuration event
pub struct HookSetEvent {
    pub setter: Identity,
    pub old_hook: Option<ContractId>,
    pub new_hook: ContractId,
}

// Composition fees event - emitted during liquidity provision
pub struct CompositionFeesEvent {
    pub sender: Identity,
    pub pool_id: PoolId,
    pub bin_id: BinId,
    pub total_fees: Amounts,
    pub protocol_fees: Amounts,
}

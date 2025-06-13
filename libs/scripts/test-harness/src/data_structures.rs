use fuels::prelude::{AssetId, ContractId, WalletUnlocked};

use super::interface::MiraAMM;

pub type PoolId = (AssetId, AssetId);

const AMOUNT_PER_COIN: u64 = 1_000_000;
const COINS_PER_ASSET: u64 = 100;
pub const NUMBER_OF_ASSETS: u64 = 5;

pub struct MiraAMMContract {
    pub id: ContractId,
    pub instance: MiraAMM<WalletUnlocked>,
}

#[derive(Debug)]
pub struct WalletBalances {
    pub asset_a: u64,
    pub asset_b: u64,
    pub liquidity_pool_asset: u64,
}

pub struct WalletAssetConfiguration {
    pub number_of_assets: u64,
    pub coins_per_asset: u64,
    pub amount_per_coin: u64,
}

impl Default for WalletAssetConfiguration {
    fn default() -> Self {
        Self {
            number_of_assets: NUMBER_OF_ASSETS,
            coins_per_asset: COINS_PER_ASSET,
            amount_per_coin: AMOUNT_PER_COIN,
        }
    }
}

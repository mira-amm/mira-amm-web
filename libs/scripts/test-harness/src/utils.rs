use fuels::{
    accounts::{wallet::WalletUnlocked, ViewOnlyAccount},
    types::{AssetId, Bits256, Bytes32, ContractId},
};
use sha2::{Digest, Sha256};

use crate::data_structures::WalletBalances;

pub mod common {
    use super::*;
    use crate::types::PoolId;
    use std::io::Write;
    pub const MINIMUM_LIQUIDITY: u64 = 1000;

    pub async fn pool_assets_balance(
        wallet: &WalletUnlocked,
        pool_id: &PoolId,
        contract_id: ContractId,
    ) -> WalletBalances {
        let asset_a = wallet.get_asset_balance(&pool_id.0).await.unwrap();
        let asset_b = wallet.get_asset_balance(&pool_id.1).await.unwrap();
        let lp_asset = get_lp_asset_id(contract_id, pool_id);
        let liquidity_pool_asset = wallet.get_asset_balance(&lp_asset).await.unwrap();
        WalletBalances {
            asset_a,
            asset_b,
            liquidity_pool_asset,
        }
    }

    pub fn get_lp_asset_id(contract_id: ContractId, pool_id: &PoolId) -> AssetId {
        let sub_id = get_pool_sub_id(pool_id);
        get_contract_asset_id(sub_id, contract_id)
    }

    pub fn get_contract_asset_id(sub_id: Bytes32, contract: ContractId) -> AssetId {
        let mut hasher = Sha256::new();
        hasher.update(*contract);
        hasher.update(*sub_id);
        AssetId::new(*Bytes32::from(<[u8; 32]>::from(hasher.finalize())))
    }

    pub fn get_pool_sub_id(pool_id: &PoolId) -> Bytes32 {
        let mut hasher = Sha256::new();
        hasher.update(*pool_id.0);
        hasher.update(*pool_id.1);
        if pool_id.2 {
            hasher.write(&[1]).unwrap();
        } else {
            hasher.write(&[0]).unwrap();
        }
        Bytes32::from(<[u8; 32]>::from(hasher.finalize()))
    }

    pub fn order_token_ids(pair: (AssetId, AssetId)) -> (AssetId, AssetId) {
        if pair.0 < pair.1 {
            (pair.0, pair.1)
        } else {
            (pair.1, pair.0)
        }
    }

    pub fn order_sub_ids(
        asset_ids: (AssetId, AssetId),
        sub_ids: (Bits256, Bits256),
    ) -> (Bits256, Bits256) {
        if asset_ids.0 < asset_ids.1 {
            (sub_ids.0, sub_ids.1)
        } else {
            (sub_ids.1, sub_ids.0)
        }
    }
}

pub mod mock {
    use fuels::{accounts::wallet::WalletUnlocked, types::ContractId};

    use crate::interface::mock;

    pub async fn deploy_2_mock_tokens(
        wallet: &WalletUnlocked,
        name_0: String,
        symbol_0: String,
        decimals_0: u8,
        name_1: String,
        symbol_1: String,
        decimals_1: u8,
    ) -> ContractId {
        let (token_contract_id, token_contract) = mock::deploy_mock_token_contract(wallet).await;

        mock::add_token(&token_contract, name_0, symbol_0, decimals_0)
            .await
            .tx_id
            .unwrap();
        mock::add_token(&token_contract, name_1, symbol_1, decimals_1)
            .await
            .tx_id
            .unwrap();

        token_contract_id
    }
}

use crate::interface::PoolId;
use fuels::prelude::{Account, AssetId, ContractId, WalletUnlocked};
use fuels::types::input::Input;
use fuels::types::output::Output;
use fuels::types::Bytes32;
use sha2::{Digest, Sha256};
use std::io::Write;

pub async fn get_transaction_inputs_outputs(
    wallet: &WalletUnlocked,
    assets: &Vec<(AssetId, u64)>,
) -> (Vec<Input>, Vec<Output>) {
    let mut inputs: Vec<Input> = vec![];
    let mut outputs: Vec<Output> = Vec::with_capacity(assets.len());

    for (asset, amount) in assets {
        let asset_inputs = wallet
            .get_asset_inputs_for_amount(*asset, *amount, None)
            .await
            .unwrap();
        inputs.extend(asset_inputs);
        outputs.push(Output::Change {
            asset_id: *asset,
            amount: 0,
            to: wallet.address().into(),
        });
    }
    (inputs, outputs)
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

pub fn get_asset_id_in(asset_id_out: AssetId, pools: &Vec<PoolId>) -> AssetId {
    let mut asset_out = asset_id_out;
    let mut reversed = pools.clone();
    reversed.reverse();
    for pool in reversed {
        asset_out = if pool.0 == asset_out { pool.1 } else { pool.0 };
    }
    asset_out
}

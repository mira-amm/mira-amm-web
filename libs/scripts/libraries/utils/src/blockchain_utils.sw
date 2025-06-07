library;

use std::block::height;
use interfaces::data_structures::PoolId;
use std::hash::*;

/// Validates that the provided deadline hasn't passed yet
pub fn check_deadline(deadline: u32) {
    require(deadline >= height(), "Deadline passed");
}

/// Builds and returns an LP sub id and asset id for the provided pool id
pub fn get_lp_asset(contract_id: ContractId, pool_id: PoolId) -> (b256, AssetId) {
    let lp_sub_id = sha256(pool_id);
    (lp_sub_id, AssetId::new(contract_id, lp_sub_id))
}

pub fn is_stable(pool_id: PoolId) -> bool {
    pool_id.2
}

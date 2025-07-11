script;

use interfaces::{data_structures::PoolId, mira_amm::MiraAMM};
use math::pool_math::get_amounts_out;
use utils::blockchain_utils::check_deadline;
use std::{asset::transfer, bytes::Bytes};

configurable {
    AMM_CONTRACT_ID: ContractId = ContractId::zero(),
}

fn main(
    amount_in: u64,
    asset_in: AssetId,
    amount_out_min: u64,
    pools: Vec<PoolId>,
    recipient: Identity,
    deadline: u32,
) -> Vec<(u64, AssetId)> {
    check_deadline(deadline);

    let amounts_out = get_amounts_out(AMM_CONTRACT_ID, amount_in, asset_in, pools);
    let last_amount_out = amounts_out.get(amounts_out.len() - 1).unwrap();
    require(
        last_amount_out.0 >= amount_out_min,
        "Insufficient output amount",
    );

    transfer(Identity::ContractId(AMM_CONTRACT_ID), asset_in, amount_in);
    let amm = abi(MiraAMM, AMM_CONTRACT_ID.into());

    let mut i = 0;
    while i < pools.len() {
        let pool_id = pools.get(i).unwrap();
        let (amount_out, asset_out) = amounts_out.get(i + 1).unwrap();
        let to = if i == pools.len() - 1 {
            recipient
        } else {
            Identity::ContractId(AMM_CONTRACT_ID)
        };
        let (amount_0_out, amount_1_out) = if asset_out == pool_id.0 {
            (amount_out, 0)
        } else {
            (0, amount_out)
        };
        amm.swap(pool_id, amount_0_out, amount_1_out, to, Bytes::new());
        i += 1;
    }

    amounts_out
}

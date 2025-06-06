script;

use interfaces::{data_structures::{Asset, PoolId}, mira_amm::MiraAMM};
use math::pool_math::get_deposit_amounts;
use utils::blockchain_utils::check_deadline;
use std::asset::transfer;

configurable {
    AMM_CONTRACT_ID: ContractId = ContractId::zero(),
}

fn main(
    pool_id: PoolId,
    amount_0_desired: u64,
    amount_1_desired: u64,
    amount_0_min: u64,
    amount_1_min: u64,
    recipient: Identity,
    deadline: u32,
) -> Asset {
    check_deadline(deadline);
    let amm = abi(MiraAMM, AMM_CONTRACT_ID.into());

    let pool_meta_opt = amm.pool_metadata(pool_id);
    require(pool_meta_opt.is_some(), "Pool doesn't exist");
    let pool_meta = pool_meta_opt.unwrap();

    let (amount_0, amount_1) = get_deposit_amounts(
        amount_0_desired,
        amount_1_desired,
        amount_0_min,
        amount_1_min,
        pool_meta
            .reserve_0,
        pool_meta
            .reserve_1,
    );

    transfer(Identity::ContractId(AMM_CONTRACT_ID), pool_id.0, amount_0);
    transfer(Identity::ContractId(AMM_CONTRACT_ID), pool_id.1, amount_1);

    amm.mint(pool_id, recipient)
}

script;

use interfaces::{data_structures::{Asset, PoolId}, mira_amm::MiraAMM};
use math::pool_math::get_deposit_amounts;
use utils::blockchain_utils::{check_deadline, get_lp_asset};
use std::asset::transfer;

configurable {
    AMM_CONTRACT_ID: ContractId = ContractId::zero(),
}

fn main(
    pool_id: PoolId,
    liquidity: u64,
    amount_0_min: u64,
    amount_1_min: u64,
    recipient: Identity,
    deadline: u32,
) -> (u64, u64) {
    check_deadline(deadline);
    let amm = abi(MiraAMM, AMM_CONTRACT_ID.into());

    let (_, lp_asset_id) = get_lp_asset(AMM_CONTRACT_ID, pool_id);
    let (amount_0, amount_1) = amm.burn {
        asset_id: lp_asset_id.into(),
        coins: liquidity,
    }(pool_id, recipient);

    require(amount_0 >= amount_0_min, "Insufficient amount");
    require(amount_1 >= amount_1_min, "Insufficient amount");
    (amount_0, amount_1)
}

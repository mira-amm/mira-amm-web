contract;

use utils::utils::is_stable;
use interfaces::{data_structures::{Asset, PoolId, PoolMetadata}, mira_amm::MiraAMM};
use math::pool_math::{calculate_fee, validate_curve};

configurable {
    AMM_CONTRACT_ID: ContractId = ContractId::zero(),
}

abi IBaseHook {
    #[storage(read, write)]
    fn hook(
        pool_id: PoolId,
        sender: Identity,
        to: Identity,
        asset_0_in: u64,
        asset_1_in: u64,
        asset_0_out: u64,
        asset_1_out: u64,
        lp_token: u64,
    );
}

fn post_validate_curve(
    is_stable: bool,
    current_reserve_0: u64,
    current_reserve_1: u64,
    decimals_0: u8,
    decimals_1: u8,
    asset_0_in: u64,
    asset_1_in: u64,
    asset_0_out: u64,
    asset_1_out: u64,
    lp_fee: u64,
    protocol_fee: u64,
) {
    let asset_0_protocol_fee = calculate_fee(asset_0_in, protocol_fee);
    let asset_1_protocol_fee = calculate_fee(asset_1_in, protocol_fee);
    let asset_0_lp_fee = calculate_fee(asset_0_in, lp_fee);
    let asset_1_lp_fee = calculate_fee(asset_1_in, lp_fee);

    let reserve_0_increase = asset_0_in - asset_0_protocol_fee;
    let reserve_1_increase = asset_1_in - asset_1_protocol_fee;
    let previous_reserve_0 = current_reserve_0 - reserve_0_increase + asset_0_out;
    let previous_reserve_1 = current_reserve_1 - reserve_1_increase + asset_1_out;
    let current_reserve_without_fee_0 = current_reserve_0 - asset_0_lp_fee;
    let current_reserve_without_fee_1 = current_reserve_1 - asset_1_lp_fee;

    validate_curve(
        is_stable,
        current_reserve_without_fee_0,
        current_reserve_without_fee_1,
        previous_reserve_0,
        previous_reserve_1,
        decimals_0,
        decimals_1,
    );
}

fn validate_stable_pool_meta(pool: PoolMetadata) {
    require(
        pool.decimals_0 <= 9 && pool.decimals_1 <= 9,
        "Decimals too big",
    );
}

impl IBaseHook for Contract {
    #[storage(read, write)]
    fn hook(
        pool_id: PoolId,
        sender: Identity,
        to: Identity,
        asset_0_in: u64,
        asset_1_in: u64,
        asset_0_out: u64,
        asset_1_out: u64,
        lp_token: u64,
    ) {
        if (lp_token == 0) {
            // it's a swap
            let amm = abi(MiraAMM, AMM_CONTRACT_ID.into());
            let pool = amm.pool_metadata(pool_id).unwrap();
            let (lp_fee_volatile, lp_fee_stable, protocol_fee_volatile, protocol_fee_stable) = amm.fees();
            let (lp_fee, protocol_fee) = if is_stable(pool_id) {
                (lp_fee_stable, protocol_fee_stable)
            } else {
                (lp_fee_volatile, protocol_fee_volatile)
            };
            post_validate_curve(
                is_stable(pool_id),
                pool.reserve_0,
                pool.reserve_1,
                pool.decimals_0,
                pool.decimals_1,
                asset_0_in,
                asset_1_in,
                asset_0_out,
                asset_1_out,
                lp_fee,
                protocol_fee,
            );
        } else if (asset_0_out == 0 && asset_1_out == 0) {
            // it's a mint
            if (is_stable(pool_id)) {
                let amm = abi(MiraAMM, AMM_CONTRACT_ID.into());
                let pool = amm.pool_metadata(pool_id).unwrap();
                validate_stable_pool_meta(pool);
            }
        }
    }
}

fn run_test_cases(
    cases: Vec<(bool, u64, u64, u64, u64, u64, u64, u8, u8)>,
    fees: Option<(u64, u64)>,
) {
    let (lp_fee, protocol_fee) = fees.unwrap_or((30, 0));
    let mut i = 0;
    while i < cases.len() {
        let (is_stable, res_0, res_1, input_0, input_1, output_0, output_1, dec_0, dec_1) = cases.get(i).unwrap();
        post_validate_curve(
            is_stable,
            res_0,
            res_1,
            dec_0,
            dec_1,
            input_0,
            input_1,
            output_0,
            output_1,
            lp_fee,
            protocol_fee,
        );
        i = i + 1;
    }
}

#[test]
fn test_post_validate_curve_volatile() {
    // is_stable, res_0, res_1, input_0, input_1, output_0, output_1, dec_0, dec_1
    let mut test_cases: Vec<(bool, u64, u64, u64, u64, u64, u64, u8, u8)> = Vec::new();

    // volatile pool, same decimals
    // 990 * 1001 (990_990) < (1000 - 1) * 1000 (999_000)
    test_cases.push((false, 1000, 1000, 10, 0, 0, 1, 6, 6));
    // 990 * 1009 (998_910) < (1000 - 1) * 1000 (999_000)
    test_cases.push((false, 1000, 1000, 10, 0, 0, 9, 6, 6));
    // 998_996 * 1002 (1_000_993_992) < (999_999 - 3) * 1001 (1_000_995_996)
    test_cases.push((false, 999_999, 1001, 1003, 0, 0, 1, 2, 2));
    // 998_996_989 * 1_002_000 (1_000_994_982_978_000) < (999_999_999 - 3009) * 1_001_000 (1_000_996_986_990_000)
    test_cases.push((false, 999_999_999, 1_001_000, 1_003_010, 0, 0, 1000, 2, 2));

    // volatile pool, different decimals
    // 990 * 1001 (990_990) < (1000 - 1) * 1000 (999_000)
    test_cases.push((false, 1000, 1000, 10, 0, 1, 0, 2, 8));
    // 990 * 1009 (998_910) < (1000 - 1) * 1000 (999_000)
    test_cases.push((false, 1000, 1000, 10, 0, 0, 9, 10, 0));
    // 998_996 * 1002 (1_000_993_992) < (999_999 - 3) * 1001 (1_000_995_996)
    test_cases.push((false, 999_999, 1001, 1003, 0, 0, 1, 2, 3));
    // 998_996_989 * 1_002_000 (1_000_994_982_978_000) < (999_999_999 - 3009) * 1_001_000 (1_000_996_986_990_000)
    test_cases.push((false, 999_999_999, 1_001_000, 1_003_010, 0, 0, 1000, 5, 4));

    run_test_cases(test_cases, None);
}

#[test(should_revert)]
fn test_post_validate_curve_volatile_failure() {
    // is_stable, res_0, res_1, input_0, input_1, output_0, output_1, dec_0, dec_1
    let mut test_cases: Vec<(bool, u64, u64, u64, u64, u64, u64, u8, u8)> = Vec::new();

    // 990 * 1009 (998_910) < (1000 - 1) * 1000 (999_000) OK
    test_cases.push((false, 1000, 1000, 10, 0, 0, 9, 6, 6));
    // 990 * 1010 (999_900) < (1000 - 1) * 1000 (999_000) VIOLATION
    test_cases.push((false, 1000, 1000, 10, 0, 0, 10, 6, 6));

    run_test_cases(test_cases, None);
}

#[test]
fn test_protocol_fee_calculation() {
    // is_stable, res_0, res_1, input_0, input_1, output_0, output_1, dec_0, dec_1
    let mut test_cases: Vec<(bool, u64, u64, u64, u64, u64, u64, u8, u8)> = Vec::new();

    // current reserves: 10000, 10000
    // previous reserves: 9010, 11098, 10 - protocol fee
    test_cases.push((false, 10000, 10000, 1000, 0, 0, 1098, 6, 6));

    run_test_cases(test_cases, Some((0, 100))); // 1% protocol fee
}

fn build_pool_meta(decimals_0: u8, decimals_1: u8) -> PoolMetadata {
    PoolMetadata {
        reserve_0: 0,
        reserve_1: 0,
        liquidity: Asset::new(AssetId::default(), 0),
        decimals_0,
        decimals_1,
    }
}

#[test]
fn test_stable_pool_validation() {
    validate_stable_pool_meta(build_pool_meta(0, 0));
    validate_stable_pool_meta(build_pool_meta(0, 9));
    validate_stable_pool_meta(build_pool_meta(9, 0));
    validate_stable_pool_meta(build_pool_meta(9, 9));
    validate_stable_pool_meta(build_pool_meta(5, 7));
    validate_stable_pool_meta(build_pool_meta(2, 8));
    validate_stable_pool_meta(build_pool_meta(8, 2));
}

#[test(should_revert)]
fn test_stable_pool_validation_failure_decimals_0() {
    validate_stable_pool_meta(build_pool_meta(10, 0));
}

#[test(should_revert)]
fn test_stable_pool_validation_failure_decimals_1() {
    validate_stable_pool_meta(build_pool_meta(0, 10));
}

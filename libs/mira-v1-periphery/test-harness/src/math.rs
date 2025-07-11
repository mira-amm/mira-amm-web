use fuels::types::U256;

pub fn proportional_value(numerator_1: u64, numerator_2: u64, denominator: u64) -> u64 {
    u64::try_from(U256::from(numerator_1) * U256::from(numerator_2) / U256::from(denominator))
        .unwrap()
}

pub fn initial_liquidity(deposit_0: u64, deposit_1: u64) -> u64 {
    let product = U256::from(deposit_0) * U256::from(deposit_1);
    u64::try_from(product.integer_sqrt()).unwrap()
}

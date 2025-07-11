use crate::utils::setup;
use fuels::prelude::VariableOutputPolicy;
use test_harness::interface::scripts::get_transaction_inputs_outputs;
use test_harness::utils::common::MINIMUM_LIQUIDITY;

#[tokio::test]
#[should_panic(expected = "ZeroInputAmount")]
async fn panics_on_removing_zero_liquidity() {
    let (
        add_liquidity_script_instance,
        remove_liquidity_script_instance,
        amm,
        pool_id,
        wallet,
        deadline,
    ) = setup().await;

    let amount_0_desired: u64 = 1_000_000_000;
    let amount_1_desired: u64 = 1_000_000_000;
    let expected_liquidity: u64 = 1_000_000_000 - MINIMUM_LIQUIDITY;

    let (inputs, outputs) = get_transaction_inputs_outputs(
        &wallet,
        &vec![(pool_id.0, amount_0_desired), (pool_id.1, amount_1_desired)],
    )
    .await;

    // adds initial liquidity
    let added_liquidity = add_liquidity_script_instance
        .main(
            pool_id,
            amount_0_desired,
            amount_1_desired,
            0,
            0,
            wallet.address().into(),
            deadline,
        )
        .with_contracts(&[&amm.instance])
        .with_inputs(inputs)
        .with_outputs(outputs)
        .with_variable_output_policy(VariableOutputPolicy::Exactly(2))
        .call()
        .await
        .unwrap()
        .value;

    assert_eq!(added_liquidity.amount, expected_liquidity);

    remove_liquidity_script_instance
        .main(pool_id, 0, 0, 0, wallet.address().into(), deadline)
        .with_contracts(&[&amm.instance])
        .call()
        .await
        .unwrap();
}

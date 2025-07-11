use crate::utils::setup;
use fuels::prelude::VariableOutputPolicy;
use test_harness::interface::amm::pool_metadata;
use test_harness::interface::scripts::get_transaction_inputs_outputs;
use test_harness::interface::{Asset, BurnEvent};
use test_harness::utils::common::{pool_assets_balance, MINIMUM_LIQUIDITY};

#[tokio::test]
async fn removes_all_liquidity_passing_exact_a_and_b_values() {
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

    let (inputs, outputs) = get_transaction_inputs_outputs(
        &wallet,
        &vec![(added_liquidity.id, added_liquidity.amount)],
    )
    .await;

    let removed_liquidity = remove_liquidity_script_instance
        .main(
            pool_id,
            added_liquidity.amount,
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
        .unwrap();

    let log = removed_liquidity
        .decode_logs_with_type::<BurnEvent>()
        .unwrap();
    let event = log.first().unwrap();

    let final_pool_metadata = pool_metadata(&amm.instance, pool_id).await.value.unwrap();
    let final_wallet_balances = pool_assets_balance(&wallet, &pool_id, amm.id).await;

    assert_eq!(
        *event,
        BurnEvent {
            pool_id,
            recipient: wallet.address().into(),
            liquidity: added_liquidity,
            asset_0_out: removed_liquidity.value.0,
            asset_1_out: removed_liquidity.value.1,
        }
    );
    assert_eq!(final_wallet_balances.liquidity_pool_asset, 0);
    assert_eq!(final_pool_metadata.reserve_0, MINIMUM_LIQUIDITY);
    assert_eq!(final_pool_metadata.reserve_1, MINIMUM_LIQUIDITY);
    assert_eq!(final_pool_metadata.liquidity.amount, MINIMUM_LIQUIDITY);
}

#[tokio::test]
async fn removes_partial_liquidity() {
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

    let initial_wallet_balances = pool_assets_balance(&wallet, &pool_id, amm.id).await;
    let liquidity_to_remove = added_liquidity.amount / 2;

    let (inputs, outputs) =
        get_transaction_inputs_outputs(&wallet, &vec![(added_liquidity.id, liquidity_to_remove)])
            .await;

    let removed_liquidity = remove_liquidity_script_instance
        .main(
            pool_id,
            liquidity_to_remove,
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
        .unwrap();

    let log = removed_liquidity
        .decode_logs_with_type::<BurnEvent>()
        .unwrap();
    let event = log.first().unwrap();

    let final_wallet_balances = pool_assets_balance(&wallet, &pool_id, amm.id).await;

    assert_eq!(
        *event,
        BurnEvent {
            pool_id,
            recipient: wallet.address().into(),
            liquidity: Asset {
                amount: liquidity_to_remove,
                id: added_liquidity.id
            },
            asset_0_out: removed_liquidity.value.0,
            asset_1_out: removed_liquidity.value.1,
        }
    );
    assert_eq!(
        final_wallet_balances.asset_a,
        initial_wallet_balances.asset_a + ((amount_0_desired - MINIMUM_LIQUIDITY) / 2)
    );
    assert_eq!(
        final_wallet_balances.asset_b,
        initial_wallet_balances.asset_b + ((amount_1_desired - MINIMUM_LIQUIDITY) / 2)
    );
}

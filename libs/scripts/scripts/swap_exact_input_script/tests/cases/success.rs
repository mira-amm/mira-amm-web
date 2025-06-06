use crate::utils::setup;
use fuels::prelude::VariableOutputPolicy;
use test_harness::interface::amm::pool_metadata;
use test_harness::interface::scripts::get_transaction_inputs_outputs;
use test_harness::utils::common::{pool_assets_balance, MINIMUM_LIQUIDITY};

#[tokio::test]
async fn swap_between_two_volatile_tokens() {
    let (
        add_liquidity_script,
        swap_exact_input_script,
        amm,
        pool_id,
        _,
        wallet,
        deadline,
        (token_0_id, token_1_id, _),
    ) = setup().await;

    let amount_0_desired: u64 = 1_000_000;
    let amount_1_desired: u64 = 1_000_000;
    let expected_liquidity: u64 = 1_000_000 - MINIMUM_LIQUIDITY;

    let (inputs, outputs) = get_transaction_inputs_outputs(
        &wallet,
        &vec![
            (token_0_id, amount_0_desired),
            (token_1_id, amount_1_desired),
        ],
    )
    .await;

    // adds initial liquidity
    let added_liquidity = add_liquidity_script
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

    let token_0_to_swap = 1_000;
    let token_1_expected = 996;

    let (inputs, outputs) =
        get_transaction_inputs_outputs(&wallet, &vec![(token_0_id, token_0_to_swap)]).await;

    let wallet_balances_before = pool_assets_balance(&wallet, &pool_id, amm.id).await;
    let pool_metadata_before = pool_metadata(&amm.instance, pool_id).await.value.unwrap();
    let amounts_out = swap_exact_input_script
        .main(
            token_0_to_swap,
            token_0_id,
            0,
            vec![pool_id],
            wallet.address().into(),
            deadline,
        )
        .with_contracts(&[&amm.instance])
        .with_inputs(inputs)
        .with_outputs(outputs)
        .with_variable_output_policy(VariableOutputPolicy::Exactly(1))
        .call()
        .await
        .unwrap()
        .value;

    assert_eq!(
        amounts_out,
        vec![
            (token_0_to_swap, token_0_id),
            (token_1_expected, token_1_id)
        ]
    );
    let wallet_balances_after = pool_assets_balance(&wallet, &pool_id, amm.id).await;
    let pool_metadata_after = pool_metadata(&amm.instance, pool_id).await.value.unwrap();

    assert_eq!(
        wallet_balances_after.asset_a,
        wallet_balances_before.asset_a - token_0_to_swap
    );
    assert_eq!(
        wallet_balances_after.asset_b,
        wallet_balances_before.asset_b + token_1_expected
    );
    assert_eq!(
        pool_metadata_after.reserve_0,
        pool_metadata_before.reserve_0 + token_0_to_swap
    );
    assert_eq!(
        pool_metadata_after.reserve_1,
        pool_metadata_before.reserve_1 - token_1_expected
    );
}

#[tokio::test]
async fn swap_between_three_volatile_tokens() {
    let (
        add_liquidity_script,
        swap_exact_input_script,
        amm,
        pool_id_0,
        pool_id_1,
        wallet,
        deadline,
        (token_0_id, token_1_id, token_2_id),
    ) = setup().await;

    let amount_0_desired: u64 = 1_000_000;
    let amount_1_desired: u64 = 1_000_000;
    let expected_liquidity: u64 = 1_000_000 - MINIMUM_LIQUIDITY;

    let (inputs, outputs) = get_transaction_inputs_outputs(
        &wallet,
        &vec![
            (token_0_id, amount_0_desired),
            (token_1_id, amount_1_desired),
        ],
    )
    .await;

    // adds initial liquidity
    let added_liquidity = add_liquidity_script
        .main(
            pool_id_0,
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
        &vec![
            (token_1_id, amount_0_desired),
            (token_2_id, amount_1_desired),
        ],
    )
    .await;

    // adds initial liquidity
    let added_liquidity = add_liquidity_script
        .main(
            pool_id_1,
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

    let token_0_to_swap = 1_000;
    let token_1_expected = 996;
    let token_2_expected = 992;

    let (inputs, outputs) =
        get_transaction_inputs_outputs(&wallet, &vec![(token_0_id, token_0_to_swap)]).await;

    let wallet_balances_0_before = pool_assets_balance(&wallet, &pool_id_0, amm.id).await;
    let wallet_balances_1_before = pool_assets_balance(&wallet, &pool_id_1, amm.id).await;
    let pool_metadata_0_before = pool_metadata(&amm.instance, pool_id_0).await.value.unwrap();
    let pool_metadata_1_before = pool_metadata(&amm.instance, pool_id_1).await.value.unwrap();
    let amounts_out = swap_exact_input_script
        .main(
            token_0_to_swap,
            token_0_id,
            0,
            vec![pool_id_0, pool_id_1],
            wallet.address().into(),
            deadline,
        )
        .with_contracts(&[&amm.instance])
        .with_inputs(inputs)
        .with_outputs(outputs)
        .with_variable_output_policy(VariableOutputPolicy::Exactly(1))
        .call()
        .await
        .unwrap()
        .value;
    let pool_metadata_0_after = pool_metadata(&amm.instance, pool_id_0).await.value.unwrap();
    let pool_metadata_1_after = pool_metadata(&amm.instance, pool_id_1).await.value.unwrap();
    let wallet_balances_0_after = pool_assets_balance(&wallet, &pool_id_0, amm.id).await;
    let wallet_balances_1_after = pool_assets_balance(&wallet, &pool_id_1, amm.id).await;

    assert_eq!(
        amounts_out,
        vec![
            (token_0_to_swap, pool_id_0.0),
            (token_1_expected, pool_id_0.1),
            (token_2_expected, token_2_id)
        ]
    );

    assert_eq!(
        wallet_balances_0_after.asset_a,
        wallet_balances_0_before.asset_a - token_0_to_swap
    );
    assert_eq!(
        wallet_balances_0_after.asset_b,
        wallet_balances_0_before.asset_b
    );
    assert_eq!(
        wallet_balances_1_after.asset_b,
        wallet_balances_1_before.asset_b + token_2_expected
    );

    assert_eq!(
        pool_metadata_0_after.reserve_0,
        pool_metadata_0_before.reserve_0 + token_0_to_swap
    );
    assert_eq!(
        pool_metadata_0_after.reserve_1,
        pool_metadata_0_before.reserve_1 - token_1_expected
    );
    assert_eq!(
        pool_metadata_1_after.reserve_0,
        pool_metadata_1_before.reserve_0 + token_1_expected
    );
    assert_eq!(
        pool_metadata_1_after.reserve_1,
        pool_metadata_1_before.reserve_1 - token_2_expected
    );
}

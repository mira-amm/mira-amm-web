use std::str::FromStr;

use fuels::accounts::wallet::WalletUnlocked;
use fuels::prelude::Address;
use fuels::types::{ContractId, Identity};
use test_harness::data_structures::{MiraAMMContract, WalletAssetConfiguration};
use test_harness::interface::amm::{create_pool, initialize_ownership};
use test_harness::interface::mock::{
    add_token, deploy_mock_token_contract, get_sub_id, mint_tokens,
};
use test_harness::interface::{
    AddLiquidityScript, AddLiquidityScriptConfigurables, RemoveLiquidityScript,
    RemoveLiquidityScriptConfigurables,
};
use test_harness::paths::{ADD_LIQUIDITY_SCRIPT_BINARY_PATH, REMOVE_LIQUIDITY_SCRIPT_BINARY_PATH};
use test_harness::setup::common::{deploy_amm, setup_wallet_and_provider};
use test_harness::types::PoolId;
use test_harness::utils::common::order_sub_ids;

pub async fn setup() -> (
    AddLiquidityScript<WalletUnlocked>,
    RemoveLiquidityScript<WalletUnlocked>,
    MiraAMMContract,
    PoolId,
    WalletUnlocked,
    u32,
) {
    let (wallet, _asset_ids, provider) =
        setup_wallet_and_provider(&WalletAssetConfiguration::default()).await;
    let amm = deploy_amm(&wallet).await;
    initialize_ownership(&amm.instance, Identity::Address(Address::default())).await;
    let (token_contract_id, token_contract) = deploy_mock_token_contract(&wallet).await;

    let token_a_id = add_token(&token_contract, "TOKEN_A".to_string(), "TKA".to_string(), 9)
        .await
        .value;
    let token_b_id = add_token(&token_contract, "TOKEN_B".to_string(), "TKB".to_string(), 9)
        .await
        .value;

    let token_a_sub_id = get_sub_id(&token_contract, token_a_id).await.value.unwrap();
    let token_b_sub_id = get_sub_id(&token_contract, token_b_id).await.value.unwrap();

    let token_a_amount = 1_000_000_000;
    let token_b_amount = 1_000_000_000;

    mint_tokens(&token_contract, token_a_id, token_a_amount).await;
    mint_tokens(&token_contract, token_b_id, token_b_amount).await;

    let (token_a_sub_id, token_b_sub_id) =
        order_sub_ids((token_a_id, token_b_id), (token_a_sub_id, token_b_sub_id));

    let pool_id = create_pool(
        &amm.instance,
        &token_contract,
        token_contract_id,
        token_a_sub_id,
        token_contract_id,
        token_b_sub_id,
        false,
    )
    .await
    .value;

    let deadline = provider.latest_block_height().await.unwrap() + 10;

    let add_liquidity_script_configurables = AddLiquidityScriptConfigurables::default()
        .with_AMM_CONTRACT_ID(ContractId::from_str(&amm.id.to_string()).unwrap())
        .unwrap();
    let mut add_liquidity_script_instance =
        AddLiquidityScript::new(wallet.clone(), ADD_LIQUIDITY_SCRIPT_BINARY_PATH)
            .with_configurables(add_liquidity_script_configurables);

    add_liquidity_script_instance
        .convert_into_loader()
        .await
        .unwrap();

    let remove_liquidity_script_configurables = RemoveLiquidityScriptConfigurables::default()
        .with_AMM_CONTRACT_ID(ContractId::from_str(&amm.id.to_string()).unwrap())
        .unwrap();
    let mut remove_liquidity_script_instance =
        RemoveLiquidityScript::new(wallet.clone(), REMOVE_LIQUIDITY_SCRIPT_BINARY_PATH)
            .with_configurables(remove_liquidity_script_configurables);

    remove_liquidity_script_instance
        .convert_into_loader()
        .await
        .unwrap();

    (
        add_liquidity_script_instance,
        remove_liquidity_script_instance,
        amm,
        pool_id,
        wallet,
        deadline,
    )
}

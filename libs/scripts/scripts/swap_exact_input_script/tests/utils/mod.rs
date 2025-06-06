use std::str::FromStr;

use fuels::accounts::wallet::WalletUnlocked;
use fuels::types::{AssetId, ContractId, Identity};
use test_harness::data_structures::{MiraAMMContract, WalletAssetConfiguration};
use test_harness::interface::amm::{create_pool, initialize_ownership};
use test_harness::interface::mock::{
    add_token, deploy_mock_token_contract, get_sub_id, mint_tokens,
};
use test_harness::interface::{
    AddLiquidityScript, AddLiquidityScriptConfigurables, SwapExactInputScript,
    SwapExactInputScriptConfigurables,
};
use test_harness::paths::{ADD_LIQUIDITY_SCRIPT_BINARY_PATH, SWAP_EXACT_INPUT_SCRIPT_BINARY_PATH};
use test_harness::setup::common::{deploy_amm, setup_wallet_and_provider};
use test_harness::types::PoolId;
use test_harness::utils::common::order_sub_ids;

pub async fn setup() -> (
    AddLiquidityScript<WalletUnlocked>,
    SwapExactInputScript<WalletUnlocked>,
    MiraAMMContract,
    PoolId,
    PoolId,
    WalletUnlocked,
    u32,
    (AssetId, AssetId, AssetId),
) {
    let (wallet, _asset_ids, provider) =
        setup_wallet_and_provider(&WalletAssetConfiguration::default()).await;
    let amm = deploy_amm(&wallet).await;
    initialize_ownership(&amm.instance, Identity::Address(wallet.address().into())).await;
    let (token_contract_id, token_contract) = deploy_mock_token_contract(&wallet).await;

    let token_0_id = add_token(&token_contract, "TOKEN_A".to_string(), "TKA".to_string(), 9)
        .await
        .value;
    let token_1_id = add_token(&token_contract, "TOKEN_B".to_string(), "TKB".to_string(), 9)
        .await
        .value;
    let token_2_id = add_token(&token_contract, "TOKEN_C".to_string(), "TKC".to_string(), 9)
        .await
        .value;
    let mut all_assets = vec![token_0_id, token_1_id, token_2_id];
    all_assets.sort();
    let [token_0_id, token_1_id, token_2_id] = all_assets[..] else {
        todo!()
    };

    let token_0_sub_id = get_sub_id(&token_contract, token_0_id).await.value.unwrap();
    let token_1_sub_id = get_sub_id(&token_contract, token_1_id).await.value.unwrap();
    let token_2_sub_id = get_sub_id(&token_contract, token_2_id).await.value.unwrap();

    mint_tokens(&token_contract, token_0_id, 1_000_000_000).await;
    mint_tokens(&token_contract, token_1_id, 1_000_000_000).await;
    mint_tokens(&token_contract, token_2_id, 1_000_000_000).await;

    let (token_a_sub_id, token_b_sub_id) =
        order_sub_ids((token_0_id, token_1_id), (token_0_sub_id, token_1_sub_id));

    let pool_id_0 = create_pool(
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

    let (token_c_sub_id, token_d_sub_id) =
        order_sub_ids((token_1_id, token_2_id), (token_1_sub_id, token_2_sub_id));

    let pool_id_1 = create_pool(
        &amm.instance,
        &token_contract,
        token_contract_id,
        token_c_sub_id,
        token_contract_id,
        token_d_sub_id,
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

    let swap_exact_input_script_configurables = SwapExactInputScriptConfigurables::default()
        .with_AMM_CONTRACT_ID(ContractId::from_str(&amm.id.to_string()).unwrap())
        .unwrap();
    let mut swap_exact_input_script_instance =
        SwapExactInputScript::new(wallet.clone(), SWAP_EXACT_INPUT_SCRIPT_BINARY_PATH)
            .with_configurables(swap_exact_input_script_configurables);

    swap_exact_input_script_instance
        .convert_into_loader()
        .await
        .unwrap();

    (
        add_liquidity_script_instance,
        swap_exact_input_script_instance,
        amm,
        pool_id_0,
        pool_id_1,
        wallet,
        deadline,
        (token_0_id, token_1_id, token_2_id),
    )
}

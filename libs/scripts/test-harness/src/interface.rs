use fuels::{
    prelude::*,
    programs::responses::CallResponse,
    types::{input::Input, output::Output, Bits256},
};

use crate::paths::MOCK_TOKEN_CONTRACT_BINARY_PATH;

use crate::types::PoolId;

abigen!(
    Script(
        name = "AddLiquidityScript",
        abi = "scripts/add_liquidity_script/out/debug/add_liquidity_script-abi.json"
    ),
    Script(
        name = "RemoveLiquidityScript",
        abi = "scripts/remove_liquidity_script/out/debug/remove_liquidity_script-abi.json"
    ),
    Script(
        name = "SwapExactInputScript",
        abi = "scripts/swap_exact_input_script/out/debug/swap_exact_input_script-abi.json"
    ),
    Script(
        name = "SwapExactOutputScript",
        abi = "scripts/swap_exact_output_script/out/debug/swap_exact_output_script-abi.json"
    ),
    Contract(
        name = "MiraAMM",
        abi = "fixtures/mira-amm/mira_amm_contract-abi.json"
    ),
    Contract(
        name = "MockToken",
        abi = "fixtures/mock-token/mock_token-abi.json"
    )
);

pub mod amm {
    use super::*;
    use fuels::types::Identity;

    pub async fn initialize_ownership(
        contract: &MiraAMM<WalletUnlocked>,
        owner: Identity,
    ) -> CallResponse<()> {
        contract
            .methods()
            .transfer_ownership(owner)
            .call()
            .await
            .unwrap()
    }

    pub async fn create_pool(
        contract: &MiraAMM<WalletUnlocked>,
        token_contract: &MockToken<WalletUnlocked>,
        token_0_contract_id: ContractId,
        token_0_sub_id: Bits256,
        token_1_contract_id: ContractId,
        token_1_sub_id: Bits256,
        is_stable: bool,
    ) -> CallResponse<PoolId> {
        contract
            .methods()
            .create_pool(
                token_0_contract_id,
                token_0_sub_id,
                token_1_contract_id,
                token_1_sub_id,
                is_stable,
            )
            .with_contracts(&[token_contract])
            .call()
            .await
            .unwrap()
    }

    pub async fn pool_metadata(
        contract: &MiraAMM<WalletUnlocked>,
        pool_id: PoolId,
    ) -> CallResponse<Option<PoolMetadata>> {
        contract
            .methods()
            .pool_metadata(pool_id)
            .call()
            .await
            .unwrap()
    }
}

pub mod mock {
    use super::*;

    pub async fn deploy_mock_token_contract(
        wallet: &WalletUnlocked,
    ) -> (ContractId, MockToken<WalletUnlocked>) {
        let contract_id = Contract::load_from(
            MOCK_TOKEN_CONTRACT_BINARY_PATH,
            LoadConfiguration::default(),
        )
        .unwrap()
        .deploy(wallet, TxPolicies::default())
        .await
        .unwrap();

        let id = ContractId::from(contract_id.clone());
        let instance = MockToken::new(contract_id, wallet.clone());

        (id, instance)
    }

    pub async fn add_token(
        contract: &MockToken<WalletUnlocked>,
        name: String,
        symbol: String,
        decimals: u8,
    ) -> CallResponse<AssetId> {
        contract
            .methods()
            .add_token(name, symbol, decimals)
            .call()
            .await
            .unwrap()
    }

    pub async fn mint_tokens(
        contract: &MockToken<WalletUnlocked>,
        asset_id: AssetId,
        amount: u64,
    ) -> CallResponse<()> {
        contract
            .methods()
            .mint_tokens(asset_id, amount)
            .with_variable_output_policy(VariableOutputPolicy::Exactly(1))
            .call()
            .await
            .unwrap()
    }

    pub async fn get_sub_id(
        contract: &MockToken<WalletUnlocked>,
        asset_id: AssetId,
    ) -> CallResponse<Option<Bits256>> {
        contract
            .methods()
            .get_sub_id(asset_id)
            .call()
            .await
            .unwrap()
    }
}

pub mod scripts {
    use super::*;

    pub const MAXIMUM_INPUT_AMOUNT: u64 = 100_000;

    pub async fn get_transaction_inputs_outputs(
        wallet: &WalletUnlocked,
        assets: &Vec<(AssetId, u64)>,
    ) -> (Vec<Input>, Vec<Output>) {
        let mut inputs: Vec<Input> = vec![]; // capacity depends on wallet resources
        let mut outputs: Vec<Output> = Vec::with_capacity(assets.len());

        for (asset, amount) in assets {
            let asset_inputs = wallet
                .get_asset_inputs_for_amount(*asset, *amount, None)
                .await
                .unwrap();
            inputs.extend(asset_inputs);
            outputs.push(Output::Change {
                asset_id: *asset,
                amount: 0,
                to: wallet.address().into(),
            });
        }
        (inputs, outputs)
    }
}

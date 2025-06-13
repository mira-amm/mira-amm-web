use fuels::prelude::{abigen, AssetId, TxPolicies, WalletUnlocked};

abigen!(
    Contract(
        name = "MiraAMM",
        abi = "./contracts/mira_amm_contract/out/debug/mira_amm_contract-abi.json"
    ),
    Contract(
        name = "ValidationHook",
        abi = "./contracts/mira_validation_hook/out/debug/mira_validation_hook-abi.json"
    ),
    Contract(
        name = "MockToken",
        abi = "./contracts/mocks/mock_token/out/debug/mock_token-abi.json"
    )
);

pub mod amm {
    use fuels::prelude::{Bech32ContractId, VariableOutputPolicy};
    use fuels::programs::calls::CallParameters;
    use fuels::programs::responses::CallResponse;
    use fuels::types::{Bits256, Bytes, ContractId, Identity};

    use crate::types::PoolId;

    use super::*;

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
        contract.methods().pool_metadata(pool_id).call().await.unwrap()
    }

    pub async fn fees(contract: &MiraAMM<WalletUnlocked>) -> CallResponse<(u64, u64, u64, u64)> {
        contract.methods().fees().call().await.unwrap()
    }

    pub async fn mint(
        contract: &MiraAMM<WalletUnlocked>,
        pool_id: PoolId,
        to: Identity,
    ) -> CallResponse<Asset> {
        contract
            .methods()
            .mint(pool_id, to)
            .with_variable_output_policy(VariableOutputPolicy::Exactly(2))
            .determine_missing_contracts(None)
            .await
            .unwrap()
            .call()
            .await
            .unwrap()
    }

    pub async fn burn(
        contract: &MiraAMM<WalletUnlocked>,
        pool_id: PoolId,
        to: Identity,
        lp_asset_id: AssetId,
        amount: u64,
    ) -> CallResponse<(u64, u64)> {
        let params = CallParameters::default().with_asset_id(lp_asset_id).with_amount(amount);
        contract
            .methods()
            .burn(pool_id, to)
            .call_params(params)
            .unwrap()
            .with_variable_output_policy(VariableOutputPolicy::Exactly(2))
            .determine_missing_contracts(None)
            .await
            .unwrap()
            .call()
            .await
            .unwrap()
    }

    pub async fn swap(
        contract: &MiraAMM<WalletUnlocked>,
        pool_id: PoolId,
        amount_0_out: u64,
        amount_1_out: u64,
        to: Identity,
        data: Option<Bytes>,
    ) -> CallResponse<()> {
        contract
            .methods()
            .swap(pool_id, amount_0_out, amount_1_out, to, data)
            .with_variable_output_policy(VariableOutputPolicy::Exactly(2))
            .determine_missing_contracts(None)
            .await
            .unwrap()
            .call()
            .await
            .unwrap()
    }

    pub async fn set_ownership(
        contract: &MiraAMM<WalletUnlocked>,
        new_owner: Identity,
    ) -> CallResponse<()> {
        contract.methods().transfer_ownership(new_owner).call().await.unwrap()
    }

    pub async fn set_hook(
        contract: &MiraAMM<WalletUnlocked>,
        hook_id: Option<ContractId>,
    ) -> CallResponse<()> {
        contract.methods().set_hook(hook_id).call().await.unwrap()
    }
}

pub mod mock {
    use crate::paths::MOCK_TOKEN_CONTRACT_BINARY_PATH;
    use fuels::prelude::VariableOutputPolicy;
    use fuels::programs::responses::CallResponse;
    use fuels::{
        programs::contract::{Contract, LoadConfiguration},
        types::{Bits256, ContractId},
    };

    use super::*;

    pub async fn deploy_mock_token_contract(
        wallet: &WalletUnlocked,
    ) -> (ContractId, MockToken<WalletUnlocked>) {
        let contract_id =
            Contract::load_from(MOCK_TOKEN_CONTRACT_BINARY_PATH, LoadConfiguration::default())
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
        contract.methods().add_token(name, symbol, decimals).call().await.unwrap()
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
        contract.methods().get_sub_id(asset_id).call().await.unwrap()
    }
}

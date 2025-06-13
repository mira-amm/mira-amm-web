use fuels::prelude::{
    AssetId, Contract, LoadConfiguration, Provider, StorageConfiguration, TxPolicies,
    WalletUnlocked,
};

pub mod common {
    use super::*;
    use fuels::test_helpers::{setup_multiple_assets_coins, setup_test_provider};

    use crate::{
        data_structures::{MiraAMMContract, WalletAssetConfiguration},
        interface::MiraAMM,
        paths::AMM_CONTRACT_BINARY_PATH,
    };

    pub async fn deploy_amm(wallet: &WalletUnlocked) -> MiraAMMContract {
        let configuration = LoadConfiguration::default()
            .with_storage_configuration(StorageConfiguration::default());

        let contract_id = Contract::load_from(AMM_CONTRACT_BINARY_PATH, configuration)
            .unwrap()
            .deploy(wallet, TxPolicies::default())
            .await
            .unwrap();

        let instance = MiraAMM::new(contract_id.clone(), wallet.clone());

        MiraAMMContract {
            instance,
            id: contract_id.into(),
        }
    }

    pub async fn setup_wallet_and_provider(
        asset_parameters: &WalletAssetConfiguration,
    ) -> (WalletUnlocked, Vec<AssetId>, Provider) {
        let mut wallet = WalletUnlocked::new_random(None);

        let (coins, asset_ids) = setup_multiple_assets_coins(
            wallet.address(),
            asset_parameters.number_of_assets,
            asset_parameters.coins_per_asset,
            asset_parameters.amount_per_coin,
        );

        let provider = setup_test_provider(coins.clone(), vec![], None, None)
            .await
            .unwrap();

        wallet.set_provider(provider.clone());

        (wallet, asset_ids, provider)
    }
}

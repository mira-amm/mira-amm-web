pub mod common {
    use fuels::types::{AssetId, Bits256};

    pub fn order_token_ids(pair: (AssetId, AssetId)) -> (AssetId, AssetId) {
        if pair.0 < pair.1 {
            (pair.0, pair.1)
        } else {
            (pair.1, pair.0)
        }
    }
    pub fn order_sub_ids(
        asset_ids: (AssetId, AssetId),
        sub_ids: (Bits256, Bits256),
    ) -> (Bits256, Bits256) {
        if asset_ids.0 < asset_ids.1 {
            (sub_ids.0, sub_ids.1)
        } else {
            (sub_ids.1, sub_ids.0)
        }
    }
}

pub mod mock {
    use fuels::{accounts::wallet::WalletUnlocked, types::ContractId};

    use crate::interface::mock;

    pub async fn deploy_2_mock_tokens(
        wallet: &WalletUnlocked,
        name_0: String,
        symbol_0: String,
        decimals_0: u8,
        name_1: String,
        symbol_1: String,
        decimals_1: u8,
    ) -> ContractId {
        let (token_contract_id, token_contract) = mock::deploy_mock_token_contract(wallet).await;

        mock::add_token(&token_contract, name_0, symbol_0, decimals_0).await.tx_id.unwrap();
        mock::add_token(&token_contract, name_1, symbol_1, decimals_1).await.tx_id.unwrap();

        token_contract_id
    }
}

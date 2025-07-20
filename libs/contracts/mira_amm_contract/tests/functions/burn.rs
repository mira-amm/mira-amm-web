mod success {
    use crate::utils::setup;
    use fuels::accounts::Account;
    use fuels::prelude::{TxPolicies, ViewOnlyAccount};
    use test_harness::data_structures::MiraAMMContract;
    use test_harness::interface::amm::{burn, create_pool, mint, pool_metadata};
    use test_harness::interface::Asset;

    #[tokio::test]
    async fn test_burn() {
        let (
            MiraAMMContract { id: amm_id, instance: amm },
            wallet,
            token_contract_id,
            token_contract,
            (token_0_id, token_1_id),
            (token_0_sub_id, token_1_sub_id),
        ) = setup().await;
        let pool_id = create_pool(
            &amm,
            &token_contract,
            token_contract_id,
            token_0_sub_id,
            token_contract_id,
            token_1_sub_id,
            false,
        )
        .await
        .value;
        let amm_address = amm_id.into();
        wallet
            .force_transfer_to_contract(&amm_address, 1_020_100, token_0_id, TxPolicies::default())
            .await
            .unwrap();
        wallet
            .force_transfer_to_contract(&amm_address, 10_000, token_1_id, TxPolicies::default())
            .await
            .unwrap();
        let Asset { id: lp_asset_id, amount: lp_amount } =
            mint(&amm, pool_id, wallet.address().into()).await.value;
        assert_eq!(lp_amount, 100_000);

        let wallet_0_balance = wallet.get_asset_balance(&token_0_id).await.unwrap();
        let wallet_1_balance = wallet.get_asset_balance(&token_1_id).await.unwrap();

        let burn_amount = 60_000;
        let (asset_0_out, asset_1_out) =
            burn(&amm, pool_id, wallet.address().into(), lp_asset_id, burn_amount).await.value;
        //total_liquidity = 101000
        //expected_token_0 = 60_000 * 1_020_100 / 101000 = 606_000
        //expected_token_1 = 60_000 * 10_000 / 101000 ~ 5940
        assert_eq!(asset_0_out, 606_000);
        assert_eq!(asset_1_out, 5940);
        assert_eq!(
            wallet.get_asset_balance(&token_0_id).await.unwrap(),
            wallet_0_balance + asset_0_out
        );
        assert_eq!(
            wallet.get_asset_balance(&token_1_id).await.unwrap(),
            wallet_1_balance + asset_1_out
        );
        assert_eq!(wallet.get_asset_balance(&lp_asset_id).await.unwrap(), 40_000);
        let pool_metadata = pool_metadata(&amm, pool_id).await.value.unwrap();
        assert_eq!(pool_metadata.reserve_0, 414_100);
        assert_eq!(pool_metadata.reserve_1, 4060);
        assert_eq!(pool_metadata.liquidity.amount, 41_000);
    }

    #[tokio::test]
    async fn test_burn_all() {
        let (
            MiraAMMContract { id: amm_id, instance: amm },
            wallet,
            token_contract_id,
            token_contract,
            (token_0_id, token_1_id),
            (token_0_sub_id, token_1_sub_id),
        ) = setup().await;
        let pool_id = create_pool(
            &amm,
            &token_contract,
            token_contract_id,
            token_0_sub_id,
            token_contract_id,
            token_1_sub_id,
            false,
        )
        .await
        .value;
        let amm_address = amm_id.into();
        wallet
            .force_transfer_to_contract(&amm_address, 1_020_100, token_0_id, TxPolicies::default())
            .await
            .unwrap();
        wallet
            .force_transfer_to_contract(&amm_address, 10_000, token_1_id, TxPolicies::default())
            .await
            .unwrap();
        let Asset { id: lp_asset_id, amount: lp_amount } =
            mint(&amm, pool_id, wallet.address().into()).await.value;
        assert_eq!(lp_amount, 100_000);

        let wallet_0_balance = wallet.get_asset_balance(&token_0_id).await.unwrap();
        let wallet_1_balance = wallet.get_asset_balance(&token_1_id).await.unwrap();

        let burn_amount = 100_000;
        let (asset_0_out, asset_1_out) =
            burn(&amm, pool_id, wallet.address().into(), lp_asset_id, burn_amount).await.value;
        //total_liquidity = 101000
        //expected_token_0 = 100_000 * 1_020_100 / 101000 = 1_010_000
        //expected_token_1 = 100_000 * 10_000 / 101000 ~ 9900
        assert_eq!(asset_0_out, 1_010_000);
        assert_eq!(asset_1_out, 9900);
        assert_eq!(
            wallet.get_asset_balance(&token_0_id).await.unwrap(),
            wallet_0_balance + asset_0_out
        );
        assert_eq!(
            wallet.get_asset_balance(&token_1_id).await.unwrap(),
            wallet_1_balance + asset_1_out
        );
        assert_eq!(wallet.get_asset_balance(&lp_asset_id).await.unwrap(), 0);
        let pool_metadata = pool_metadata(&amm, pool_id).await.value.unwrap();
        assert_eq!(pool_metadata.reserve_0, 10_100);
        assert_eq!(pool_metadata.reserve_1, 100);
        assert_eq!(pool_metadata.liquidity.amount, 1000);
    }
}

mod revert {
    use crate::utils::setup;
    use fuels::accounts::Account;
    use fuels::prelude::TxPolicies;
    use fuels::types::Identity;
    use test_harness::data_structures::MiraAMMContract;
    use test_harness::interface::amm::{burn, create_pool, mint};
    use test_harness::interface::Asset;

    #[tokio::test]
    #[should_panic(expected = "InvalidAsset")]
    async fn test_invalid_asset() {
        let (amm, wallet, _, _, (token_0_id, token_1_id), (_, _)) = setup().await;
        let pool_id = (token_0_id, token_1_id, false);
        let to = Identity::from(wallet.address());
        burn(&amm.instance, pool_id, to, token_0_id, 10).await;
    }

    #[tokio::test]
    #[should_panic(expected = "ZeroInputAmount")]
    async fn test_burn_zero_amount() {
        let (
            MiraAMMContract { id: amm_id, instance: amm },
            wallet,
            token_contract_id,
            token_contract,
            (token_0_id, token_1_id),
            (token_0_sub_id, token_1_sub_id),
        ) = setup().await;
        let pool_id = create_pool(
            &amm,
            &token_contract,
            token_contract_id,
            token_0_sub_id,
            token_contract_id,
            token_1_sub_id,
            false,
        )
        .await
        .value;
        let amm_address = amm_id.into();
        wallet
            .force_transfer_to_contract(&amm_address, 1_020_100, token_0_id, TxPolicies::default())
            .await
            .unwrap();
        wallet
            .force_transfer_to_contract(&amm_address, 10_000, token_1_id, TxPolicies::default())
            .await
            .unwrap();
        let Asset { id: lp_asset_id, amount: _ } =
            mint(&amm, pool_id, wallet.address().into()).await.value;
        burn(&amm, pool_id, wallet.address().into(), lp_asset_id, 0).await;
    }

    #[tokio::test]
    #[should_panic(expected = "TransferZeroCoins")]
    async fn test_burn_revert() {
        let (
            MiraAMMContract { id: amm_id, instance: amm },
            wallet,
            token_contract_id,
            token_contract,
            (token_0_id, token_1_id),
            (token_0_sub_id, token_1_sub_id),
        ) = setup().await;
        let pool_id = create_pool(
            &amm,
            &token_contract,
            token_contract_id,
            token_0_sub_id,
            token_contract_id,
            token_1_sub_id,
            false,
        )
        .await
        .value;
        let amm_address = amm_id.into();
        wallet
            .force_transfer_to_contract(&amm_address, 10201, token_0_id, TxPolicies::default())
            .await
            .unwrap();
        wallet
            .force_transfer_to_contract(&amm_address, 100, token_1_id, TxPolicies::default())
            .await
            .unwrap();
        let Asset { id: lp_asset_id, amount: lp_amount } =
            mint(&amm, pool_id, wallet.address().into()).await.value;
        assert_eq!(lp_amount, 10);
        //total_liquidity = 1010
        //burning all 10 LP tokens
        //expected_token_0 = 10 * 10201 / 1010 = 101
        //expected_token_1 = 10 * 100 / 1010 ~ 0.99 = 0 => revert with TransferZeroCoins
        burn(&amm, pool_id, wallet.address().into(), lp_asset_id, lp_amount).await;
    }
}

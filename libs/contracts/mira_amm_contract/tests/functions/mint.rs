mod success {
    use fuels::accounts::Account;
    use fuels::prelude::{TxPolicies, ViewOnlyAccount};
    use test_harness::data_structures::MiraAMMContract;
    use test_harness::interface::amm::{create_pool, mint, pool_metadata};
    use test_harness::interface::Asset;

    use crate::utils::setup;

    #[tokio::test]
    async fn test_mint() {
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

        let min_liquidity = 1000;

        let amm_address = amm_id.into();
        wallet
            .force_transfer_to_contract(&amm_address, 10201, token_0_id, TxPolicies::default())
            .await
            .unwrap();
        wallet
            .force_transfer_to_contract(&amm_address, 100, token_1_id, TxPolicies::default())
            .await
            .unwrap();
        let Asset { id: lp_id, amount: lp_amount_1 } =
            mint(&amm, pool_id, wallet.address().into()).await.value;
        let expected_lp_1 = 10; // sqrt(10201 * 100) - min_liquidity

        assert_eq!(wallet.get_asset_balance(&lp_id).await.unwrap(), expected_lp_1);
        assert_eq!(lp_amount_1, expected_lp_1);
        let pool_metadata = pool_metadata(&amm, pool_id).await.value.unwrap();
        assert_eq!(pool_metadata.reserve_0, 10201);
        assert_eq!(pool_metadata.reserve_1, 100);
        assert_eq!(pool_metadata.liquidity.amount, min_liquidity + expected_lp_1);

        wallet
            .force_transfer_to_contract(&amm_address, 10201, token_0_id, TxPolicies::default())
            .await
            .unwrap();
        wallet
            .force_transfer_to_contract(&amm_address, 100, token_1_id, TxPolicies::default())
            .await
            .unwrap();
        let Asset { id: _, amount: lp_amount_2 } =
            mint(&amm, pool_id, wallet.address().into()).await.value;
        let expected_lp_2 = 1010; // sqrt(10201 * 100)
        let expected_wallet_lp = expected_lp_1 + expected_lp_2;
        assert_eq!(wallet.get_asset_balance(&lp_id).await.unwrap(), expected_wallet_lp);
        assert_eq!(lp_amount_2, expected_lp_2);
        let pool_metadata =
            test_harness::interface::amm::pool_metadata(&amm, pool_id).await.value.unwrap();
        assert_eq!(pool_metadata.reserve_0, 20402);
        assert_eq!(pool_metadata.reserve_1, 200);
        assert_eq!(pool_metadata.liquidity.amount, expected_wallet_lp + min_liquidity);
    }
}

mod revert {
    use crate::utils::setup;
    use fuels::accounts::Account;
    use fuels::prelude::TxPolicies;
    use fuels::types::Identity;
    use test_harness::data_structures::MiraAMMContract;
    use test_harness::interface::amm::{create_pool, mint};

    #[tokio::test]
    #[should_panic(expected = "PoolDoesNotExist")]
    async fn test_no_pool() {
        let (amm, wallet, _, _, (token_0_id, token_1_id), (_, _)) = setup().await;
        let pool_id = (token_0_id, token_1_id, false);
        let to = Identity::from(wallet.address());
        mint(&amm.instance, pool_id, to).await;
    }

    #[tokio::test]
    #[should_panic(expected = "CannotAddLessThanMinimumLiquidity")]
    async fn test_no_liquidity() {
        let (
            MiraAMMContract { id: _, instance: amm },
            wallet,
            token_contract_id,
            token_contract,
            (_token_0_id, _token_1_id),
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
        mint(&amm, pool_id, wallet.address().into()).await;
    }

    #[tokio::test]
    #[should_panic(expected = "CannotAddLessThanMinimumLiquidity")]
    async fn test_min_liquidity() {
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
            .force_transfer_to_contract(&amm_address, 1000, token_0_id, TxPolicies::default())
            .await
            .unwrap();
        wallet
            .force_transfer_to_contract(&amm_address, 1000, token_1_id, TxPolicies::default())
            .await
            .unwrap();
        mint(&amm, pool_id, wallet.address().into()).await;
    }
}

mod success {
    use test_harness::data_structures::MiraAMMContract;
    use test_harness::interface::amm::{create_pool, pool_metadata};

    use crate::utils::setup;

    #[tokio::test]
    async fn creates_pool() {
        let (
            MiraAMMContract { id: _, instance: amm },
            _wallet,
            token_contract_id,
            token_contract,
            (token_a_id, token_b_id),
            (token_a_sub_id, token_b_sub_id),
        ) = setup().await;

        let pool_id = create_pool(
            &amm,
            &token_contract,
            token_contract_id,
            token_a_sub_id,
            token_contract_id,
            token_b_sub_id,
            false,
        )
        .await
        .value;

        assert_eq!(pool_id.0, token_a_id);
        assert_eq!(pool_id.1, token_b_id);
        assert_eq!(pool_id.2, false);

        let pool_metadata_request = pool_metadata(&amm, pool_id).await;
        assert_ne!(pool_metadata_request.value, None);

        let pool_metadata = pool_metadata_request.value.unwrap();
        assert_eq!(pool_metadata.reserve_0, 0);
        assert_eq!(pool_metadata.reserve_1, 0);
        assert_eq!(pool_metadata.decimals_0, 9);
        assert_eq!(pool_metadata.decimals_1, 9);
    }

    #[tokio::test]
    async fn creates_stable_pool() {
        let (
            MiraAMMContract { id: _, instance: amm },
            _wallet,
            token_contract_id,
            token_contract,
            (token_a_id, token_b_id),
            (token_a_sub_id, token_b_sub_id),
        ) = setup().await;

        let pool_id = create_pool(
            &amm,
            &token_contract,
            token_contract_id,
            token_a_sub_id,
            token_contract_id,
            token_b_sub_id,
            true,
        )
        .await
        .value;

        assert_eq!(pool_id.0, token_a_id);
        assert_eq!(pool_id.1, token_b_id);
        assert_eq!(pool_id.2, true);

        let pool_metadata_request = pool_metadata(&amm, pool_id).await;
        assert_ne!(pool_metadata_request.value, None);

        let pool_metadata = pool_metadata_request.value.unwrap();
        assert_eq!(pool_metadata.reserve_0, 0);
        assert_eq!(pool_metadata.reserve_1, 0);
        assert_eq!(pool_metadata.decimals_0, 9);
        assert_eq!(pool_metadata.decimals_1, 9);
    }
}

mod revert {
    use test_harness::data_structures::MiraAMMContract;
    use test_harness::interface::amm::create_pool;

    use crate::utils::setup;

    #[tokio::test]
    #[should_panic(expected = "IdenticalAssets")]
    async fn fails_to_create_pool_with_identical_assets() {
        let (
            MiraAMMContract { id: _, instance: amm },
            _wallet,
            token_contract_id,
            token_contract,
            _token_ids,
            (token_a_sub_id, _token_b_sub_id),
        ) = setup().await;

        create_pool(
            &amm,
            &token_contract,
            token_contract_id,
            token_a_sub_id,
            token_contract_id,
            token_a_sub_id,
            false,
        )
        .await
        .value;
    }
}

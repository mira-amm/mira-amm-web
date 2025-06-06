use crate::utils::{Setup, Setup2};
use fuels::accounts::Account;
use fuels::prelude::TxPolicies;
use fuels::types::{AssetId, Bits256};
use test_harness::data_structures::MiraAMMContract;
use test_harness::interface::amm::{create_pool, mint};
use test_harness::types::PoolId;

async fn setup_pool(setup: &Setup, stable_pool: bool) -> PoolId {
    let (
        MiraAMMContract { id: amm_id, instance: amm },
        wallet,
        token_contract_id,
        token_contract,
        (token_0_id, token_1_id),
        (token_0_sub_id, token_1_sub_id),
    ) = setup;
    let pool_id = create_pool(
        &amm,
        &token_contract,
        *token_contract_id,
        *token_0_sub_id,
        *token_contract_id,
        *token_1_sub_id,
        stable_pool,
    )
    .await
    .value;
    let amm_address = amm_id.clone().into();
    wallet
        .force_transfer_to_contract(&amm_address, 1_020_100, *token_0_id, TxPolicies::default())
        .await
        .unwrap();
    wallet
        .force_transfer_to_contract(&amm_address, 10_000, *token_1_id, TxPolicies::default())
        .await
        .unwrap();
    mint(&amm, pool_id, wallet.address().into()).await.value;
    pool_id
}

async fn setup_pool_2(
    setup: &Setup2,
    token_0_id: &AssetId,
    token_1_id: &AssetId,
    token_0_sub_id: &Bits256,
    token_1_sub_id: &Bits256,
    stable_pool: bool,
) -> PoolId {
    let (
        MiraAMMContract { id: amm_id, instance: amm },
        wallet,
        token_contract_id,
        token_contract,
        tokens,
    ) = setup;
    let pool_id = create_pool(
        &amm,
        &token_contract,
        *token_contract_id,
        *token_0_sub_id,
        *token_contract_id,
        *token_1_sub_id,
        stable_pool,
    )
    .await
    .value;
    let amm_address = amm_id.clone().into();
    wallet
        .force_transfer_to_contract(&amm_address, 1_020_100, *token_0_id, TxPolicies::default())
        .await
        .unwrap();
    wallet
        .force_transfer_to_contract(&amm_address, 10_000, *token_1_id, TxPolicies::default())
        .await
        .unwrap();
    mint(&amm, pool_id, wallet.address().into()).await.value;
    pool_id
}

mod success {
    use crate::functions::swap::setup_pool;
    use crate::utils::setup;
    use fuels::accounts::Account;
    use fuels::prelude::{TxPolicies, ViewOnlyAccount};
    use fuels::types::Identity;
    use test_harness::interface::amm::{pool_metadata, swap};

    #[tokio::test]
    async fn test_swap_volatile() {
        let setup = setup().await;
        let pool_id = setup_pool(&setup, false).await;
        let wallet = setup.1;
        let amm = setup.0;
        let (token_0_id, token_1_id) = setup.4;
        let to = Identity::from(wallet.address());
        let amm_address = amm.id.into();

        let pool_info = pool_metadata(&amm.instance, pool_id).await.value.unwrap();

        wallet
            .force_transfer_to_contract(&amm_address, 1000, token_0_id, TxPolicies::default())
            .await
            .unwrap();
        let wallet_0_balance = wallet.get_asset_balance(&token_0_id).await.unwrap();
        let wallet_1_balance = wallet.get_asset_balance(&token_1_id).await.unwrap();
        let requested_0 = 78;
        let requested_1 = 9;
        swap(&amm.instance, pool_id, requested_0, requested_1, to, None).await;
        assert_eq!(
            wallet.get_asset_balance(&token_0_id).await.unwrap(),
            wallet_0_balance + requested_0
        );
        assert_eq!(
            wallet.get_asset_balance(&token_1_id).await.unwrap(),
            wallet_1_balance + requested_1
        );

        let last_pool_metadata = pool_metadata(&amm.instance, pool_id).await.value.unwrap();
        assert_eq!(last_pool_metadata.reserve_0, pool_info.reserve_0 + 1000 - requested_0);
        assert_eq!(last_pool_metadata.reserve_1, pool_info.reserve_1 - requested_1);
        assert_eq!(last_pool_metadata.liquidity, pool_info.liquidity);
    }

    #[tokio::test]
    async fn test_swap_stable() {
        let setup = setup().await;
        let pool_id = setup_pool(&setup, true).await;
        let wallet = setup.1;
        let amm = setup.0;
        let (token_0_id, token_1_id) = setup.4;
        let to = Identity::from(wallet.address());
        let amm_address = amm.id.into();

        let pool_info = pool_metadata(&amm.instance, pool_id).await.value.unwrap();

        wallet
            .force_transfer_to_contract(&amm_address, 1000, token_0_id, TxPolicies::default())
            .await
            .unwrap();
        let wallet_0_balance = wallet.get_asset_balance(&token_0_id).await.unwrap();
        let wallet_1_balance = wallet.get_asset_balance(&token_1_id).await.unwrap();
        let requested_1 = 29;
        swap(&amm.instance, pool_id, 0, requested_1, to, None).await;
        assert_eq!(wallet.get_asset_balance(&token_0_id).await.unwrap(), wallet_0_balance);
        assert_eq!(
            wallet.get_asset_balance(&token_1_id).await.unwrap(),
            wallet_1_balance + requested_1
        );

        let last_pool_metadata = pool_metadata(&amm.instance, pool_id).await.value.unwrap();
        assert_eq!(last_pool_metadata.reserve_0, pool_info.reserve_0 + 1000);
        assert_eq!(last_pool_metadata.reserve_1, pool_info.reserve_1 - requested_1);
        assert_eq!(last_pool_metadata.liquidity, pool_info.liquidity);
    }
}

mod revert {
    use crate::functions::swap::{setup_pool, setup_pool_2};
    use crate::utils::{setup, setup_multipool};
    use fuels::accounts::Account;
    use fuels::prelude::TxPolicies;
    use fuels::types::Identity;
    use test_harness::data_structures::MiraAMMContract;
    use test_harness::interface::amm::{create_pool, swap};

    #[tokio::test]
    #[should_panic(expected = "PoolDoesNotExist")]
    async fn test_no_pool() {
        let (amm, wallet, _, _, (token_0_id, token_1_id), (_, _)) = setup().await;
        let pool_id = (token_0_id, token_1_id, false);
        let to = Identity::from(wallet.address());
        swap(&amm.instance, pool_id, 10, 10, to, None).await;
    }

    #[tokio::test]
    #[should_panic(expected = "InsufficientLiquidity")]
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
        let to = Identity::from(wallet.address());
        swap(&amm, pool_id, 10, 10, to, None).await;
    }

    #[tokio::test]
    #[should_panic(expected = "ZeroInputAmount")]
    async fn test_zero_input_amount() {
        let setup = setup().await;
        let pool_id = setup_pool(&setup, false).await;
        let to = Identity::from(setup.1.address());
        swap(&setup.0.instance, pool_id, 0, 15, to, None).await;
    }

    #[tokio::test]
    #[should_panic(expected = "CurveInvariantViolation")]
    async fn test_swap_violate_curve() {
        let setup = setup().await;
        let pool_id = setup_pool(&setup, false).await;
        let wallet = setup.1;
        let amm = setup.0;
        let (token_0_id, _token_1_id) = setup.4;
        let to = Identity::from(wallet.address());
        let amm_address = amm.id.into();
        wallet
            .force_transfer_to_contract(&amm_address, 1000, token_0_id, TxPolicies::default())
            .await
            .unwrap();
        swap(&amm.instance, pool_id, 0, 10, to, None).await;
    }

    #[tokio::test]
    // #[should_panic(expected = "CurveInvariantViolation")]
    #[should_panic()]
    async fn test_multiple_pool_swap_violate_curve() {
        let setup = setup_multipool().await;
        let pool_id_a = setup_pool_2(
            &setup,
            &setup.4.get(0).unwrap().0,
            &setup.4.get(1).unwrap().0,
            &setup.4.get(0).unwrap().1,
            &setup.4.get(1).unwrap().1,
            false,
        )
        .await;
        let pool_id_b = setup_pool_2(
            &setup,
            &setup.4.get(1).unwrap().0,
            &setup.4.get(2).unwrap().0,
            &setup.4.get(1).unwrap().1,
            &setup.4.get(2).unwrap().1,
            false,
        )
        .await;

        let wallet = setup.1;
        let amm = setup.0;

        let to = Identity::from(wallet.address());
        let amm_address = amm.id.into();
        wallet
            .force_transfer_to_contract(
                &amm_address,
                1000,
                setup.4.get(0).unwrap().0,
                TxPolicies::default(),
            )
            .await
            .unwrap();
        swap(&amm.instance, pool_id_a, 0, 10, to, None).await;
    }

    #[tokio::test]
    #[should_panic(expected = "CurveInvariantViolation")]
    async fn test_swap_stable_violate_curve() {
        let setup = setup().await;
        let pool_id = setup_pool(&setup, true).await;
        let wallet = setup.1;
        let amm = setup.0;
        let (token_0_id, _) = setup.4;
        let to = Identity::from(wallet.address());
        let amm_address = amm.id.into();
        wallet
            .force_transfer_to_contract(&amm_address, 1000, token_0_id, TxPolicies::default())
            .await
            .unwrap();
        swap(&amm.instance, pool_id, 0, 30, to, None).await;
    }

    #[tokio::test]
    #[should_panic(expected = "InsufficientLiquidity")]
    async fn test_swap_insufficient_liquidity() {
        let setup = setup().await;
        let pool_id = setup_pool(&setup, false).await;
        let wallet = setup.1;
        let amm = setup.0;
        let (token_0_id, _) = setup.4;
        let to = Identity::from(wallet.address());
        let amm_address = amm.id.into();
        wallet
            .force_transfer_to_contract(&amm_address, 1000, token_0_id, TxPolicies::default())
            .await
            .unwrap();
        swap(&amm.instance, pool_id, 0, 10_000, to, None).await;
    }
}

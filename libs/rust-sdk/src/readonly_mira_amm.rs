use crate::constants::{DEFAULT_AMM_CONTRACT_ID, READONLY_PRIVATE_KEY};
use crate::interface::{AmmFees, Asset, LpAssetInfo, MiraAmmContract, PoolId, PoolMetadata, State};
use fuels::crypto::SecretKey;
use fuels::prelude::{AssetId, Bech32ContractId, Execution, Provider, Result, TxPolicies, WalletUnlocked};
use fuels::types::{ContractId, Identity};
use std::str::FromStr;

pub struct ReadonlyMiraAmm {
    provider: Provider,
    amm_contract: MiraAmmContract<WalletUnlocked>,
}

fn sufficient_tx_policies() -> TxPolicies {
    TxPolicies::default().with_max_fee(1_000_000_000)
}

impl ReadonlyMiraAmm {
    pub fn connect(provider: &Provider, contract_id: Option<ContractId>) -> Result<Self> {
        let readonly_secret_key = SecretKey::from_str(READONLY_PRIVATE_KEY)?;
        let readonly_wallet = WalletUnlocked::new_from_private_key(readonly_secret_key, Some(provider.clone()));
        let amm_contract = MiraAmmContract::new(contract_id.unwrap_or(ContractId::from_str(DEFAULT_AMM_CONTRACT_ID).unwrap()), readonly_wallet);

        Ok(Self {
            provider: provider.clone(),
            amm_contract,
        })
    }

    pub fn id(&self) -> &Bech32ContractId {
        self.amm_contract.contract_id()
    }

    pub async fn pool_metadata(&self, pool_id: PoolId) -> Result<Option<PoolMetadata>> {
        Ok(self.amm_contract
            .methods()
            .pool_metadata(pool_id)
            .with_tx_policies(sufficient_tx_policies())
            .simulate(Execution::StateReadOnly)
            .await?
            .value)
    }

    pub async fn fees(&self) -> Result<AmmFees> {
        let (lp_fee_volatile, lp_fee_stable, protocol_fee_volatile, protocol_fee_stable) = self.amm_contract
            .methods()
            .fees()
            .with_tx_policies(sufficient_tx_policies())
            .simulate(Execution::StateReadOnly)
            .await?
            .value;
        Ok(AmmFees {
            lp_fee_volatile,
            lp_fee_stable,
            protocol_fee_volatile,
            protocol_fee_stable,
        })
    }

    pub async fn hook(&self) -> Result<Option<ContractId>> {
        Ok(self.amm_contract
            .methods()
            .hook()
            .with_tx_policies(sufficient_tx_policies())
            .simulate(Execution::StateReadOnly)
            .await?
            .value)
    }

    pub async fn total_assets(&self) -> Result<u64> {
        Ok(self.amm_contract
            .methods()
            .total_assets()
            .with_tx_policies(sufficient_tx_policies())
            .simulate(Execution::StateReadOnly)
            .await?
            .value)
    }

    pub async fn lp_asset_info(&self, asset_id: AssetId) -> Result<Option<LpAssetInfo>> {
        let name = self.amm_contract
            .methods()
            .name(asset_id)
            .with_tx_policies(sufficient_tx_policies())
            .simulate(Execution::StateReadOnly)
            .await?
            .value;
        let symbol = self.amm_contract
            .methods()
            .symbol(asset_id)
            .with_tx_policies(sufficient_tx_policies())
            .simulate(Execution::StateReadOnly)
            .await?
            .value;
        let decimals = self.amm_contract
            .methods()
            .decimals(asset_id)
            .with_tx_policies(sufficient_tx_policies())
            .simulate(Execution::StateReadOnly)
            .await?
            .value;
        let total_supply = self.amm_contract
            .methods()
            .total_supply(asset_id)
            .with_tx_policies(sufficient_tx_policies())
            .simulate(Execution::StateReadOnly)
            .await?
            .value;

        match (name, symbol, decimals, total_supply) {
            (Some(name), Some(symbol), Some(decimals), Some(total_supply)) => {
                Ok(Some(LpAssetInfo {
                    asset_id,
                    name,
                    symbol,
                    decimals,
                    total_supply,
                }))
            }
            _ => Ok(None),
        }
    }

    pub async fn owner(&self) -> Result<Option<Identity>> {
        let ownership_state = self.amm_contract
            .methods()
            .owner()
            .with_tx_policies(sufficient_tx_policies())
            .simulate(Execution::StateReadOnly)
            .await?
            .value;
        match ownership_state {
            State::Uninitialized => { Ok(None) }
            State::Initialized(owner) => { Ok(Some(owner)) }
            State::Revoked => { Ok(None) }
        }
    }

    pub async fn preview_add_liquidity(
        &self,
        pool_id: PoolId,
        amount_0_desired: u64,
        amount_1_desired: u64,
        amount_0_min: u64,
        amount_1_min: u64,
    ) -> Result<Asset> {
        panic!("Not implemented");
    }

    pub async fn preview_remove_liquidity(
        &self,
        pool_id: PoolId,
        liquidity: u64,
        amount_0_min: u64,
        amount_1_min: u64,
    ) -> Result<(u64, u64)> {
        panic!("Not implemented");
    }

    pub async fn preview_swap_exact_input(
        &self,
        amount_in: u64,
        asset_in: AssetId,
        pools: Vec<PoolId>,
    ) -> Result<Asset> {
        panic!("Not implemented");
    }

    pub async fn swap_exact_output(
        &self,
        amount_out: u64,
        asset_out: AssetId,
        pools: Vec<PoolId>,
    ) -> Result<Asset> {
        panic!("Not implemented");
    }
}

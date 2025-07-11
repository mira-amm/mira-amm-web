use crate::constants::DEFAULT_AMM_CONTRACT_ID;
use crate::interface::{AddLiquidityScript, AddLiquidityScriptConfigurables, MiraAmmContract, MiraAmmContractConfigurables, PoolId, RemoveLiquidityScript, RemoveLiquidityScriptConfigurables, SwapExactInputScript, SwapExactInputScriptConfigurables, SwapExactOutputScript, SwapExactOutputScriptConfigurables, ADD_LIQUIDITY_SCRIPT_BINARY_PATH, AMM_CONTRACT_BINARY_PATH, REMOVE_LIQUIDITY_SCRIPT_BINARY_PATH, SWAP_EXACT_INPUT_SCRIPT_BINARY_PATH, SWAP_EXACT_OUTPUT_SCRIPT_BINARY_PATH};
use crate::utils::{get_asset_id_in, get_lp_asset_id, get_transaction_inputs_outputs};
use fuels::prelude::{AssetId, Bech32ContractId, Contract, LoadConfiguration, Result, ScriptTransaction, TxPolicies, VariableOutputPolicy, ViewOnlyAccount, WalletUnlocked};
use fuels::types::ContractId;
use rand::Rng;
use std::str::FromStr;

pub struct MiraAmm {
    wallet: WalletUnlocked,
    amm_contract: MiraAmmContract<WalletUnlocked>,
    add_liquidity_script: AddLiquidityScript<WalletUnlocked>,
    remove_liquidity_script: RemoveLiquidityScript<WalletUnlocked>,
    swap_exact_input_script: SwapExactInputScript<WalletUnlocked>,
    swap_exact_output_script: SwapExactOutputScript<WalletUnlocked>,
}

impl MiraAmm {
    pub async fn deploy(
        owner: &WalletUnlocked,
        lp_fees: Option<(u64, u64)>,
        tx_policies: Option<TxPolicies>,
    ) -> Result<Bech32ContractId> {
        let mut rng = rand::thread_rng();

        let configurables = match lp_fees {
            Some((volatile_fee, stable_fee)) => {
                MiraAmmContractConfigurables::default()
                    .with_LP_FEE_VOLATILE(volatile_fee)?
                    .with_LP_FEE_STABLE(stable_fee)?
            }
            None => MiraAmmContractConfigurables::default()
        };

        let id = Contract::load_from(
            AMM_CONTRACT_BINARY_PATH,
            LoadConfiguration::default().with_configurables(configurables),
        )?
            .with_salt(rng.gen::<[u8; 32]>())
            .deploy(owner, tx_policies.unwrap_or(TxPolicies::default()))
            .await?;

        Ok(id)
    }

    pub fn connect(wallet: &WalletUnlocked, contract_id: Option<ContractId>) -> Self {
        let amm_contract = MiraAmmContract::new(contract_id.unwrap_or(ContractId::from_str(DEFAULT_AMM_CONTRACT_ID).unwrap()), wallet.clone());
        let add_liquidity_script =
            AddLiquidityScript::new(wallet.clone(), ADD_LIQUIDITY_SCRIPT_BINARY_PATH)
                .with_configurables(AddLiquidityScriptConfigurables::default().with_AMM_CONTRACT_ID(amm_contract.contract_id().into()).unwrap());
        let remove_liquidity_script =
            RemoveLiquidityScript::new(wallet.clone(), REMOVE_LIQUIDITY_SCRIPT_BINARY_PATH)
                .with_configurables(RemoveLiquidityScriptConfigurables::default().with_AMM_CONTRACT_ID(amm_contract.contract_id().into()).unwrap());
        let swap_exact_input_script =
            SwapExactInputScript::new(wallet.clone(), SWAP_EXACT_INPUT_SCRIPT_BINARY_PATH)
                .with_configurables(SwapExactInputScriptConfigurables::default().with_AMM_CONTRACT_ID(amm_contract.contract_id().into()).unwrap());
        let swap_exact_output_script =
            SwapExactOutputScript::new(wallet.clone(), SWAP_EXACT_OUTPUT_SCRIPT_BINARY_PATH)
                .with_configurables(SwapExactOutputScriptConfigurables::default().with_AMM_CONTRACT_ID(amm_contract.contract_id().into()).unwrap());

        Self {
            wallet: wallet.clone(),
            amm_contract,
            add_liquidity_script,
            remove_liquidity_script,
            swap_exact_input_script,
            swap_exact_output_script,
        }
    }

    pub fn id(&self) -> &Bech32ContractId {
        self.amm_contract.contract_id()
    }

    pub async fn add_liquidity(
        &self,
        pool_id: PoolId,
        amount_0_desired: u64,
        amount_1_desired: u64,
        amount_0_min: u64,
        amount_1_min: u64,
        deadline: u32,
        tx_policies: Option<TxPolicies>,
    ) -> Result<ScriptTransaction> {
        let (inputs, outputs) = get_transaction_inputs_outputs(
            &self.wallet,
            &vec![(pool_id.0, amount_0_desired), (pool_id.1, amount_1_desired)],
        ).await;
        self
            .add_liquidity_script
            .main(pool_id, amount_0_desired, amount_1_desired, amount_0_min, amount_1_min, self.wallet.address().into(), deadline)
            .with_tx_policies(tx_policies.unwrap_or(TxPolicies::default()))
            .with_contracts(&[&self.amm_contract])
            .with_inputs(inputs)
            .with_outputs(outputs)
            .with_variable_output_policy(VariableOutputPolicy::Exactly(1))
            .build_tx()
            .await
    }

    pub async fn remove_liquidity(
        &self,
        pool_id: PoolId,
        liquidity: u64,
        amount_0_min: u64,
        amount_1_min: u64,
        deadline: u32,
        tx_policies: Option<TxPolicies>,
    ) -> Result<ScriptTransaction> {
        let lp_asset_id = get_lp_asset_id(self.id().into(), &pool_id);
        let (inputs, outputs) = get_transaction_inputs_outputs(
            &self.wallet,
            &vec![(lp_asset_id, liquidity)],
        ).await;
        self
            .remove_liquidity_script
            .main(pool_id, liquidity, amount_0_min, amount_1_min, self.wallet.address().into(), deadline)
            .with_tx_policies(tx_policies.unwrap_or(TxPolicies::default()))
            .with_contracts(&[&self.amm_contract])
            .with_inputs(inputs)
            .with_outputs(outputs)
            .with_variable_output_policy(VariableOutputPolicy::Exactly(2))
            .build_tx()
            .await
    }

    pub async fn swap_exact_input(
        &self,
        amount_in: u64,
        asset_in: AssetId,
        amount_out_min: u64,
        pools: Vec<PoolId>,
        deadline: u32,
        tx_policies: Option<TxPolicies>,
    ) -> Result<ScriptTransaction> {
        let (inputs, outputs) = get_transaction_inputs_outputs(
            &self.wallet,
            &vec![(asset_in, amount_in)],
        ).await;
        self
            .swap_exact_input_script
            .main(amount_in, asset_in, amount_out_min, pools, self.wallet.address().into(), deadline)
            .with_tx_policies(tx_policies.unwrap_or(TxPolicies::default()))
            .with_contracts(&[&self.amm_contract])
            .with_inputs(inputs)
            .with_outputs(outputs)
            .with_variable_output_policy(VariableOutputPolicy::Exactly(1))
            .build_tx()
            .await
    }

    pub async fn swap_exact_output(
        &self,
        amount_out: u64,
        asset_out: AssetId,
        amount_in_max: u64,
        pools: Vec<PoolId>,
        deadline: u32,
        tx_policies: Option<TxPolicies>,
    ) -> Result<ScriptTransaction> {
        let asset_in = get_asset_id_in(asset_out, &pools);
        let (inputs, outputs) = get_transaction_inputs_outputs(
            &self.wallet,
            &vec![(asset_in, amount_in_max)],
        ).await;
        self
            .swap_exact_output_script
            .main(amount_out, asset_out, amount_in_max, pools, self.wallet.address().into(), deadline)
            .with_tx_policies(tx_policies.unwrap_or(TxPolicies::default()))
            .with_contracts(&[&self.amm_contract])
            .with_inputs(inputs)
            .with_outputs(outputs)
            .with_variable_output_policy(VariableOutputPolicy::Exactly(1))
            .build_tx()
            .await
    }
}

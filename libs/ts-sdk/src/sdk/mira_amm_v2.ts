import {
  Account,
  AccountCoinQuantity,
  Address,
  AssetId,
  BigNumberish,
  BN,
  CoinQuantityLike,
  ScriptTransactionRequest,
  hexlify,
  bn,
} from "fuels";

import {DEFAULT_AMM_V2_CONTRACT_ID} from "./constants";

import {
  AddLiquidity,
  RemoveLiquidity,
  SwapExactIn,
  SwapExactOut,
} from "./typegen/scripts-v2";

import {PoolCurveState} from "./typegen/contracts-v2";

import {
  PoolIdV2,
  PoolInput,
  BinIdDelta,
  TxParams,
  PrepareRequestOptions,
  MiraV2Error,
  PoolCurveStateError,
} from "./model";

import {
  addressInput,
  assetInput,
  contractIdInput,
  poolIdV2Input,
  getLPAssetIdV2,
} from "./utils";

type TransactionWithGasPrice = {
  transactionRequest: ScriptTransactionRequest;
  gasPrice: BN;
};

export class MiraAmmV2 {
  private readonly account: Account;
  private readonly ammContract: PoolCurveState;
  private readonly addLiquidityScript: AddLiquidity;
  private readonly removeLiquidityScript: RemoveLiquidity;
  private readonly swapExactInScript: SwapExactIn;
  private readonly swapExactOutScript: SwapExactOut;

  constructor(account: Account, contractIdOpt?: string) {
    const contractId = contractIdOpt ?? DEFAULT_AMM_V2_CONTRACT_ID;
    const contractIdConfigurables = {
      POOL_CURVE_STATE: contractIdInput(contractId),
    };

    this.account = account;
    this.ammContract = new PoolCurveState(contractId, account);

    this.addLiquidityScript = new AddLiquidity(
      account
    ).setConfigurableConstants(contractIdConfigurables);
    this.removeLiquidityScript = new RemoveLiquidity(
      account
    ).setConfigurableConstants(contractIdConfigurables);
    this.swapExactInScript = new SwapExactIn(account).setConfigurableConstants(
      contractIdConfigurables
    );
    this.swapExactOutScript = new SwapExactOut(
      account
    ).setConfigurableConstants(contractIdConfigurables);
  }

  id(): string {
    return this.ammContract.id.toB256();
  }

  /**
   * Adds liquidity to a v2 pool with binned liquidity distribution
   *
   * @param poolId - The v2 pool ID (BN)
   * @param amountADesired - Desired amount of token A to add
   * @param amountBDesired - Desired amount of token B to add
   * @param amountAMin - Minimum amount of token A (slippage protection)
   * @param amountBMin - Minimum amount of token B (slippage protection)
   * @param deadline - Transaction deadline timestamp
   * @param activeIdDesired - Desired active bin ID for liquidity distribution
   * @param idSlippage - Allowed slippage in bin IDs
   * @param deltaIds - Array of bin ID deltas for liquidity distribution
   * @param distributionX - Distribution percentages for token X across bins
   * @param distributionY - Distribution percentages for token Y across bins
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  async addLiquidity(
    poolId: PoolIdV2,
    amountADesired: BigNumberish,
    amountBDesired: BigNumberish,
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    deadline: BigNumberish,
    activeIdDesired?: BigNumberish,
    idSlippage?: BigNumberish,
    deltaIds?: BinIdDelta[],
    distributionX?: BigNumberish[],
    distributionY?: BigNumberish[],
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    try {
      // Get pool metadata to determine asset order
      const poolMetadata = await this.ammContract.functions
        .get_pool(poolIdV2Input(poolId))
        .get();

      if (!poolMetadata.value) {
        throw new MiraV2Error(
          PoolCurveStateError.PoolNotFound,
          `Pool with ID ${poolId.toString()} not found`
        );
      }

      const pool = poolMetadata.value.pool;

      // Default values for v2-specific parameters
      const finalActiveIdDesired =
        activeIdDesired ?? poolMetadata.value.active_id;
      const finalIdSlippage = idSlippage ?? 0;
      const finalDeltaIds = deltaIds ?? [];
      const finalDistributionX = distributionX ?? [];
      const finalDistributionY = distributionY ?? [];

      // Prepare the AddLiquidityParameters
      const addLiquidityParams = {
        pool: {
          asset_x: pool.asset_x,
          asset_y: pool.asset_y,
          bin_step: pool.bin_step,
          base_factor: pool.base_factor,
        },
        amount_x: amountADesired,
        amount_y: amountBDesired,
        amount_x_min: amountAMin,
        amount_y_min: amountBMin,
        active_id_desired: finalActiveIdDesired,
        id_slippage: finalIdSlippage,
        delta_ids: finalDeltaIds,
        distribution_x: finalDistributionX,
        distribution_y: finalDistributionY,
        to: {Address: addressInput(this.account.address)},
        refund_to: {Address: addressInput(this.account.address)},
        deadline,
      };

      // Call the add liquidity script
      let request = await this.addLiquidityScript.functions
        .main(addLiquidityParams)
        .addContracts([this.ammContract])
        .txParams(txParams ?? {})
        .getTransactionRequest();

      // Prepare input assets for funding
      const inputAssets = [
        {
          assetId: pool.asset_x.bits,
          amount: amountADesired,
        },
        {
          assetId: pool.asset_y.bits,
          amount: amountBDesired,
        },
      ];

      return await this.prepareRequest(request, 2, inputAssets, [], options);
    } catch (error) {
      if (error instanceof MiraV2Error) {
        throw error;
      }

      // Wrap other errors in MiraV2Error
      throw new MiraV2Error(
        PoolCurveStateError.InvalidParameters,
        `Failed to add liquidity: ${error instanceof Error ? error.message : String(error)}`,
        {poolId, amountADesired, amountBDesired, error}
      );
    }
  }

  private async fundRequest(
    request: ScriptTransactionRequest
  ): Promise<ScriptTransactionRequest> {
    const gasCost = await this.account.getTransactionCost(request);
    return await this.account.fund(request, gasCost);
  }

  private async prepareRequest(
    request: ScriptTransactionRequest,
    variableOutputs: number = 0,
    inputAssets: CoinQuantityLike[] = [],
    inputContracts: string[] = [],
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    if (variableOutputs > 0) {
      request.addVariableOutputs(variableOutputs);
    }

    const uniqueContracts = new Set(
      inputContracts.map((c) => Address.fromAddressOrString(c))
    );
    for (const contract of uniqueContracts) {
      request.addContractInputAndOutput(contract);
    }

    if (options?.fundTransaction !== false) {
      const accountCoinMap = new Map<string, AccountCoinQuantity>();

      for (const asset of inputAssets) {
        const coin = Array.isArray(asset)
          ? {amount: asset[0], assetId: asset[1]}
          : {amount: asset.amount, assetId: asset.assetId};

        const assetId =
          typeof coin.assetId === "string"
            ? coin.assetId
            : hexlify(coin.assetId);

        if (accountCoinMap.has(assetId)) {
          const existing = accountCoinMap.get(assetId)!;
          existing.amount = bn(existing.amount).add(coin.amount);
        } else {
          accountCoinMap.set(assetId, {
            amount: coin.amount,
            assetId,
            account: this.account,
            changeOutputAccount: this.account,
          });
        }
      }

      const baseAssetId = (
        await this.account.provider.getBaseAssetId()
      ).toString();

      // Ensure the base asset is included to cover transaction fees (gas).
      // Fallback placeholder amount of 1; the real fee will be estimated during assembleTx
      if (!accountCoinMap.has(baseAssetId)) {
        accountCoinMap.set(baseAssetId, {
          amount: bn(1),
          assetId: baseAssetId,
          account: this.account,
          changeOutputAccount: this.account,
        });
      }

      const accountCoinQuantities = Array.from(accountCoinMap.values());

      const {assembledRequest, gasPrice} =
        await this.account.provider.assembleTx({
          request,
          feePayerAccount: this.account,
          accountCoinQuantities,
        });

      return {transactionRequest: assembledRequest, gasPrice};
    }

    // Legacy/manual fallback
    request.addResources(await this.account.getResourcesToSpend(inputAssets));
    request = await this.fundRequest(request);
    const {gasPrice} = await this.account.getTransactionCost(request);
    await this.account.provider.estimateTxDependencies(request);
    return {transactionRequest: request, gasPrice};
  }
}

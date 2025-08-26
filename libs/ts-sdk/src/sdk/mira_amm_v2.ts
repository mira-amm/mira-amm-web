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
  sha256,
  arrayify,
  concat,
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
  LiquidityConfig,
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
  getAssetId,
} from "./utils";

import {
  withErrorHandling,
  createErrorContext,
  EnhancedMiraV2Error,
} from "./errors";

import {
  validatePoolId,
  validateAssetId,
  validateSwapParams,
  validateAddLiquidityParams,
  validateRemoveLiquidityParams,
  validatePoolInput,
  validateBinId,
  validateAmount,
  validateDeadline,
  validateLiquidityConfig,
  DEFAULT_VALIDATION_OPTIONS,
} from "./validation";

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
    const context = createErrorContext("addLiquidity", {poolId});

    // Validate input parameters
    validateAddLiquidityParams(
      poolId,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      deadline,
      DEFAULT_VALIDATION_OPTIONS,
      context
    );

    return withErrorHandling(async () => {
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
      const finalDeltaIds =
        deltaIds?.map((delta) => {
          if (delta.Positive !== undefined) {
            return {Positive: delta.Positive};
          } else if (delta.Negative !== undefined) {
            return {Negative: delta.Negative};
          }
          throw new Error("Invalid BinIdDelta");
        }) ?? [];
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
        to: addressInput(this.account.address),
        refund_to: addressInput(this.account.address),
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
    }, context);
  }

  private async fundRequest(
    request: ScriptTransactionRequest
  ): Promise<ScriptTransactionRequest> {
    const gasCost = await this.account.getTransactionCost(request);
    return await this.account.fund(request, gasCost);
  }

  /**
   * Removes liquidity from specific bins in a v2 pool
   *
   * @param poolId - The v2 pool ID (BN)
   * @param binIds - Array of bin IDs to remove liquidity from
   * @param amountAMin - Minimum amount of token A to receive (slippage protection)
   * @param amountBMin - Minimum amount of token B to receive (slippage protection)
   * @param deadline - Transaction deadline timestamp
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  async removeLiquidity(
    poolId: PoolIdV2,
    binIds: BigNumberish[],
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    deadline: BigNumberish,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    const context = createErrorContext("removeLiquidity", {poolId});

    // Validate input parameters
    validateRemoveLiquidityParams(
      poolId,
      binIds,
      amountAMin,
      amountBMin,
      deadline,
      DEFAULT_VALIDATION_OPTIONS,
      context
    );

    return withErrorHandling(async () => {
      // Get pool metadata to determine asset order and validate pool exists
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

      // Generate LP asset IDs for each bin
      const lpAssets: AssetId[] = [];
      for (const binId of binIds) {
        // For v2, LP asset IDs are generated based on pool ID and bin ID
        // We need to create a unique sub-ID for each bin
        const binSubId = sha256(
          arrayify(
            hexlify(
              concat([arrayify(poolId.toHex()), arrayify(bn(binId).toHex())])
            )
          )
        );
        const lpAssetId = getAssetId(this.ammContract.id.toB256(), binSubId);
        lpAssets.push(lpAssetId);
      }

      // Prepare the RemoveLiquidityParameters
      const removeLiquidityParams = {
        pool: {
          asset_x: pool.asset_x,
          asset_y: pool.asset_y,
          bin_step: pool.bin_step,
          base_factor: pool.base_factor,
        },
        amount_x_min: amountAMin,
        amount_y_min: amountBMin,
        lp_assets: lpAssets.map(assetInput),
        to: addressInput(this.account.address),
        deadline,
      };

      // Call the remove liquidity script
      let request = await this.removeLiquidityScript.functions
        .main(removeLiquidityParams)
        .addContracts([this.ammContract])
        .txParams(txParams ?? {})
        .getTransactionRequest();

      // Prepare input assets for funding (LP tokens)
      const inputAssets = lpAssets.map((assetId) => ({
        assetId: assetId.bits,
        amount: bn(1), // Placeholder amount, actual amount will be determined by available LP tokens
      }));

      return await this.prepareRequest(request, 2, inputAssets, [], options);
    }, context);
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

  /**
   * Swaps an exact input amount for a minimum output amount through v2 pools
   *
   * @param amountIn - Exact amount of input tokens to swap
   * @param assetIn - Input asset ID
   * @param amountOutMin - Minimum amount of output tokens to receive (slippage protection)
   * @param pools - Array of v2 pool IDs to route through
   * @param deadline - Transaction deadline timestamp
   * @param receiver - Optional receiver address (defaults to account address)
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  async swapExactInput(
    amountIn: BigNumberish,
    assetIn: AssetId,
    amountOutMin: BigNumberish,
    pools: PoolIdV2[],
    deadline: BigNumberish,
    receiver?: Address,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    const context = createErrorContext("swapExactInput", {assetIn});

    // Validate input parameters
    validateAssetId(assetIn, "assetIn", context);
    validateSwapParams(
      amountIn,
      amountOutMin,
      pools,
      deadline,
      DEFAULT_VALIDATION_OPTIONS,
      context
    );

    return withErrorHandling(async () => {
      if (pools.length === 0) {
        throw new MiraV2Error(
          PoolCurveStateError.InvalidParameters,
          "At least one pool must be provided for routing"
        );
      }

      const recipient = receiver
        ? addressInput(receiver)
        : addressInput(this.account.address);

      // Convert pool IDs to path (array of BN)
      const path = pools.map((poolId) => poolId);

      // Call the swap exact in script
      let request = await this.swapExactInScript.functions
        .main(
          amountIn,
          amountOutMin,
          assetInput(assetIn),
          path,
          recipient,
          deadline
        )
        .addContracts([this.ammContract])
        .txParams(txParams ?? {})
        .getTransactionRequest();

      // Prepare input assets for funding
      const inputAssets = [
        {
          assetId: assetIn.bits,
          amount: amountIn,
        },
      ];

      return await this.prepareRequest(request, 1, inputAssets, [], options);
    }, context);
  }

  /**
   * Swaps tokens to get an exact output amount through v2 pools
   *
   * @param amountOut - Exact amount of output tokens to receive
   * @param assetOut - Output asset ID
   * @param amountInMax - Maximum amount of input tokens to spend (slippage protection)
   * @param pools - Array of v2 pool IDs to route through
   * @param deadline - Transaction deadline timestamp
   * @param receiver - Optional receiver address (defaults to account address)
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  async swapExactOutput(
    amountOut: BigNumberish,
    assetOut: AssetId,
    amountInMax: BigNumberish,
    pools: PoolIdV2[],
    deadline: BigNumberish,
    receiver?: Address,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    const context = createErrorContext("swapExactOutput", {assetOut});

    // Validate input parameters
    validateAssetId(assetOut, "assetOut", context);
    validateSwapParams(
      amountInMax,
      amountOut,
      pools,
      deadline,
      DEFAULT_VALIDATION_OPTIONS,
      context
    );

    return withErrorHandling(async () => {
      if (pools.length === 0) {
        throw new MiraV2Error(
          PoolCurveStateError.InvalidParameters,
          "At least one pool must be provided for routing"
        );
      }

      // For exact output, we need to determine the input asset from the first pool
      const firstPoolMetadata = await this.ammContract.functions
        .get_pool(poolIdV2Input(pools[0]))
        .get();

      if (!firstPoolMetadata.value) {
        throw new MiraV2Error(
          PoolCurveStateError.PoolNotFound,
          `First pool with ID ${pools[0].toString()} not found`
        );
      }

      // Determine input asset based on the output asset and first pool
      const pool = firstPoolMetadata.value.pool;
      let assetIn: AssetId;
      if (pool.asset_x.bits === assetOut.bits) {
        assetIn = pool.asset_y;
      } else if (pool.asset_y.bits === assetOut.bits) {
        assetIn = pool.asset_x;
      } else {
        throw new MiraV2Error(
          PoolCurveStateError.InvalidParameters,
          "Output asset not found in the first pool"
        );
      }

      const recipient = receiver
        ? addressInput(receiver)
        : addressInput(this.account.address);

      // Convert pool IDs to path (array of BN)
      const path = pools.map((poolId) => poolId);

      // Call the swap exact out script
      let request = await this.swapExactOutScript.functions
        .main(
          amountOut,
          assetInput(assetIn),
          assetInput(assetOut),
          amountInMax,
          path,
          recipient,
          deadline
        )
        .addContracts([this.ammContract])
        .txParams(txParams ?? {})
        .getTransactionRequest();

      // Prepare input assets for funding
      const inputAssets = [
        {
          assetId: assetIn.bits,
          amount: amountInMax,
        },
      ];

      return await this.prepareRequest(request, 1, inputAssets, [], options);
    }, context);
  }

  /**
   * Creates a new v2 pool with binned liquidity structure
   *
   * @param pool - Pool configuration (assets, bin step, base factor)
   * @param activeId - Initial active bin ID for the pool
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  async createPool(
    pool: PoolInput,
    activeId: BigNumberish,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    const context = createErrorContext("createPool", {pool});

    // Validate input parameters
    validatePoolInput(pool, context);
    validateBinId(activeId, context);

    return withErrorHandling(async () => {
      // Call the create pool contract method
      let request = await this.ammContract.functions
        .create_pool(
          {
            asset_x: assetInput(pool.assetX),
            asset_y: assetInput(pool.assetY),
            bin_step: pool.binStep,
            base_factor: pool.baseFactor,
          },
          activeId
        )
        .txParams(txParams ?? {})
        .getTransactionRequest();

      return await this.prepareRequest(request, 0, [], [], options);
    }, context);
  }

  /**
   * Creates a new v2 pool and adds initial liquidity in a single transaction
   *
   * @param pool - Pool configuration (assets, bin step, base factor)
   * @param activeId - Initial active bin ID for the pool
   * @param amountADesired - Desired amount of token A to add as initial liquidity
   * @param amountBDesired - Desired amount of token B to add as initial liquidity
   * @param deadline - Transaction deadline timestamp
   * @param liquidityConfig - Optional liquidity distribution configuration
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  async createPoolAndAddLiquidity(
    pool: PoolInput,
    activeId: BigNumberish,
    amountADesired: BigNumberish,
    amountBDesired: BigNumberish,
    deadline: BigNumberish,
    liquidityConfig?: LiquidityConfig[],
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    const context = createErrorContext("createPoolAndAddLiquidity", {pool});

    // Validate input parameters
    validatePoolInput(pool, context);
    validateBinId(activeId, context);
    validateAmount(
      amountADesired,
      "amountADesired",
      DEFAULT_VALIDATION_OPTIONS,
      context
    );
    validateAmount(
      amountBDesired,
      "amountBDesired",
      DEFAULT_VALIDATION_OPTIONS,
      context
    );
    validateDeadline(deadline, DEFAULT_VALIDATION_OPTIONS, context);

    if (liquidityConfig) {
      validateLiquidityConfig(liquidityConfig, context);
    }

    return withErrorHandling(async () => {
      // First create the pool
      const createPoolRequest = await this.ammContract.functions
        .create_pool(
          {
            asset_x: assetInput(pool.assetX),
            asset_y: assetInput(pool.assetY),
            bin_step: pool.binStep,
            base_factor: pool.baseFactor,
          },
          activeId
        )
        .getTransactionRequest();

      // Calculate the pool ID that will be created
      // This is a simplified calculation - in practice you might need to query the contract
      const poolId = bn(Date.now()); // Placeholder - should be calculated properly

      // Default liquidity configuration if not provided
      const finalLiquidityConfig = liquidityConfig ?? [
        {
          binId: Number(activeId),
          distributionX: 100,
          distributionY: 100,
        },
      ];

      // Prepare the AddLiquidityParameters for the second call
      const addLiquidityParams = {
        pool: {
          asset_x: assetInput(pool.assetX),
          asset_y: assetInput(pool.assetY),
          bin_step: pool.binStep,
          base_factor: pool.baseFactor,
        },
        amount_x: amountADesired,
        amount_y: amountBDesired,
        amount_x_min: bn(amountADesired).mul(95).div(100), // 5% slippage tolerance
        amount_y_min: bn(amountBDesired).mul(95).div(100), // 5% slippage tolerance
        active_id_desired: activeId,
        id_slippage: 0,
        delta_ids: finalLiquidityConfig.map((config) => ({
          Positive: config.binId,
        })),
        distribution_x: finalLiquidityConfig.map(
          (config) => config.distributionX
        ),
        distribution_y: finalLiquidityConfig.map(
          (config) => config.distributionY
        ),
        to: addressInput(this.account.address),
        refund_to: addressInput(this.account.address),
        deadline,
      };

      // Call the add liquidity script
      let addLiquidityRequest = await this.addLiquidityScript.functions
        .main(addLiquidityParams)
        .addContracts([this.ammContract])
        .getTransactionRequest();

      // Combine both requests into a single transaction
      // Note: This is a simplified approach. In practice, you might need to use a batch transaction
      // or a specialized script that handles both operations atomically
      const combinedRequest = createPoolRequest;

      // Add the add liquidity call outputs to the create pool request
      combinedRequest.addVariableOutputs(2);

      // Prepare input assets for funding
      const inputAssets = [
        {
          assetId: pool.assetX.bits,
          amount: amountADesired,
        },
        {
          assetId: pool.assetY.bits,
          amount: amountBDesired,
        },
      ];

      return await this.prepareRequest(
        combinedRequest,
        2,
        inputAssets,
        [],
        options
      );
    }, context);
  }
}

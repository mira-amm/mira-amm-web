import {
  Account,
  Address,
  AssetId,
  BigNumberish,
  CoinQuantityLike,
  ScriptTransactionRequest,
  TxParams,
} from "fuels";
import {DEFAULT_AMM_CONTRACT_ID} from "./constants";
import {
  AddLiquidityScriptLoader,
  CreatePoolAndAddLiquidityScriptLoader,
  RemoveLiquidityScriptLoader,
  SwapExactInputScriptLoader,
  SwapExactOutputScriptLoader,
} from "./typegen";
import {MiraAmmContract} from "./typegen/MiraAmmContract";
import {PoolId} from "./model";
import {
  addressInput,
  assetInput,
  contractIdInput,
  getAssetId,
  getLPAssetId,
  poolIdInput,
  reorderAssetContracts,
  reorderPoolId,
} from "./utils";
import {MiraAmmContractFactory} from "./typegen/MiraAmmContractFactory";

export class MiraAmm {
  private readonly account: Account;
  private readonly ammContract: MiraAmmContract;
  private readonly addLiquidityScriptLoader: AddLiquidityScriptLoader;
  private readonly createPoolAndAddLiquidityScriptLoader: CreatePoolAndAddLiquidityScriptLoader;
  private readonly removeLiquidityScriptLoader: RemoveLiquidityScriptLoader;
  private readonly swapExactInputScriptLoader: SwapExactInputScriptLoader;
  private readonly swapExactOutputScriptLoader: SwapExactOutputScriptLoader;

  constructor(account: Account, contractIdOpt?: string) {
    const contractId = contractIdOpt ?? DEFAULT_AMM_CONTRACT_ID;
    const contractIdConfigurables = {
      AMM_CONTRACT_ID: contractIdInput(contractId),
    };
    this.account = account;
    this.ammContract = new MiraAmmContract(contractId, account);
    this.addLiquidityScriptLoader = new AddLiquidityScriptLoader(
      account,
    ).setConfigurableConstants(contractIdConfigurables);
    this.createPoolAndAddLiquidityScriptLoader =
      new CreatePoolAndAddLiquidityScriptLoader(
        account,
      ).setConfigurableConstants(contractIdConfigurables);
    this.removeLiquidityScriptLoader = new RemoveLiquidityScriptLoader(
      account,
    ).setConfigurableConstants(contractIdConfigurables);
    this.swapExactInputScriptLoader = new SwapExactInputScriptLoader(
      account,
    ).setConfigurableConstants(contractIdConfigurables);
    this.swapExactOutputScriptLoader = new SwapExactOutputScriptLoader(
      account,
    ).setConfigurableConstants(contractIdConfigurables);
  }

  static async deploy(wallet: Account): Promise<MiraAmm> {
    const {waitForResult} = await MiraAmmContractFactory.deploy(wallet);
    const {contract, transactionResult} = await waitForResult();
    console.log(
      "Deployed MiraAmm contract with status:",
      transactionResult.status,
      "and id:",
      contract.id.toB256(),
    );
    return new MiraAmm(wallet, contract.id.toB256());
  }

  id(): string {
    return this.ammContract.id.toB256();
  }

  async addLiquidity(
    poolId: PoolId,
    amountADesired: BigNumberish,
    amountBDesired: BigNumberish,
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    deadline: BigNumberish,
    txParams?: TxParams
  ): Promise<ScriptTransactionRequest> {
    const assetA = poolId[0];
    poolId = reorderPoolId(poolId);
    const [amount0Desired, amount1Desired, amount0Min, amount1Min] =
      assetA.bits === poolId[0].bits
        ? [amountADesired, amountBDesired, amountAMin, amountBMin]
        : [amountBDesired, amountADesired, amountBMin, amountAMin];
    let request = await this.addLiquidityScriptLoader.functions
      .main(
        poolIdInput(poolId),
        amount0Desired,
        amount1Desired,
        amount0Min,
        amount1Min,
        addressInput(this.account.address),
        deadline,
      )
      .addContracts([this.ammContract])
      .txParams(txParams ?? {})
      .getTransactionRequest();

    const inputAssets = [
      {
        assetId: poolId[0].bits,
        amount: amount0Desired,
      },
      {
        assetId: poolId[1].bits,
        amount: amount1Desired,
      },
    ];

    return await this.prepareRequest(request, 2, inputAssets);
  }

  async createPoolAndAddLiquidity(
    tokenAContract: string,
    tokenASubId: string,
    tokenBContract: string,
    tokenBSubId: string,
    isStable: boolean,
    amountADesired: BigNumberish,
    amountBDesired: BigNumberish,
    deadline: BigNumberish,
    txParams?: TxParams
  ): Promise<ScriptTransactionRequest> {
    const [token0Contract, token0SubId, token1Contract, token1SubId] =
      reorderAssetContracts(
        tokenAContract,
        tokenASubId,
        tokenBContract,
        tokenBSubId,
        isStable,
      );
    const [amount0Desired, amount1Desired] =
      tokenAContract === token0Contract
        ? [amountADesired, amountBDesired]
        : [amountBDesired, amountADesired];
    let request = await this.createPoolAndAddLiquidityScriptLoader.functions
      .main(
        contractIdInput(token0Contract),
        token0SubId,
        contractIdInput(token1Contract),
        token1SubId,
        isStable,
        amount0Desired,
        amount1Desired,
        addressInput(this.account.address),
        deadline,
      )
      .addContracts([this.ammContract])
      .txParams(txParams ?? {})
      .getTransactionRequest();
    const token0Asset = getAssetId(token0Contract, token0SubId);
    const token1Asset = getAssetId(token1Contract, token1SubId);

    const inputAssets = [
      {
        assetId: token0Asset.bits,
        amount: amount0Desired,
      },
      {
        assetId: token1Asset.bits,
        amount: amount1Desired,
      },
    ];

    return await this.prepareRequest(request, 2, inputAssets, [
      token0Contract,
      token1Contract,
    ]);
  }

  async createPool(
    tokenAContract: string,
    tokenASubId: string,
    tokenBContract: string,
    tokenBSubId: string,
    isStable: boolean,
    txParams?: TxParams
  ): Promise<ScriptTransactionRequest> {
    const [token0Contract, token0SubId, token1Contract, token1SubId] =
      reorderAssetContracts(
        tokenAContract,
        tokenASubId,
        tokenBContract,
        tokenBSubId,
        isStable,
      );
    let request = await this.ammContract.functions
      .create_pool(
        contractIdInput(token0Contract),
        token0SubId,
        contractIdInput(token1Contract),
        token1SubId,
        isStable,
      )
      .txParams(txParams ?? {})
      .getTransactionRequest();
    return await this.prepareRequest(
      request,
      0,
      [],
      [token0Contract, token1Contract],
    );
  }

  async removeLiquidity(
    poolId: PoolId,
    liquidity: BigNumberish,
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    deadline: BigNumberish,
    txParams?: TxParams
  ): Promise<ScriptTransactionRequest> {
    const assetA = poolId[0];
    poolId = reorderPoolId(poolId);
    const [amount0Min, amount1Min] =
      assetA.bits === poolId[0].bits
        ? [amountAMin, amountBMin]
        : [amountBMin, amountAMin];
    let request = await this.removeLiquidityScriptLoader.functions
      .main(
        poolIdInput(poolId),
        liquidity,
        amount0Min,
        amount1Min,
        addressInput(this.account.address),
        deadline,
      )
      .addContracts([this.ammContract])
      .txParams(txParams ?? {})
      .getTransactionRequest();

    const inputAssets = [
      {
        assetId: getLPAssetId(this.ammContract.id.toB256(), poolId).bits,
        amount: liquidity,
      },
    ];

    return await this.prepareRequest(request, 2, inputAssets);
  }

  async swapExactInput(
    amountIn: BigNumberish,
    assetIn: AssetId,
    amountOutMin: BigNumberish,
    pools: PoolId[],
    deadline: BigNumberish,
    txParams?: TxParams
  ): Promise<ScriptTransactionRequest> {
    let request = await this.swapExactInputScriptLoader.functions
      .main(
        amountIn,
        assetInput(assetIn),
        amountOutMin,
        pools.map(poolIdInput),
        addressInput(this.account.address),
        deadline,
      )
      .addContracts([this.ammContract])
      .txParams(txParams ?? {})
      .getTransactionRequest();

    const inputAssets = [
      {
        assetId: assetIn.bits,
        amount: amountIn,
      },
    ];

    return await this.prepareRequest(request, 1, inputAssets);
  }

  async swapExactOutput(
    amountOut: BigNumberish,
    assetOut: AssetId,
    amountInMax: BigNumberish,
    pools: PoolId[],
    deadline: BigNumberish,
    txParams?: TxParams
  ): Promise<ScriptTransactionRequest> {
    let request = await this.swapExactOutputScriptLoader.functions
      .main(
        amountOut,
        assetInput(assetOut),
        amountInMax,
        pools.map(poolIdInput),
        addressInput(this.account.address),
        deadline,
      )
      .addContracts([this.ammContract])
      .txParams(txParams ?? {})
      .getTransactionRequest();

    let assetIn = assetOut;
    for (const pool of pools.reverse()) {
      if (pool[0].bits === assetIn.bits) {
        assetIn = pool[1];
      } else {
        assetIn = pool[0];
      }
    }

    const inputAssets = [
      {
        assetId: assetIn.bits,
        amount: amountInMax,
      },
    ];
    return await this.prepareRequest(request, 1, inputAssets);
  }

  async transferOwnership(
    newOwner: Address,
    txParams?: TxParams
  ): Promise<ScriptTransactionRequest> {
    const request = await this.ammContract.functions
      .transfer_ownership(addressInput(newOwner))
      .txParams(txParams ?? {})
      .getTransactionRequest();
    return await this.prepareRequest(request);
  }

  async setHook(
    newAddress?: string,
    txParams?: TxParams
  ): Promise<ScriptTransactionRequest> {
    const request = await this.ammContract.functions
      .set_hook(newAddress ? contractIdInput(newAddress) : undefined)
      .txParams(txParams ?? {})
      .getTransactionRequest();
    return await this.prepareRequest(request);
  }

  private async fundRequest(
    request: ScriptTransactionRequest,
  ): Promise<ScriptTransactionRequest> {
    const gasCost = await this.account.getTransactionCost(request);
    return await this.account.fund(request, gasCost);
  }

  private async prepareRequest(
    request: ScriptTransactionRequest,
    variableOutputs: number = 0,
    inputAssets: CoinQuantityLike[] = [],
    inputContracts: string[] = [],
  ): Promise<ScriptTransactionRequest> {
    if (variableOutputs > 0) {
      request.addVariableOutputs(variableOutputs);
    }
    request.addResources(
      // TODO: should not be here
      await this.account.getResourcesToSpend(inputAssets),
    );
    const uniqueContracts = new Set(
      inputContracts.map((c) => Address.fromAddressOrString(c)),
    );
    for (const contract of uniqueContracts) {
      request.addContractInputAndOutput(contract);
    }
    // TODO: should not be here
    request = await this.fundRequest(request);

    // TODO: should not be here
    await this.account.provider.estimateTxDependencies(request);
    return request;
  }
}

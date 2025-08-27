import {
  Account,
  AccountCoinQuantity,
  Address,
  AssetId,
  BigNumberish,
  BN,
  CoinQuantityLike,
  ScriptTransactionRequest,
  TxParams,
} from "fuels";

import { DEFAULT_AMM_CONTRACT_ID } from "./constants";

import {
  AddLiquidityScriptLoader,
  CreatePoolAndAddLiquidityScriptLoader,
  RemoveLiquidityScriptLoader,
  SwapExactInputScriptLoader,
  SwapExactOutputScriptLoader,
} from "./typegen/scripts";

import { MiraAmmContract, MiraAmmContractFactory } from "./typegen/contracts";

import { PoolId } from "./model";
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
import { hexlify, bn } from "fuels";

type PrepareRequestOptions = {
  useAssembleTx?: boolean;
  reserveGas?: number;
};

type TransactionWithGasPrice = {
  transactionRequest: ScriptTransactionRequest;
  gasPrice: BN;
};

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
      account
    ).setConfigurableConstants(contractIdConfigurables);
    this.createPoolAndAddLiquidityScriptLoader =
      new CreatePoolAndAddLiquidityScriptLoader(
        account
      ).setConfigurableConstants(contractIdConfigurables);
    this.removeLiquidityScriptLoader = new RemoveLiquidityScriptLoader(
      account
    ).setConfigurableConstants(contractIdConfigurables);
    this.swapExactInputScriptLoader = new SwapExactInputScriptLoader(
      account
    ).setConfigurableConstants(contractIdConfigurables);
    this.swapExactOutputScriptLoader = new SwapExactOutputScriptLoader(
      account
    ).setConfigurableConstants(contractIdConfigurables);
  }

  static async deploy(wallet: Account): Promise<MiraAmm> {
    const { waitForResult } = await MiraAmmContractFactory.deploy(wallet);
    const { contract, transactionResult } = await waitForResult();
    console.log(
      "Deployed MiraAmm contract with status:",
      transactionResult.status,
      "and id:",
      contract.id.toB256()
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
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
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
        deadline
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

    return await this.prepareRequest(request, 2, inputAssets, [], options);
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
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    const [token0Contract, token0SubId, token1Contract, token1SubId] =
      reorderAssetContracts(
        tokenAContract,
        tokenASubId,
        tokenBContract,
        tokenBSubId,
        isStable
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
        deadline
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

    return await this.prepareRequest(
      request,
      2,
      inputAssets,
      [token0Contract, token1Contract],
      options
    );
  }

  async createPool(
    tokenAContract: string,
    tokenASubId: string,
    tokenBContract: string,
    tokenBSubId: string,
    isStable: boolean,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    const [token0Contract, token0SubId, token1Contract, token1SubId] =
      reorderAssetContracts(
        tokenAContract,
        tokenASubId,
        tokenBContract,
        tokenBSubId,
        isStable
      );
    let request = await this.ammContract.functions
      .create_pool(
        contractIdInput(token0Contract),
        token0SubId,
        contractIdInput(token1Contract),
        token1SubId,
        isStable
      )
      .txParams(txParams ?? {})
      .getTransactionRequest();
    return await this.prepareRequest(
      request,
      0,
      [],
      [token0Contract, token1Contract],
      {
        useAssembleTx: options?.useAssembleTx ?? true,
        reserveGas: options?.reserveGas,
      }
    );
  }

  async removeLiquidity(
    poolId: PoolId,
    liquidity: BigNumberish,
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    deadline: BigNumberish,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
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
        deadline
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

    return await this.prepareRequest(request, 2, inputAssets, [], options);
  }

  async swapExactInput(
    amountIn: BigNumberish,
    assetIn: AssetId,
    amountOutMin: BigNumberish,
    pools: PoolId[],
    deadline: BigNumberish,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    let request = await this.swapExactInputScriptLoader.functions
      .main(
        amountIn,
        assetInput(assetIn),
        amountOutMin,
        pools.map(poolIdInput),
        addressInput(this.account.address),
        deadline
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

    return await this.prepareRequest(request, 1, inputAssets, [], options);
  }

  async swapExactOutput(
    amountOut: BigNumberish,
    assetOut: AssetId,
    amountInMax: BigNumberish,
    pools: PoolId[],
    deadline: BigNumberish,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice> {
    let request = await this.swapExactOutputScriptLoader.functions
      .main(
        amountOut,
        assetInput(assetOut),
        amountInMax,
        pools.map(poolIdInput),
        addressInput(this.account.address),
        deadline
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
    return await this.prepareRequest(request, 1, inputAssets, [], options);
  }

  async transferOwnership(
    newOwner: Address,
    txParams?: TxParams
  ): Promise<TransactionWithGasPrice> {
    const request = await this.ammContract.functions
      .transfer_ownership(addressInput(newOwner))
      .txParams(txParams ?? {})
      .getTransactionRequest();
    return await this.prepareRequest(request);
  }

  async setHook(
    newAddress?: string,
    txParams?: TxParams
  ): Promise<TransactionWithGasPrice> {
    const request = await this.ammContract.functions
      .set_hook(newAddress ? contractIdInput(newAddress) : undefined)
      .txParams(txParams ?? {})
      .getTransactionRequest();
    return await this.prepareRequest(request);
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
    Array.from(uniqueContracts).forEach((contract) => {
      request.addContractInputAndOutput(contract);
    });

    if (options?.useAssembleTx) {
      const accountCoinMap = new Map<string, AccountCoinQuantity>();

      for (const asset of inputAssets) {
        const coin = Array.isArray(asset)
          ? { amount: asset[0], assetId: asset[1] }
          : { amount: asset.amount, assetId: asset.assetId };

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

      try {
        const { assembledRequest, gasPrice } =
          await this.account.provider.assembleTx({
            request,
            feePayerAccount: this.account,
            accountCoinQuantities,
            reserveGas: options?.reserveGas,
          });

        return { transactionRequest: assembledRequest, gasPrice };
      } catch (error) {
        // If assembleTx fails, fall back to legacy method
        if (
          error instanceof Error &&
          error.message.includes("NotEnoughBalance")
        ) {
          console.warn(
            "assembleTx failed with NotEnoughBalance, falling back to legacy method"
          );
          return this.prepareLegacyRequest(request, inputAssets);
        }
        throw error;
      }
    }

    // Legacy/manual fallback
    return this.prepareLegacyRequest(request, inputAssets);
  }

  private async prepareLegacyRequest(
    request: ScriptTransactionRequest,
    inputAssets: CoinQuantityLike[]
  ): Promise<TransactionWithGasPrice> {
    request.addResources(await this.account.getResourcesToSpend(inputAssets));
    request = await this.fundRequest(request);
    const { gasPrice } = await this.account.getTransactionCost(request);
    await this.account.provider.estimateTxDependencies(request);
    return { transactionRequest: request, gasPrice };
  }
}

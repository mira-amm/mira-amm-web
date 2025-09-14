import {
  Account,
  AssetId,
  BigNumberish,
  BN,
  ScriptTransactionRequest,
  TxParams,
} from "fuels";

import {PoolId} from "../model";

/**
 * Options for preparing transaction requests
 */
export interface PrepareRequestOptions {
  useAssembleTx?: boolean;
  reserveGas?: number;
}

/**
 * Transaction with gas price information
 */
export interface TransactionWithGasPrice {
  transactionRequest: ScriptTransactionRequest;
  gasPrice: BN;
}

/**
 * Interface for MiraAmm - Write operations for Mira v1 constant product AMM pools
 *
 * This interface defines methods for executing transactions on Mira v1 pools, which use
 * the traditional constant product (x*y=k) formula similar to Uniswap v2.
 */
export interface IMiraAmm {
  /**
   * Gets the contract ID of the v1 AMM contract
   * @returns The contract ID as a B256 string
   */
  id(): string;

  /**
   * Deploys a new MiraAmm contract
   * @param wallet - Account to deploy from
   * @returns New MiraAmm instance
   */
  // Note: static methods cannot be defined in interfaces, but included here for documentation
  // static deploy(wallet: Account): Promise<MiraAmm>;

  /**
   * Adds liquidity to a v1 pool
   *
   * @param poolId - The v1 pool ID (tuple of [AssetId, AssetId, boolean])
   * @param amountADesired - Desired amount of token A to add
   * @param amountBDesired - Desired amount of token B to add
   * @param amountAMin - Minimum amount of token A (slippage protection)
   * @param amountBMin - Minimum amount of token B (slippage protection)
   * @param deadline - Transaction deadline timestamp
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  addLiquidity(
    poolId: PoolId,
    amountADesired: BigNumberish,
    amountBDesired: BigNumberish,
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    deadline: BigNumberish,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice>;

  /**
   * Creates a new pool and adds initial liquidity in a single transaction
   *
   * @param tokenAContract - Contract address of token A
   * @param tokenASubId - Sub-ID of token A
   * @param tokenBContract - Contract address of token B
   * @param tokenBSubId - Sub-ID of token B
   * @param isStable - Whether this is a stable pool
   * @param amountADesired - Desired amount of token A to add
   * @param amountBDesired - Desired amount of token B to add
   * @param deadline - Transaction deadline timestamp
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  createPoolAndAddLiquidity(
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
  ): Promise<TransactionWithGasPrice>;

  /**
   * Creates a new v1 pool
   *
   * @param tokenAContract - Contract address of token A
   * @param tokenASubId - Sub-ID of token A
   * @param tokenBContract - Contract address of token B
   * @param tokenBSubId - Sub-ID of token B
   * @param isStable - Whether this is a stable pool
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  createPool(
    tokenAContract: string,
    tokenASubId: string,
    tokenBContract: string,
    tokenBSubId: string,
    isStable: boolean,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice>;

  /**
   * Removes liquidity from a v1 pool
   *
   * @param poolId - The v1 pool ID
   * @param liquidity - Amount of LP tokens to burn
   * @param amountAMin - Minimum amount of token A to receive (slippage protection)
   * @param amountBMin - Minimum amount of token B to receive (slippage protection)
   * @param deadline - Transaction deadline timestamp
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  removeLiquidity(
    poolId: PoolId,
    liquidity: BigNumberish,
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    deadline: BigNumberish,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice>;

  /**
   * Swaps an exact input amount for a minimum output amount through v1 pools
   *
   * @param amountIn - Exact amount of input tokens to swap
   * @param assetIn - Input asset ID
   * @param amountOutMin - Minimum amount of output tokens to receive (slippage protection)
   * @param pools - Array of v1 pool IDs to route through
   * @param deadline - Transaction deadline timestamp
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  swapExactInput(
    amountIn: BigNumberish,
    assetIn: AssetId,
    amountOutMin: BigNumberish,
    pools: PoolId[],
    deadline: BigNumberish,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice>;

  /**
   * Swaps tokens to get an exact output amount through v1 pools
   *
   * @param amountOut - Exact amount of output tokens to receive
   * @param assetOut - Output asset ID
   * @param amountInMax - Maximum amount of input tokens to spend (slippage protection)
   * @param pools - Array of v1 pool IDs to route through
   * @param deadline - Transaction deadline timestamp
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  swapExactOutput(
    amountOut: BigNumberish,
    assetOut: AssetId,
    amountInMax: BigNumberish,
    pools: PoolId[],
    deadline: BigNumberish,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice>;

  /**
   * Transfers ownership of the AMM contract
   *
   * @param newOwner - Address of the new owner
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  transferOwnership(
    newOwner: string,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice>;

  /**
   * Sets a hook contract for the AMM
   *
   * @param hook - Address of the hook contract
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  setHook(
    hook: string,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice>;
}

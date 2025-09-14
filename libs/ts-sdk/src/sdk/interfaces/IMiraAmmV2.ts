import {
  Account,
  Address,
  AssetId,
  BigNumberish,
  BN,
  ScriptTransactionRequest,
} from "fuels";

import {
  PoolIdV2,
  PoolInput,
  BinIdDelta,
  LiquidityConfig,
  TxParams,
  PrepareRequestOptions,
} from "../model";

/**
 * Transaction with gas price information
 */
export interface TransactionWithGasPrice {
  transactionRequest: ScriptTransactionRequest;
  gasPrice: BN;
}

/**
 * Interface for MiraAmmV2 - Write operations for Mira v2 binned liquidity pools
 *
 * This interface defines methods for executing transactions on Mira v2 pools, which use
 * a binned liquidity model similar to Trader Joe v2. Unlike v1's continuous liquidity,
 * v2 allows liquidity providers to concentrate their capital in specific price ranges
 * through discrete bins.
 */
export interface IMiraAmmV2 {
  /**
   * Gets the contract ID of the v2 AMM contract
   * @returns The contract ID as a B256 string
   */
  id(): string;

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
  addLiquidity(
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
  ): Promise<TransactionWithGasPrice>;

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
  removeLiquidity(
    poolId: PoolIdV2,
    binIds: BigNumberish[],
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    deadline: BigNumberish,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice>;

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
  swapExactInput(
    amountIn: BigNumberish,
    assetIn: AssetId,
    amountOutMin: BigNumberish,
    pools: PoolIdV2[],
    deadline: BigNumberish,
    receiver?: Address,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice>;

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
  swapExactOutput(
    amountOut: BigNumberish,
    assetOut: AssetId,
    amountInMax: BigNumberish,
    pools: PoolIdV2[],
    deadline: BigNumberish,
    receiver?: Address,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice>;

  /**
   * Creates a new v2 pool with binned liquidity structure
   *
   * @param pool - Pool configuration (assets, bin step, base factor)
   * @param activeId - Initial active bin ID for the pool
   * @param txParams - Transaction parameters
   * @param options - Prepare request options
   * @returns Transaction with gas price
   */
  createPool(
    pool: PoolInput,
    activeId: BigNumberish,
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice>;

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
  createPoolAndAddLiquidity(
    pool: PoolInput,
    activeId: BigNumberish,
    amountADesired: BigNumberish,
    amountBDesired: BigNumberish,
    deadline: BigNumberish,
    liquidityConfig?: LiquidityConfig[],
    txParams?: TxParams,
    options?: PrepareRequestOptions
  ): Promise<TransactionWithGasPrice>;
}

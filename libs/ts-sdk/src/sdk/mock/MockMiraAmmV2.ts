import {Address, AssetId, BigNumberish, BN} from "fuels";

import {
  PoolIdV2,
  PoolInput,
  BinIdDelta,
  TxParams,
  PrepareRequestOptions,
} from "../model";

import {
  MockTransactionWithGasPrice,
  MockSDKConfig,
  DEFAULT_MOCK_CONFIG,
} from "./types";

import {MockAccount} from "./MockAccount";
import {MockStateManager} from "./MockStateManager";
import {
  MockTransactionProcessor,
  AddLiquidityParams,
  RemoveLiquidityParams,
  SwapParams,
  CreatePoolParams,
} from "./MockTransactionProcessor";

/**
 * MockMiraAmmV2 - Mock implementation of write operations for Mira v2 binned liquidity pools
 *
 * This class provides a mock implementation that matches the real MiraAmmV2 interface
 * for testing and development without requiring blockchain interactions. It maintains
 * persistent state and simulates realistic transaction behavior.
 *
 * Key features:
 * - Full interface compatibility with real MiraAmmV2
 * - Persistent state management across function calls
 * - Realistic transaction simulation with configurable delays and errors
 * - Binned liquidity distribution simulation
 * - Gas estimation and pricing simulation
 *
 * @example
 * ```typescript
 * import { MockAccount, MockMiraAmmV2 } from "mira-dex-ts";
 *
 * const account = MockAccount.createWithTestBalances();
 * const miraAmm = new MockMiraAmmV2(account);
 *
 * // Add concentrated liquidity around current price
 * const poolId = new BN("12345");
 * const transaction = await miraAmm.addLiquidity(
 *   poolId,
 *   new BN("1000000"), // 1 token A
 *   new BN("2000000"), // 2 token B
 *   new BN("950000"),  // min A (5% slippage)
 *   new BN("1900000"), // min B (5% slippage)
 *   new BN(Date.now() + 20 * 60 * 1000), // 20 min deadline
 *   8388608, // active bin ID
 *   5,       // 5 bin slippage tolerance
 *   [{Positive: 0}, {Positive: 1}, {Positive: 2}], // bins around active
 *   [40, 30, 30], // X token distribution %
 *   [60, 20, 20]  // Y token distribution %
 * );
 * ```
 */
export class MockMiraAmmV2 {
  private readonly account: MockAccount;
  private readonly stateManager: MockStateManager;
  private readonly transactionProcessor: MockTransactionProcessor;
  private readonly config: MockSDKConfig;

  /**
   * Creates a new MockMiraAmmV2 instance for executing mock v2 pool transactions
   *
   * @param account - Mock account for balance management and transaction signing
   * @param config - Optional configuration for mock behavior
   * @param stateManager - Optional shared state manager instance
   */
  constructor(
    account: MockAccount,
    config?: Partial<MockSDKConfig>,
    stateManager?: MockStateManager
  ) {
    this.account = account;
    this.config = {...DEFAULT_MOCK_CONFIG, ...config};
    this.stateManager = stateManager || new MockStateManager(this.config);
    this.transactionProcessor = new MockTransactionProcessor(
      this.config,
      this.stateManager
    );
  }

  /**
   * Gets the mock contract ID (for interface compatibility)
   *
   * @returns A mock contract ID as a B256 string
   */
  id(): string {
    return "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
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
  ): Promise<MockTransactionWithGasPrice> {
    // Validate account has sufficient balances
    const pool = this.stateManager.getPool(poolId);
    if (!pool) {
      throw new Error(`Pool with ID ${poolId.toString()} not found`);
    }

    const amountA = new BN(amountADesired.toString());
    const amountB = new BN(amountBDesired.toString());

    // Check balances for both assets
    const assetAId = pool.metadata.pool.asset_x.bits;
    const assetBId = pool.metadata.pool.asset_y.bits;

    if (!this.account.hasBalance(assetAId, amountA)) {
      throw new Error(
        `Insufficient balance for asset A. Required: ${amountA.toString()}, Available: ${this.account
          .getBalance(assetAId)
          .toString()}`
      );
    }

    if (!this.account.hasBalance(assetBId, amountB)) {
      throw new Error(
        `Insufficient balance for asset B. Required: ${amountB.toString()}, Available: ${this.account
          .getBalance(assetBId)
          .toString()}`
      );
    }

    // Prepare parameters for transaction processor
    const params: AddLiquidityParams = {
      poolId,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      deadline,
      activeIdDesired,
      idSlippage,
      deltaIds,
      distributionX,
      distributionY,
      txParams,
      options,
    };

    // Process the transaction
    const result = await this.transactionProcessor.processAddLiquidity(
      params,
      this.account.address
    );

    // If transaction was successful, update account balances and state
    if (result.result?.success) {
      // Deduct tokens from account
      this.account.subtractBalance(assetAId, amountA);
      this.account.subtractBalance(assetBId, amountB);

      // Update user position in state manager
      // This would be handled by the transaction processor in a real implementation
      // For now, we'll create a basic position update
      this.updateUserPositionAfterAddLiquidity(params);
    }

    return result;
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
  ): Promise<MockTransactionWithGasPrice> {
    // Validate pool exists
    const pool = this.stateManager.getPool(poolId);
    if (!pool) {
      throw new Error(`Pool with ID ${poolId.toString()} not found`);
    }

    // Validate user has positions in the specified bins
    const userPosition = this.stateManager.getUserPosition(
      this.account.address,
      poolId
    );
    if (!userPosition) {
      throw new Error("No liquidity position found for this pool");
    }

    // Check that user has positions in all specified bins
    for (const binId of binIds) {
      const binIdNum = Number(binId.toString());
      if (!userPosition.binPositions.has(binIdNum)) {
        throw new Error(`No position found in bin ${binIdNum}`);
      }
    }

    // Prepare parameters for transaction processor
    const params: RemoveLiquidityParams = {
      poolId,
      binIds,
      amountAMin,
      amountBMin,
      deadline,
      txParams,
      options,
    };

    // Process the transaction
    const result = await this.transactionProcessor.processRemoveLiquidity(
      params,
      this.account.address
    );

    // If transaction was successful, update account balances and state
    if (result.result?.success) {
      // Calculate amounts to return (simplified calculation)
      const amountA = new BN(amountAMin.toString());
      const amountB = new BN(amountBMin.toString());

      // Add tokens back to account
      const assetAId = pool.metadata.pool.asset_x.bits;
      const assetBId = pool.metadata.pool.asset_y.bits;
      this.account.addBalance(assetAId, amountA);
      this.account.addBalance(assetBId, amountB);

      // Update user position in state manager
      this.updateUserPositionAfterRemoveLiquidity(params);
    }

    return result;
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
  ): Promise<MockTransactionWithGasPrice> {
    const amountInBN = new BN(amountIn.toString());

    // Validate account has sufficient balance for input asset
    if (!this.account.hasBalance(assetIn.bits, amountInBN)) {
      throw new Error(
        `Insufficient balance for input asset. Required: ${amountInBN.toString()}, Available: ${this.account
          .getBalance(assetIn.bits)
          .toString()}`
      );
    }

    // Validate all pools exist
    for (const poolId of pools) {
      const pool = this.stateManager.getPool(poolId);
      if (!pool) {
        throw new Error(`Pool with ID ${poolId.toString()} not found`);
      }
    }

    // Prepare parameters for transaction processor
    const params: SwapParams = {
      amountIn,
      assetIn,
      amountOutMin,
      pools,
      deadline,
      receiver,
      txParams,
      options,
    };

    // Process the transaction
    const result = await this.transactionProcessor.processSwap(
      params,
      this.account.address
    );

    // If transaction was successful, update account balances
    if (result.result?.success) {
      // Deduct input tokens
      this.account.subtractBalance(assetIn.bits, amountInBN);

      // Add output tokens (simplified calculation - use minimum for now)
      const amountOutMinBN = new BN(amountOutMin.toString());
      // In a real implementation, we'd calculate the actual output amount
      // For now, we'll use a simple calculation based on the minimum
      const actualAmountOut = amountOutMinBN.mul(110).div(100); // 10% better than minimum

      // Determine output asset from the last pool
      const lastPool = this.stateManager.getPool(pools[pools.length - 1]);
      if (lastPool) {
        const outputAssetId =
          lastPool.metadata.pool.asset_x.bits === assetIn.bits
            ? lastPool.metadata.pool.asset_y.bits
            : lastPool.metadata.pool.asset_x.bits;

        this.account.addBalance(outputAssetId, actualAmountOut);
      }
    }

    return result;
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
  ): Promise<MockTransactionWithGasPrice> {
    // Validate all pools exist and determine input asset
    if (pools.length === 0) {
      throw new Error("At least one pool must be provided for routing");
    }

    const firstPool = this.stateManager.getPool(pools[0]);
    if (!firstPool) {
      throw new Error(`First pool with ID ${pools[0].toString()} not found`);
    }

    // Determine input asset based on the output asset and first pool
    let assetIn: AssetId;
    if (firstPool.metadata.pool.asset_x.bits === assetOut.bits) {
      assetIn = firstPool.metadata.pool.asset_y;
    } else if (firstPool.metadata.pool.asset_y.bits === assetOut.bits) {
      assetIn = firstPool.metadata.pool.asset_x;
    } else {
      throw new Error("Output asset not found in the first pool");
    }

    const amountInMaxBN = new BN(amountInMax.toString());

    // Validate account has sufficient balance for input asset
    if (!this.account.hasBalance(assetIn.bits, amountInMaxBN)) {
      throw new Error(
        `Insufficient balance for input asset. Required: ${amountInMaxBN.toString()}, Available: ${this.account
          .getBalance(assetIn.bits)
          .toString()}`
      );
    }

    // Prepare parameters for transaction processor
    const params: SwapParams = {
      amountOut,
      assetOut,
      amountInMax,
      pools,
      deadline,
      receiver,
      txParams,
      options,
    };

    // Process the transaction
    const result = await this.transactionProcessor.processSwap(
      params,
      this.account.address
    );

    // If transaction was successful, update account balances
    if (result.result?.success) {
      const amountOutBN = new BN(amountOut.toString());

      // Calculate actual input amount used (simplified - use 90% of max for better execution)
      const actualAmountIn = amountInMaxBN.mul(90).div(100);

      // Deduct input tokens
      this.account.subtractBalance(assetIn.bits, actualAmountIn);

      // Add exact output tokens
      this.account.addBalance(assetOut.bits, amountOutBN);
    }

    return result;
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
  ): Promise<MockTransactionWithGasPrice> {
    // Prepare parameters for transaction processor
    const params: CreatePoolParams = {
      pool,
      activeId,
      txParams,
      options,
    };

    // Process the transaction
    const result = await this.transactionProcessor.processCreatePool(
      params,
      this.account.address
    );

    // If transaction was successful, create the pool in state manager
    if (result.result?.success) {
      this.createPoolInState(pool, activeId);
    }

    return result;
  }

  /**
   * Get the state manager instance (for testing and debugging)
   *
   * @returns The mock state manager
   */
  getStateManager(): MockStateManager {
    return this.stateManager;
  }

  /**
   * Get the account instance (for testing and debugging)
   *
   * @returns The mock account
   */
  getAccount(): MockAccount {
    return this.account;
  }

  /**
   * Get the current configuration
   *
   * @returns The mock SDK configuration
   */
  getConfig(): MockSDKConfig {
    return {...this.config};
  }

  // ===== Private Helper Methods =====

  /**
   * Update user position after successful add liquidity
   */
  private updateUserPositionAfterAddLiquidity(
    params: AddLiquidityParams
  ): void {
    // This is a simplified implementation
    // In a real implementation, this would involve complex bin distribution calculations
    const poolId = params.poolId;
    const activeId = Number(params.activeIdDesired?.toString() || "8388608");

    // Create or update bin position
    const binPosition = {
      binId: activeId,
      lpTokenAmount: new BN("1000000"), // Simplified LP token amount
      underlyingAmounts: {
        assetA: new BN(params.amountADesired.toString()),
        assetB: new BN(params.amountBDesired.toString()),
      },
      feesEarned: {
        assetA: new BN(0),
        assetB: new BN(0),
      },
      entryPrice: new BN("1000000"), // Simplified price
      entryTime: new Date(),
    };

    this.stateManager.updateUserBinPosition(
      this.account.address,
      poolId,
      binPosition
    );
  }

  /**
   * Update user position after successful remove liquidity
   */
  private updateUserPositionAfterRemoveLiquidity(
    params: RemoveLiquidityParams
  ): void {
    // Remove positions from specified bins
    for (const binId of params.binIds) {
      const binIdNum = Number(binId.toString());
      this.stateManager.removeUserBinPosition(
        this.account.address,
        params.poolId,
        binIdNum
      );
    }
  }

  /**
   * Create a new pool in the state manager
   */
  private createPoolInState(pool: PoolInput, activeId: BigNumberish): void {
    // This is a simplified implementation
    // In a real implementation, this would involve proper pool initialization
    const poolId = new BN(Date.now()); // Generate a unique pool ID
    const activeIdNum = Number(activeId.toString());

    const mockPool = {
      poolId: poolId.toString(),
      metadata: {
        poolId,
        pool: {
          asset_x: pool.assetX,
          asset_y: pool.assetY,
          bin_step: pool.binStep,
          base_factor: pool.baseFactor,
        },
        activeId: activeIdNum,
        reserves: {
          x: new BN(0),
          y: new BN(0),
        },
        protocolFees: {
          x: new BN(0),
          y: new BN(0),
        },
      },
      bins: new Map(),
      activeBinId: activeIdNum,
      totalReserves: {
        assetA: new BN(0),
        assetB: new BN(0),
      },
      protocolFees: {
        assetA: new BN(0),
        assetB: new BN(0),
      },
      volume24h: new BN(0),
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    // Add the active bin
    mockPool.bins.set(activeIdNum, {
      binId: activeIdNum,
      reserves: {
        assetA: new BN(0),
        assetB: new BN(0),
      },
      totalLpTokens: new BN(0),
      price: new BN("1000000"), // Simplified price calculation
      isActive: true,
    });

    this.stateManager.setPool(poolId, mockPool);
  }
}

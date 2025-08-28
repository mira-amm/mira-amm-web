import {BN, AssetId, Address, BigNumberish} from "fuels";
import {
  MockTransactionResult,
  MockTransactionWithGasPrice,
  MockScriptTransactionRequest,
  MockTransactionEvent,
  MockSDKConfig,
  MockTransaction,
  MockErrorType,
  MockError,
} from "./types";
import {
  PoolIdV2,
  PoolInput,
  BinIdDelta,
  TxParams,
  PrepareRequestOptions,
} from "../model";
import {MockStateManager} from "./MockStateManager";
import {MockErrorSimulator} from "./MockErrorSimulator";
import {MockLiquidityCalculator} from "./MockLiquidityCalculator";

/**
 * Parameters for add liquidity operations
 */
export interface AddLiquidityParams {
  poolId: PoolIdV2;
  amountADesired: BigNumberish;
  amountBDesired: BigNumberish;
  amountAMin: BigNumberish;
  amountBMin: BigNumberish;
  deadline: BigNumberish;
  activeIdDesired?: BigNumberish;
  idSlippage?: BigNumberish;
  deltaIds?: BinIdDelta[];
  distributionX?: BigNumberish[];
  distributionY?: BigNumberish[];
  txParams?: TxParams;
  options?: PrepareRequestOptions;
}

/**
 * Parameters for remove liquidity operations
 */
export interface RemoveLiquidityParams {
  poolId: PoolIdV2;
  binIds: BigNumberish[];
  amountAMin: BigNumberish;
  amountBMin: BigNumberish;
  deadline: BigNumberish;
  txParams?: TxParams;
  options?: PrepareRequestOptions;
}

/**
 * Parameters for swap operations
 */
export interface SwapParams {
  amountIn?: BigNumberish;
  amountOut?: BigNumberish;
  assetIn?: AssetId;
  assetOut?: AssetId;
  amountOutMin?: BigNumberish;
  amountInMax?: BigNumberish;
  pools: PoolIdV2[];
  deadline: BigNumberish;
  receiver?: Address;
  txParams?: TxParams;
  options?: PrepareRequestOptions;
}

/**
 * Parameters for create pool operations
 */
export interface CreatePoolParams {
  pool: PoolInput;
  activeId: BigNumberish;
  txParams?: TxParams;
  options?: PrepareRequestOptions;
}

/**
 * MockTransactionProcessor handles realistic transaction simulation
 *
 * Provides configurable behavior for:
 * - Transaction processing with realistic delays
 * - Gas estimation and pricing
 * - Error simulation for various failure scenarios
 * - State updates for successful transactions
 */
export class MockTransactionProcessor {
  private config: MockSDKConfig;
  private stateManager: MockStateManager;
  private errorSimulator: MockErrorSimulator;
  private transactionCounter = 0;
  private blockNumber = 1000000; // Starting block number

  constructor(config: MockSDKConfig, stateManager: MockStateManager) {
    this.config = config;
    this.stateManager = stateManager;
    this.errorSimulator = new MockErrorSimulator(config);
  }

  /**
   * Process add liquidity transaction
   */
  async processAddLiquidity(
    params: AddLiquidityParams,
    userId: string
  ): Promise<MockTransactionWithGasPrice> {
    const transactionRequest = this.createMockTransactionRequest(
      "addLiquidity",
      params
    );
    const gasPrice = this.generateGasPrice();

    // Simulate processing delay
    await this.simulateDelay();

    // Check for simulated errors
    this.checkForSimulatedError("addLiquidity", params);

    // Validate deadline
    this.validateDeadline(params.deadline);

    // Validate pool exists
    const poolId = this.poolIdToString(params.poolId);
    const pool = this.stateManager.getPool(poolId);
    if (!pool) {
      throw new MockError(
        MockErrorType.POOL_NOT_FOUND,
        `Pool ${poolId} not found`,
        {poolId}
      );
    }

    // Process the transaction
    const result = await this.executeAddLiquidity(params, userId);

    return {
      transactionRequest,
      gasPrice,
      result,
    };
  }

  /**
   * Process remove liquidity transaction
   */
  async processRemoveLiquidity(
    params: RemoveLiquidityParams,
    userId: string
  ): Promise<MockTransactionWithGasPrice> {
    const transactionRequest = this.createMockTransactionRequest(
      "removeLiquidity",
      params
    );
    const gasPrice = this.generateGasPrice();

    // Simulate processing delay
    await this.simulateDelay();

    // Check for simulated errors
    this.checkForSimulatedError("removeLiquidity", params);

    // Validate deadline
    this.validateDeadline(params.deadline);

    // Validate pool exists
    const poolId = this.poolIdToString(params.poolId);
    const pool = this.stateManager.getPool(poolId);
    if (!pool) {
      throw new MockError(
        MockErrorType.POOL_NOT_FOUND,
        `Pool ${poolId} not found`,
        {poolId}
      );
    }

    // Process the transaction
    const result = await this.executeRemoveLiquidity(params, userId);

    return {
      transactionRequest,
      gasPrice,
      result,
    };
  }

  /**
   * Process swap transaction
   */
  async processSwap(
    params: SwapParams,
    userId: string
  ): Promise<MockTransactionWithGasPrice> {
    const transactionRequest = this.createMockTransactionRequest(
      "swap",
      params
    );
    const gasPrice = this.generateGasPrice();

    // Simulate processing delay
    await this.simulateDelay();

    // Check for simulated errors
    this.checkForSimulatedError("swap", params);

    // Validate deadline
    this.validateDeadline(params.deadline);

    // Validate pools exist
    for (const poolId of params.pools) {
      const pool = this.stateManager.getPool(this.poolIdToString(poolId));
      if (!pool) {
        throw new MockError(
          MockErrorType.POOL_NOT_FOUND,
          `Pool ${this.poolIdToString(poolId)} not found`,
          {poolId}
        );
      }
    }

    // Process the transaction
    const result = await this.executeSwap(params, userId);

    return {
      transactionRequest,
      gasPrice,
      result,
    };
  }

  /**
   * Process create pool transaction
   */
  async processCreatePool(
    params: CreatePoolParams,
    userId: string
  ): Promise<MockTransactionWithGasPrice> {
    const transactionRequest = this.createMockTransactionRequest(
      "createPool",
      params
    );
    const gasPrice = this.generateGasPrice();

    // Simulate processing delay
    await this.simulateDelay();

    // Check for simulated errors
    this.checkForSimulatedError("createPool", params);

    // Process the transaction
    const result = await this.executeCreatePool(params, userId);

    return {
      transactionRequest,
      gasPrice,
      result,
    };
  }

  /**
   * Set failure rate for specific operation
   */
  setFailureRate(operation: string, rate: number): void {
    // Store operation-specific failure rates
    // This could be extended to store per-operation rates
    this.config.defaultFailureRate = rate;
  }

  /**
   * Set latency range for transaction simulation
   */
  setLatencyRange(min: number, max: number): void {
    this.config.defaultLatencyMs = (min + max) / 2;
  }

  /**
   * Set gas price range for realistic gas estimation
   */
  setGasPriceRange(min: BN, max: BN): void {
    // This could be extended to store gas price ranges
    // For now, we'll use the config to influence gas price generation
  }

  /**
   * Get the error simulator instance for configuration
   */
  getErrorSimulator(): MockErrorSimulator {
    return this.errorSimulator;
  }

  /**
   * Get the liquidity calculator for external calculations
   */
  static getLiquidityCalculator(): typeof MockLiquidityCalculator {
    return MockLiquidityCalculator;
  }

  // ===== Private Helper Methods =====

  /**
   * Create a mock transaction request
   */
  private createMockTransactionRequest(
    operation: string,
    params: any
  ): MockScriptTransactionRequest {
    const gasLimit = this.estimateGasLimit(operation, params);
    const gasPrice = this.generateGasPrice();

    return {
      type: "script",
      script: `0x${operation}`, // Mock script bytecode
      scriptData: JSON.stringify(params), // Mock script data
      gasLimit,
      gasPrice,
      inputs: [], // Mock inputs
      outputs: [], // Mock outputs
      witnesses: [], // Mock witnesses
    };
  }

  /**
   * Generate realistic gas price
   */
  private generateGasPrice(): BN {
    if (!this.config.enableRealisticGas) {
      return new BN(1);
    }

    // Generate gas price between 1-10 gwei equivalent
    const basePrice = 1000000000; // 1 gwei in wei
    const variation = Math.random() * 9 + 1; // 1-10 multiplier
    return new BN(Math.floor(basePrice * variation));
  }

  /**
   * Estimate gas limit for operation
   */
  private estimateGasLimit(operation: string, params: any): BN {
    const baseGas = {
      addLiquidity: 200000,
      removeLiquidity: 150000,
      swap: 100000,
      createPool: 300000,
    };

    const gas = baseGas[operation as keyof typeof baseGas] || 100000;

    // Add some variation based on complexity
    const variation = Math.random() * 0.2 + 0.9; // 90-110% of base
    return new BN(Math.floor(gas * variation));
  }

  /**
   * Simulate realistic transaction delay
   */
  private async simulateDelay(): Promise<void> {
    const delay = this.config.defaultLatencyMs + (Math.random() * 1000 - 500);
    const actualDelay = Math.max(100, delay); // Minimum 100ms
    await new Promise((resolve) => setTimeout(resolve, actualDelay));
  }

  /**
   * Check if we should simulate an error for this operation
   */
  private checkForSimulatedError(operation: string, params: any): void {
    if (this.errorSimulator.shouldSimulateError(operation, params)) {
      throw this.errorSimulator.generateError(operation, params);
    }
  }

  /**
   * Validate transaction deadline
   */
  private validateDeadline(deadline: BigNumberish): void {
    const deadlineMs = Number(new BN(deadline.toString()).toString()) * 1000;
    const now = Date.now();

    if (deadlineMs < now) {
      throw new MockError(
        MockErrorType.DEADLINE_EXCEEDED,
        "Transaction deadline has passed",
        {deadline: deadlineMs, now}
      );
    }
  }

  /**
   * Execute add liquidity operation
   */
  private async executeAddLiquidity(
    params: AddLiquidityParams,
    userId: string
  ): Promise<MockTransactionResult> {
    const transactionId = this.generateTransactionId();
    const gasUsed = this.estimateGasLimit("addLiquidity", params);
    const gasPrice = this.generateGasPrice();
    const timestamp = new Date();

    // Create transaction events
    const events: MockTransactionEvent[] = [
      {
        type: "LiquidityAdded",
        data: {
          poolId: this.poolIdToString(params.poolId),
          user: userId,
          amountA: params.amountADesired.toString(),
          amountB: params.amountBDesired.toString(),
        },
        timestamp,
      },
    ];

    // Record transaction
    const transaction: MockTransaction = {
      id: transactionId,
      type: "addLiquidity",
      userId,
      poolId: this.poolIdToString(params.poolId),
      params: params as any,
      result: {
        success: true,
        transactionId,
        gasUsed,
        gasPrice,
        blockNumber: this.blockNumber++,
        timestamp,
        events,
      },
      timestamp,
    };

    this.stateManager.addTransaction(transaction);

    return transaction.result;
  }

  /**
   * Execute remove liquidity operation
   */
  private async executeRemoveLiquidity(
    params: RemoveLiquidityParams,
    userId: string
  ): Promise<MockTransactionResult> {
    const transactionId = this.generateTransactionId();
    const gasUsed = this.estimateGasLimit("removeLiquidity", params);
    const gasPrice = this.generateGasPrice();
    const timestamp = new Date();

    // Create transaction events
    const events: MockTransactionEvent[] = [
      {
        type: "LiquidityRemoved",
        data: {
          poolId: this.poolIdToString(params.poolId),
          user: userId,
          binIds: params.binIds.map((id) => id.toString()),
        },
        timestamp,
      },
    ];

    // Record transaction
    const transaction: MockTransaction = {
      id: transactionId,
      type: "removeLiquidity",
      userId,
      poolId: this.poolIdToString(params.poolId),
      params: params as any,
      result: {
        success: true,
        transactionId,
        gasUsed,
        gasPrice,
        blockNumber: this.blockNumber++,
        timestamp,
        events,
      },
      timestamp,
    };

    this.stateManager.addTransaction(transaction);

    return transaction.result;
  }

  /**
   * Execute swap operation
   */
  private async executeSwap(
    params: SwapParams,
    userId: string
  ): Promise<MockTransactionResult> {
    const transactionId = this.generateTransactionId();
    const gasUsed = this.estimateGasLimit("swap", params);
    const gasPrice = this.generateGasPrice();
    const timestamp = new Date();

    // Create transaction events
    const events: MockTransactionEvent[] = [
      {
        type: "Swap",
        data: {
          user: userId,
          assetIn: params.assetIn?.bits || "unknown",
          assetOut: params.assetOut?.bits || "unknown",
          amountIn: params.amountIn?.toString() || "0",
          amountOut: params.amountOut?.toString() || "0",
        },
        timestamp,
      },
    ];

    // Record transaction
    const transaction: MockTransaction = {
      id: transactionId,
      type: "swap",
      userId,
      params: params as any,
      result: {
        success: true,
        transactionId,
        gasUsed,
        gasPrice,
        blockNumber: this.blockNumber++,
        timestamp,
        events,
      },
      timestamp,
    };

    this.stateManager.addTransaction(transaction);

    return transaction.result;
  }

  /**
   * Execute create pool operation
   */
  private async executeCreatePool(
    params: CreatePoolParams,
    userId: string
  ): Promise<MockTransactionResult> {
    const transactionId = this.generateTransactionId();
    const gasUsed = this.estimateGasLimit("createPool", params);
    const gasPrice = this.generateGasPrice();
    const timestamp = new Date();

    // Create transaction events
    const events: MockTransactionEvent[] = [
      {
        type: "PoolCreated",
        data: {
          user: userId,
          assetX: params.pool.assetX.bits,
          assetY: params.pool.assetY.bits,
          binStep: params.pool.binStep,
          activeId: params.activeId.toString(),
        },
        timestamp,
      },
    ];

    // Record transaction
    const transaction: MockTransaction = {
      id: transactionId,
      type: "createPool",
      userId,
      params: params as any,
      result: {
        success: true,
        transactionId,
        gasUsed,
        gasPrice,
        blockNumber: this.blockNumber++,
        timestamp,
        events,
      },
      timestamp,
    };

    this.stateManager.addTransaction(transaction);

    return transaction.result;
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `mock_tx_${Date.now()}_${++this.transactionCounter}`;
  }

  /**
   * Convert PoolIdV2 to string for consistent usage
   */
  private poolIdToString(poolId: PoolIdV2): string {
    return poolId.toString();
  }
}

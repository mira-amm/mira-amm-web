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
    const operation = "addLiquidity";

    try {
      // Comprehensive parameter validation
      this.validateTransactionParameters(operation, params, userId);

      const transactionRequest = this.createMockTransactionRequest(
        operation,
        params
      );
      const gasPrice = this.generateGasPrice();

      // Simulate processing delay
      await this.simulateDelay();

      // Check for simulated errors
      this.checkForSimulatedError(operation, params);

      // Validate deadline
      this.validateDeadline(params.deadline);

      // Validate pool exists
      const poolId = this.poolIdToString(params.poolId);
      const pool = this.stateManager.getPool(poolId);
      if (!pool) {
        throw new MockError(
          MockErrorType.POOL_NOT_FOUND,
          `Pool ${poolId} not found`,
          {
            poolId,
            operation,
            suggestion: "Create the pool first or verify the pool ID",
          }
        );
      }

      // Process the transaction
      const result = await this.executeAddLiquidity(params, userId);

      return {
        transactionRequest,
        gasPrice,
        result,
      };
    } catch (error) {
      // Enhance error with operation context
      if (error instanceof MockError) {
        error.context = {
          ...error.context,
          operation,
          userId,
          timestamp: new Date().toISOString(),
        };
      }
      throw error;
    }
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
      const error = this.errorSimulator.generateError(operation, params);

      // Enhance error with additional context
      error.context = {
        ...error.context,
        operation,
        timestamp: new Date().toISOString(),
        blockNumber: this.blockNumber,
        transactionCounter: this.transactionCounter,
        systemState: {
          poolCount: this.stateManager.getAllPools().length,
          totalTransactions: this.transactionCounter,
        },
      };

      throw error;
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
        `Transaction deadline has passed. Deadline: ${new Date(
          deadlineMs
        ).toISOString()}, Current: ${new Date(now).toISOString()}`,
        {
          deadline: deadlineMs,
          currentTime: now,
          timeDifference: now - deadlineMs,
          suggestion: "Use a deadline at least 10 minutes in the future",
        }
      );
    }

    // Warn if deadline is very close (within 30 seconds)
    const timeUntilDeadline = deadlineMs - now;
    if (timeUntilDeadline < 30000) {
      console.warn(
        `[MockSDK Warning] Transaction deadline is very close (${Math.round(
          timeUntilDeadline / 1000
        )}s remaining). Consider using a longer deadline.`
      );
    }
  }

  /**
   * Comprehensive validation for transaction parameters
   */
  private validateTransactionParameters(
    operation: string,
    params: any,
    userId: string
  ): void {
    // Validate user ID
    if (!userId || typeof userId !== "string") {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Invalid user ID provided",
        {operation, userId}
      );
    }

    // Operation-specific validations
    switch (operation) {
      case "addLiquidity":
        this.validateAddLiquidityParameters(params);
        break;
      case "removeLiquidity":
        this.validateRemoveLiquidityParameters(params);
        break;
      case "swap":
        this.validateSwapParameters(params);
        break;
      case "createPool":
        this.validateCreatePoolParameters(params);
        break;
      default:
        throw new MockError(
          MockErrorType.INVALID_PARAMETERS,
          `Unknown operation: ${operation}`,
          {operation}
        );
    }
  }

  /**
   * Validate add liquidity parameters
   */
  private validateAddLiquidityParameters(params: AddLiquidityParams): void {
    const {
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
    } = params;

    // Validate amounts are positive
    if (new BN(amountADesired.toString()).lte(0)) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Amount A desired must be positive",
        {amountADesired: amountADesired.toString()}
      );
    }

    if (new BN(amountBDesired.toString()).lte(0)) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Amount B desired must be positive",
        {amountBDesired: amountBDesired.toString()}
      );
    }

    // Validate minimum amounts are not greater than desired amounts
    if (new BN(amountAMin.toString()).gt(new BN(amountADesired.toString()))) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Minimum amount A cannot be greater than desired amount A",
        {
          amountAMin: amountAMin.toString(),
          amountADesired: amountADesired.toString(),
        }
      );
    }

    if (new BN(amountBMin.toString()).gt(new BN(amountBDesired.toString()))) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Minimum amount B cannot be greater than desired amount B",
        {
          amountBMin: amountBMin.toString(),
          amountBDesired: amountBDesired.toString(),
        }
      );
    }

    // Validate distribution arrays if provided
    if (distributionX && distributionY) {
      if (distributionX.length !== distributionY.length) {
        throw new MockError(
          MockErrorType.INVALID_PARAMETERS,
          "Distribution arrays must have the same length",
          {
            distributionXLength: distributionX.length,
            distributionYLength: distributionY.length,
          }
        );
      }

      // Validate distribution percentages
      const totalX = distributionX.reduce(
        (sum, dist) => sum + Number(dist.toString()),
        0
      );
      const totalY = distributionY.reduce(
        (sum, dist) => sum + Number(dist.toString()),
        0
      );

      if (totalX > 0 && (totalX < 99 || totalX > 101)) {
        throw new MockError(
          MockErrorType.INVALID_PARAMETERS,
          "Distribution X percentages should sum to approximately 100%",
          {totalDistributionX: totalX}
        );
      }

      if (totalY > 0 && (totalY < 99 || totalY > 101)) {
        throw new MockError(
          MockErrorType.INVALID_PARAMETERS,
          "Distribution Y percentages should sum to approximately 100%",
          {totalDistributionY: totalY}
        );
      }
    }

    // Validate delta IDs match distribution arrays
    if (deltaIds && distributionX && deltaIds.length !== distributionX.length) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Delta IDs array must match distribution arrays length",
        {
          deltaIdsLength: deltaIds.length,
          distributionLength: distributionX.length,
        }
      );
    }
  }

  /**
   * Validate remove liquidity parameters
   */
  private validateRemoveLiquidityParameters(
    params: RemoveLiquidityParams
  ): void {
    const {binIds, amountAMin, amountBMin} = params;

    if (!binIds || binIds.length === 0) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "At least one bin ID must be provided",
        {binIds}
      );
    }

    // Check for duplicate bin IDs
    const uniqueBinIds = new Set(binIds.map((id) => id.toString()));
    if (uniqueBinIds.size !== binIds.length) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Duplicate bin IDs are not allowed",
        {binIds: binIds.map((id) => id.toString())}
      );
    }

    // Validate minimum amounts are non-negative
    if (new BN(amountAMin.toString()).lt(0)) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Minimum amount A cannot be negative",
        {amountAMin: amountAMin.toString()}
      );
    }

    if (new BN(amountBMin.toString()).lt(0)) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Minimum amount B cannot be negative",
        {amountBMin: amountBMin.toString()}
      );
    }
  }

  /**
   * Validate swap parameters
   */
  private validateSwapParameters(params: SwapParams): void {
    const {pools, amountIn, amountOut, amountOutMin, amountInMax} = params;

    if (!pools || pools.length === 0) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "At least one pool must be provided for swap routing",
        {pools}
      );
    }

    if (pools.length > 5) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Too many pools in swap route (maximum 5)",
        {poolCount: pools.length}
      );
    }

    // Validate exact input swap parameters
    if (amountIn !== undefined) {
      if (new BN(amountIn.toString()).lte(0)) {
        throw new MockError(
          MockErrorType.INVALID_PARAMETERS,
          "Amount in must be positive",
          {amountIn: amountIn.toString()}
        );
      }

      if (amountOutMin !== undefined && new BN(amountOutMin.toString()).lt(0)) {
        throw new MockError(
          MockErrorType.INVALID_PARAMETERS,
          "Minimum amount out cannot be negative",
          {amountOutMin: amountOutMin.toString()}
        );
      }
    }

    // Validate exact output swap parameters
    if (amountOut !== undefined) {
      if (new BN(amountOut.toString()).lte(0)) {
        throw new MockError(
          MockErrorType.INVALID_PARAMETERS,
          "Amount out must be positive",
          {amountOut: amountOut.toString()}
        );
      }

      if (amountInMax !== undefined && new BN(amountInMax.toString()).lte(0)) {
        throw new MockError(
          MockErrorType.INVALID_PARAMETERS,
          "Maximum amount in must be positive",
          {amountInMax: amountInMax.toString()}
        );
      }
    }
  }

  /**
   * Validate create pool parameters
   */
  private validateCreatePoolParameters(params: CreatePoolParams): void {
    const {pool, activeId} = params;

    if (!pool) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Pool configuration is required",
        {pool}
      );
    }

    // Validate assets are different
    if (pool.assetX.bits === pool.assetY.bits) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Pool assets must be different",
        {
          assetX: pool.assetX.bits,
          assetY: pool.assetY.bits,
        }
      );
    }

    // Validate bin step
    const binStep = new BN(pool.binStep.toString()).toNumber();
    if (binStep < 1 || binStep > 100) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Bin step must be between 1 and 100",
        {binStep}
      );
    }

    // Validate base factor
    const baseFactor = new BN(pool.baseFactor.toString());
    if (baseFactor.lt(new BN(10000)) || baseFactor.gt(new BN(20000))) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Base factor must be between 10000 and 20000",
        {baseFactor: baseFactor.toString()}
      );
    }

    // Validate active ID is within reasonable range
    const activeIdNum = new BN(activeId.toString()).toNumber();
    if (Math.abs(activeIdNum) > 8388607) {
      throw new MockError(
        MockErrorType.INVALID_PARAMETERS,
        "Active ID is outside valid range (-8388607 to 8388607)",
        {activeId: activeIdNum}
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

export interface MockTransactionResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  gasUsed?: string;
  blockNumber?: number;
  timestamp?: number;
}

export interface MockTransactionOptions {
  minDelay?: number; // Minimum delay in ms
  maxDelay?: number; // Maximum delay in ms
  successRate?: number; // Success rate (0-1)
  gasRange?: [number, number]; // Gas usage range
}

export type TransactionType =
  | "add-liquidity"
  | "remove-liquidity"
  | "swap"
  | "create-pool"
  | "approve-token";

// Default options for different transaction types
const defaultTransactionOptions: Record<
  TransactionType,
  MockTransactionOptions
> = {
  "add-liquidity": {
    minDelay: 2000,
    maxDelay: 5000,
    successRate: 0.95,
    gasRange: [150000, 250000],
  },
  "remove-liquidity": {
    minDelay: 1500,
    maxDelay: 4000,
    successRate: 0.97,
    gasRange: [120000, 200000],
  },
  swap: {
    minDelay: 1000,
    maxDelay: 3000,
    successRate: 0.98,
    gasRange: [80000, 150000],
  },
  "create-pool": {
    minDelay: 3000,
    maxDelay: 8000,
    successRate: 0.92,
    gasRange: [300000, 500000],
  },
  "approve-token": {
    minDelay: 500,
    maxDelay: 2000,
    successRate: 0.99,
    gasRange: [50000, 80000],
  },
};

// Common error messages
const mockErrors = [
  "Insufficient gas",
  "Slippage tolerance exceeded",
  "Pool does not exist",
  "Insufficient liquidity",
  "Token approval required",
  "Network congestion",
  "Invalid bin configuration",
  "Price impact too high",
];

class MockTransactionSimulator {
  private currentBlockNumber = 1000000;
  private transactionCounter = 0;

  /**
   * Simulate a transaction with realistic delays and outcomes
   */
  async simulateTransaction(
    type: TransactionType,
    options?: Partial<MockTransactionOptions>
  ): Promise<MockTransactionResult> {
    const config = {...defaultTransactionOptions[type], ...options};

    // Calculate random delay
    const delay =
      Math.random() * (config.maxDelay! - config.minDelay!) + config.minDelay!;

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Determine success/failure
    const isSuccess = Math.random() < config.successRate!;

    if (isSuccess) {
      this.transactionCounter++;
      this.currentBlockNumber += Math.floor(Math.random() * 3) + 1; // 1-3 blocks

      const gasUsed = Math.floor(
        Math.random() * (config.gasRange![1] - config.gasRange![0]) +
          config.gasRange![0]
      );

      return {
        success: true,
        transactionId: this.generateTransactionId(),
        gasUsed: gasUsed.toString(),
        blockNumber: this.currentBlockNumber,
        timestamp: Date.now(),
      };
    } else {
      return {
        success: false,
        error: mockErrors[Math.floor(Math.random() * mockErrors.length)],
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Simulate multiple transactions in sequence
   */
  async simulateTransactionSequence(
    transactions: {
      type: TransactionType;
      options?: Partial<MockTransactionOptions>;
    }[]
  ): Promise<MockTransactionResult[]> {
    const results: MockTransactionResult[] = [];

    for (const tx of transactions) {
      const result = await this.simulateTransaction(tx.type, tx.options);
      results.push(result);

      // If a transaction fails, stop the sequence
      if (!result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Simulate a complex V2 liquidity operation
   */
  async simulateV2LiquidityOperation(
    operation: "add" | "remove",
    binCount: number
  ): Promise<MockTransactionResult> {
    // V2 operations are more complex and take longer
    const baseOptions =
      defaultTransactionOptions[
        operation === "add" ? "add-liquidity" : "remove-liquidity"
      ];

    // Scale delay and gas based on bin count
    const scaleFactor = Math.max(1, binCount / 3);

    return this.simulateTransaction(
      operation === "add" ? "add-liquidity" : "remove-liquidity",
      {
        minDelay: baseOptions.minDelay! * scaleFactor,
        maxDelay: baseOptions.maxDelay! * scaleFactor,
        gasRange: [
          Math.floor(baseOptions.gasRange![0] * scaleFactor),
          Math.floor(baseOptions.gasRange![1] * scaleFactor),
        ],
        successRate: Math.max(
          0.8,
          baseOptions.successRate! - (binCount - 1) * 0.02
        ), // Slightly lower success rate for complex operations
      }
    );
  }

  /**
   * Simulate network congestion effects
   */
  async simulateWithNetworkCongestion(
    type: TransactionType,
    congestionLevel: "low" | "medium" | "high" = "low"
  ): Promise<MockTransactionResult> {
    const congestionMultipliers = {
      low: {delay: 1, gas: 1, successRate: 1},
      medium: {delay: 2, gas: 1.5, successRate: 0.9},
      high: {delay: 4, gas: 2.5, successRate: 0.7},
    };

    const multiplier = congestionMultipliers[congestionLevel];
    const baseOptions = defaultTransactionOptions[type];

    return this.simulateTransaction(type, {
      minDelay: baseOptions.minDelay! * multiplier.delay,
      maxDelay: baseOptions.maxDelay! * multiplier.delay,
      gasRange: [
        Math.floor(baseOptions.gasRange![0] * multiplier.gas),
        Math.floor(baseOptions.gasRange![1] * multiplier.gas),
      ],
      successRate: baseOptions.successRate! * multiplier.successRate,
    });
  }

  /**
   * Get current mock blockchain state
   */
  getBlockchainState() {
    return {
      currentBlock: this.currentBlockNumber,
      totalTransactions: this.transactionCounter,
      timestamp: Date.now(),
    };
  }

  /**
   * Reset simulator state
   */
  reset() {
    this.currentBlockNumber = 1000000;
    this.transactionCounter = 0;
  }

  private generateTransactionId(): string {
    const chars = "0123456789abcdef";
    let result = "0x";
    for (let i = 0; i < 64; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
}

// Export singleton instance
export const mockTransactionSimulator = new MockTransactionSimulator();

// Utility functions for common operations
export const simulateAddLiquidity = (binCount: number = 1) =>
  mockTransactionSimulator.simulateV2LiquidityOperation("add", binCount);

export const simulateRemoveLiquidity = (binCount: number = 1) =>
  mockTransactionSimulator.simulateV2LiquidityOperation("remove", binCount);

export const simulateSwap = () =>
  mockTransactionSimulator.simulateTransaction("swap");

export const simulateCreatePool = () =>
  mockTransactionSimulator.simulateTransaction("create-pool");

export const simulateTokenApproval = () =>
  mockTransactionSimulator.simulateTransaction("approve-token");

// Transaction status tracking
export interface TransactionStatus {
  id: string;
  type: TransactionType;
  status: "pending" | "confirmed" | "failed";
  result?: MockTransactionResult;
  startTime: number;
}

class TransactionTracker {
  private transactions = new Map<string, TransactionStatus>();

  startTransaction(type: TransactionType): string {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.transactions.set(id, {
      id,
      type,
      status: "pending",
      startTime: Date.now(),
    });
    return id;
  }

  completeTransaction(id: string, result: MockTransactionResult) {
    const tx = this.transactions.get(id);
    if (tx) {
      tx.status = result.success ? "confirmed" : "failed";
      tx.result = result;
    }
  }

  getTransaction(id: string): TransactionStatus | undefined {
    return this.transactions.get(id);
  }

  getAllTransactions(): TransactionStatus[] {
    return Array.from(this.transactions.values());
  }

  getPendingTransactions(): TransactionStatus[] {
    return this.getAllTransactions().filter((tx) => tx.status === "pending");
  }

  clearOldTransactions(maxAge: number = 300000) {
    // 5 minutes
    const now = Date.now();
    for (const [id, tx] of this.transactions.entries()) {
      if (now - tx.startTime > maxAge) {
        this.transactions.delete(id);
      }
    }
  }
}

export const transactionTracker = new TransactionTracker();

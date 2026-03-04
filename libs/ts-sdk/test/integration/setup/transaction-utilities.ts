import {
  WalletUnlocked,
  Provider,
  BN,
  TransactionResult,
  TransactionRequest,
} from "fuels";

/**
 * Transaction configuration for test scenarios
 */
export interface TransactionConfig {
  gasLimit?: BN;
  gasPrice?: BN;
  timeout?: number;
  retries?: number;
  confirmations?: number;
}

/**
 * Transaction result with enhanced metadata
 */
export interface EnhancedTransactionResult {
  result: TransactionResult;
  gasUsed: BN;
  executionTime: number;
  blockNumber?: number;
  transactionId: string;
  status: "success" | "failed" | "reverted";
  error?: string;
}

/**
 * Balance change tracking
 */
export interface BalanceChange {
  address: string;
  assetId: string;
  before: BN;
  after: BN;
  change: BN;
  symbol?: string;
}

/**
 * Transaction utilities for integration testing
 */
export class TransactionUtilities {
  private provider: Provider;
  private defaultConfig: TransactionConfig;

  constructor(provider: Provider, defaultConfig: TransactionConfig = {}) {
    this.provider = provider;
    this.defaultConfig = {
      timeout: 30000, // 30 seconds
      retries: 3,
      confirmations: 1,
      ...defaultConfig,
    };
  }

  /**
   * Execute transaction with enhanced monitoring and error handling
   */
  async executeTransaction(
    wallet: WalletUnlocked,
    transactionRequest: TransactionRequest,
    config: TransactionConfig = {}
  ): Promise<EnhancedTransactionResult> {
    const finalConfig = {...this.defaultConfig, ...config};
    const startTime = Date.now();

    console.log(
      `📤 Executing transaction from ${wallet.address.toB256().slice(0, 10)}...`
    );

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= (finalConfig.retries || 3); attempt++) {
      try {
        if (attempt > 1) {
          console.log(`🔄 Transaction retry attempt ${attempt}...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }

        // Execute transaction with timeout
        const transaction = await this.executeWithTimeout(
          () => wallet.sendTransaction(transactionRequest),
          finalConfig.timeout || 30000
        );

        // Wait for result
        const result = await this.executeWithTimeout(
          () => transaction.waitForResult(),
          finalConfig.timeout || 30000
        );

        const executionTime = Date.now() - startTime;

        // Extract transaction details
        const enhancedResult: EnhancedTransactionResult = {
          result,
          gasUsed: result.gasUsed || new BN(0),
          executionTime,
          blockNumber: result.blockId
            ? parseInt(result.blockId, 16)
            : undefined,
          transactionId: result.id,
          status: result.isStatusSuccess
            ? "success"
            : result.isStatusFailure
              ? "failed"
              : "reverted",
        };

        if (!result.isStatusSuccess) {
          enhancedResult.error = `Transaction failed with status: ${result.status}`;
        }

        console.log(`✅ Transaction completed: ${result.id}`);
        console.log(`⛽ Gas used: ${enhancedResult.gasUsed.format()}`);
        console.log(`⏱️ Execution time: ${executionTime}ms`);

        return enhancedResult;
      } catch (error: any) {
        lastError = error;
        console.error(
          `❌ Transaction attempt ${attempt} failed:`,
          error.message
        );

        if (attempt === (finalConfig.retries || 3)) {
          break; // Don't retry on last attempt
        }
      }
    }

    // All attempts failed
    const executionTime = Date.now() - startTime;
    throw new Error(
      `Transaction failed after ${finalConfig.retries} attempts. Last error: ${lastError?.message}`
    );
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Track balance changes during transaction execution
   */
  async executeWithBalanceTracking(
    wallet: WalletUnlocked,
    transactionRequest: TransactionRequest,
    trackAddresses: string[],
    trackAssets: string[] = [], // Empty means track native asset only
    config: TransactionConfig = {}
  ): Promise<{
    transaction: EnhancedTransactionResult;
    balanceChanges: BalanceChange[];
  }> {
    console.log(
      `📊 Tracking balance changes for ${trackAddresses.length} addresses...`
    );

    // Get balances before transaction
    const beforeBalances = await this.getBalances(trackAddresses, trackAssets);

    // Execute transaction
    const transaction = await this.executeTransaction(
      wallet,
      transactionRequest,
      config
    );

    // Get balances after transaction
    const afterBalances = await this.getBalances(trackAddresses, trackAssets);

    // Calculate changes
    const balanceChanges: BalanceChange[] = [];

    for (const address of trackAddresses) {
      const assetsToCheck = trackAssets.length > 0 ? trackAssets : ["native"];

      for (const assetId of assetsToCheck) {
        const beforeKey = `${address}-${assetId}`;
        const afterKey = `${address}-${assetId}`;

        const before = beforeBalances.get(beforeKey) || new BN(0);
        const after = afterBalances.get(afterKey) || new BN(0);
        const change = after.sub(before);

        if (!change.eq(0)) {
          balanceChanges.push({
            address,
            assetId,
            before,
            after,
            change,
          });
        }
      }
    }

    // Log balance changes
    if (balanceChanges.length > 0) {
      console.log("💰 Balance changes detected:");
      balanceChanges.forEach((change) => {
        const sign = change.change.gte(0) ? "+" : "";
        console.log(
          `  ${change.address.slice(0, 10)}...: ${sign}${change.change.format()}`
        );
      });
    }

    return {
      transaction,
      balanceChanges,
    };
  }

  /**
   * Get balances for multiple addresses and assets
   */
  private async getBalances(
    addresses: string[],
    assetIds: string[]
  ): Promise<Map<string, BN>> {
    const balances = new Map<string, BN>();

    for (const address of addresses) {
      if (assetIds.length === 0 || assetIds.includes("native")) {
        // Get native asset balance
        try {
          const balance = await this.provider.getBalance(address);
          balances.set(`${address}-native`, balance);
        } catch (error) {
          console.warn(
            `⚠️ Could not get native balance for ${address}:`,
            error
          );
          balances.set(`${address}-native`, new BN(0));
        }
      }

      // Get token balances
      for (const assetId of assetIds) {
        if (assetId === "native") continue;

        try {
          const balance = await this.provider.getBalance(address, assetId);
          balances.set(`${address}-${assetId}`, balance);
        } catch (error) {
          console.warn(
            `⚠️ Could not get balance for ${address} asset ${assetId}:`,
            error
          );
          balances.set(`${address}-${assetId}`, new BN(0));
        }
      }
    }

    return balances;
  }

  /**
   * Wait for transaction to be indexed
   */
  async waitForIndexing(
    transactionId: string,
    indexerUrl: string = "http://localhost:4350/graphql",
    maxWaitTime: number = 30000
  ): Promise<boolean> {
    console.log(
      `⏳ Waiting for transaction ${transactionId.slice(0, 10)}... to be indexed...`
    );

    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await fetch(indexerUrl, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            query: `
              query GetTransaction($id: String!) {
                transaction(id: $id) {
                  id
                  blockNumber
                  status
                }
              }
            `,
            variables: {id: transactionId},
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data?.transaction) {
            console.log(
              `✅ Transaction indexed: block ${data.data.transaction.blockNumber}`
            );
            return true;
          }
        }
      } catch (error) {
        // Continue polling on error
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    console.warn(`⚠️ Transaction indexing timeout after ${maxWaitTime}ms`);
    return false;
  }

  /**
   * Batch execute multiple transactions
   */
  async batchExecuteTransactions(
    transactions: Array<{
      wallet: WalletUnlocked;
      request: TransactionRequest;
      name?: string;
    }>,
    config: TransactionConfig = {}
  ): Promise<
    Array<{
      name?: string;
      result?: EnhancedTransactionResult;
      error?: string;
    }>
  > {
    console.log(`📦 Batch executing ${transactions.length} transactions...`);

    const results = [];

    for (let i = 0; i < transactions.length; i++) {
      const {wallet, request, name} = transactions[i];
      const txName = name || `Transaction ${i + 1}`;

      try {
        console.log(`📤 Executing ${txName}...`);
        const result = await this.executeTransaction(wallet, request, config);
        results.push({name: txName, result});

        // Small delay between transactions to prevent nonce conflicts
        if (i < transactions.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error: any) {
        console.error(`❌ ${txName} failed:`, error.message);
        results.push({name: txName, error: error.message});
      }
    }

    const successful = results.filter((r) => r.result).length;
    const failed = results.filter((r) => r.error).length;

    console.log(
      `📊 Batch execution completed: ${successful} successful, ${failed} failed`
    );

    return results;
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(
    wallet: WalletUnlocked,
    transactionRequest: TransactionRequest
  ): Promise<{
    gasLimit: BN;
    gasPrice: BN;
    estimatedCost: BN;
  }> {
    console.log("⛽ Estimating gas for transaction...");

    try {
      // Get gas estimate (this is a simplified version)
      // In a real implementation, you'd use the provider's gas estimation methods
      const gasLimit = new BN(1000000); // Default gas limit
      const gasPrice = new BN(1); // Default gas price
      const estimatedCost = gasLimit.mul(gasPrice);

      console.log(
        `⛽ Gas estimate: ${gasLimit.format()} limit, ${gasPrice.format()} price`
      );
      console.log(`💰 Estimated cost: ${estimatedCost.format()}`);

      return {
        gasLimit,
        gasPrice,
        estimatedCost,
      };
    } catch (error: any) {
      console.error("❌ Gas estimation failed:", error.message);
      throw error;
    }
  }

  /**
   * Validate transaction before execution
   */
  async validateTransaction(
    wallet: WalletUnlocked,
    transactionRequest: TransactionRequest
  ): Promise<{
    valid: boolean;
    issues: string[];
    gasEstimate?: {gasLimit: BN; gasPrice: BN; estimatedCost: BN};
  }> {
    const issues: string[] = [];

    try {
      // Check wallet balance
      const balance = await wallet.getBalance();
      if (balance.eq(0)) {
        issues.push("Wallet has zero balance");
      }

      // Estimate gas
      let gasEstimate;
      try {
        gasEstimate = await this.estimateGas(wallet, transactionRequest);

        // Check if wallet has enough balance for gas
        if (balance.lt(gasEstimate.estimatedCost)) {
          issues.push(
            `Insufficient balance for gas: has ${balance.format()}, needs ${gasEstimate.estimatedCost.format()}`
          );
        }
      } catch (error) {
        issues.push(`Gas estimation failed: ${error}`);
      }

      // Validate transaction request structure
      if (!transactionRequest) {
        issues.push("Transaction request is null or undefined");
      }

      return {
        valid: issues.length === 0,
        issues,
        gasEstimate,
      };
    } catch (error: any) {
      issues.push(`Validation failed: ${error.message}`);
      return {
        valid: false,
        issues,
      };
    }
  }

  /**
   * Get transaction statistics
   */
  getTransactionStats(results: EnhancedTransactionResult[]): {
    totalTransactions: number;
    successful: number;
    failed: number;
    totalGasUsed: BN;
    averageExecutionTime: number;
    totalExecutionTime: number;
  } {
    const successful = results.filter((r) => r.status === "success").length;
    const failed = results.length - successful;

    const totalGasUsed = results.reduce(
      (sum, r) => sum.add(r.gasUsed),
      new BN(0)
    );
    const totalExecutionTime = results.reduce(
      (sum, r) => sum + r.executionTime,
      0
    );
    const averageExecutionTime =
      results.length > 0 ? totalExecutionTime / results.length : 0;

    return {
      totalTransactions: results.length,
      successful,
      failed,
      totalGasUsed,
      averageExecutionTime,
      totalExecutionTime,
    };
  }

  /**
   * Update default configuration
   */
  updateDefaultConfig(config: Partial<TransactionConfig>): void {
    this.defaultConfig = {...this.defaultConfig, ...config};
  }

  /**
   * Get current default configuration
   */
  getDefaultConfig(): TransactionConfig {
    return {...this.defaultConfig};
  }
}

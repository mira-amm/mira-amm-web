import {WalletUnlocked, Provider, BN} from "fuels";
import {TokenFactory, TestToken} from "./token-factory";

/**
 * Wallet configuration for test scenarios
 */
export interface WalletConfig {
  name?: string;
  initialBalance?: string | BN; // ETH balance
  tokens?: Array<{
    symbol: string;
    amount: string | BN;
  }>;
  description?: string;
}

/**
 * Test wallet with metadata and utilities
 */
export interface TestWallet {
  wallet: WalletUnlocked;
  name: string;
  address: string;
  config: WalletConfig;
  createdAt: Date;

  // Utility methods
  getBalance(): Promise<BN>;
  getTokenBalance(symbol: string): Promise<BN>;
  transfer(to: string, amount: string | BN): Promise<any>;
  fundWithTokens(
    tokens: Array<{symbol: string; amount: string | BN}>
  ): Promise<void>;
}

/**
 * Wallet factory for creating and managing test wallets with funding capabilities
 */
export class WalletFactory {
  private provider: Provider;
  private masterWallet: WalletUnlocked;
  private tokenFactory: TokenFactory;
  private createdWallets: Map<string, TestWallet> = new Map();
  private walletCounter = 0;
  private cleanupCallbacks: Array<() => Promise<void>> = [];
  private isCleanupInProgress = false;
  private cleanupHandlersSetup = false;

  constructor(
    provider: Provider,
    masterWallet: WalletUnlocked,
    tokenFactory: TokenFactory
  ) {
    this.provider = provider;
    this.masterWallet = masterWallet;
    this.tokenFactory = tokenFactory;

    // Setup cleanup handlers for graceful shutdown
    this.setupCleanupHandlers();
  }

  /**
   * Retry a function with exponential backoff and improved error handling
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    operationName: string = "operation"
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          console.error(
            `❌ ${operationName} failed after ${maxRetries} attempts: ${lastError.message}`
          );

          // Provide helpful error context
          if (lastError.message.includes("insufficient")) {
            console.error(
              "💡 Suggestion: Check wallet balances and reduce funding amounts"
            );
          } else if (lastError.message.includes("UTXO")) {
            console.error(
              "💡 Suggestion: UTXO conflict detected, try reducing concurrent operations"
            );
          } else if (lastError.message.includes("timeout")) {
            console.error(
              "💡 Suggestion: Network congestion detected, try increasing timeout"
            );
          }

          throw new Error(`${operationName} failed: ${lastError.message}`);
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(
          `⚠️ ${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms: ${lastError.message}`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Create a new test wallet with improved safety and error handling
   */
  async createWallet(config: WalletConfig = {}): Promise<TestWallet> {
    this.walletCounter++;
    const walletName = config.name || `test-wallet-${this.walletCounter}`;

    console.log(`🏦 Creating wallet: ${walletName}...`);

    // Generate new wallet
    const wallet = WalletUnlocked.generate({provider: this.provider});
    const address = wallet.address.toB256();

    // Fund with initial ETH balance if specified (using safer defaults)
    if (config.initialBalance) {
      const amount =
        typeof config.initialBalance === "string"
          ? new BN(config.initialBalance)
          : config.initialBalance;

      // Enhanced balance validation before transfer
      const validation = await this.validateMasterWalletBalance(amount);
      if (!validation.valid) {
        throw new Error(
          `Cannot create wallet ${walletName}: ${validation.issues.join(", ")}`
        );
      }

      console.log(`💰 Funding ${walletName} with ${amount.format()} ETH...`);

      // Use enhanced retry logic with exponential backoff
      await this.retryWithBackoff(
        async () => {
          // Add small delay to prevent UTXO conflicts
          await new Promise((resolve) => setTimeout(resolve, 100));

          const tx = await this.masterWallet.transfer(wallet.address, amount);
          const result = await tx.waitForResult();

          // Verify the transfer was successful
          const newBalance = await wallet.getBalance();
          if (newBalance.lt(amount.div(new BN(2)))) {
            throw new Error(
              `Transfer verification failed. Expected at least ${amount.div(new BN(2)).format()}, got ${newBalance.format()}`
            );
          }

          return result;
        },
        3,
        1000,
        `ETH transfer to ${walletName}`
      );

      console.log(`✅ Funded ${walletName} with ETH`);
    }

    // Create test wallet wrapper
    const testWallet: TestWallet = {
      wallet,
      name: walletName,
      address,
      config,
      createdAt: new Date(),

      // Utility methods
      getBalance: async () => {
        return await wallet.getBalance();
      },

      getTokenBalance: async (symbol: string) => {
        return await this.tokenFactory.getBalance(address, symbol);
      },

      transfer: async (to: string, amount: string | BN) => {
        const transferAmount =
          typeof amount === "string" ? amount : amount.toString();
        const tx = await wallet.transfer(to, transferAmount);
        return await tx.waitForResult();
      },

      fundWithTokens: async (
        tokens: Array<{symbol: string; amount: string | BN}>
      ) => {
        // Validate master wallet has sufficient token balances before funding
        const requiredTokens = tokens.map(({symbol, amount}) => ({
          symbol,
          amount: typeof amount === "string" ? new BN(amount) : amount,
        }));

        const validation = await this.validateMasterWalletBalance(
          new BN(0), // No ETH required for token transfers
          requiredTokens
        );

        if (!validation.valid) {
          throw new Error(
            `Cannot fund wallet with tokens: ${validation.issues.join(", ")}`
          );
        }

        await this.tokenFactory.fundWallet(address, tokens);
      },
    };

    // Fund with tokens if specified
    if (config.tokens && config.tokens.length > 0) {
      console.log(
        `🪙 Funding ${walletName} with ${config.tokens.length} token types...`
      );
      await testWallet.fundWithTokens(config.tokens);
      console.log(`✅ Funded ${walletName} with tokens`);
    }

    // Store wallet
    this.createdWallets.set(walletName, testWallet);

    // Register cleanup callback for this wallet
    this.registerCleanupCallback(async () => {
      await this.cleanupWallet(walletName);
    });

    console.log(
      `✅ Created wallet: ${walletName} (${address.slice(0, 10)}...)`
    );
    return testWallet;
  }

  /**
   * Create multiple wallets with the same configuration
   */
  async createWallets(
    count: number,
    config: WalletConfig = {}
  ): Promise<TestWallet[]> {
    console.log(`🏦 Creating ${count} wallets...`);

    const wallets: TestWallet[] = [];

    for (let i = 0; i < count; i++) {
      const walletConfig = {
        ...config,
        name: config.name ? `${config.name}-${i + 1}` : undefined,
      };

      const wallet = await this.createWallet(walletConfig);
      wallets.push(wallet);
    }

    console.log(`✅ Created ${count} wallets`);
    return wallets;
  }

  /**
   * Create wallets for specific test scenarios with improved safety
   */
  async createScenarioWallets(): Promise<{
    liquidityProvider: TestWallet;
    trader: TestWallet;
    poolCreator: TestWallet;
    observer: TestWallet;
  }> {
    console.log(
      "🎭 Creating scenario-specific wallets with improved safety..."
    );

    // Validate master wallet has sufficient balance for all scenario wallets
    const totalRequired = new BN("400000000000000000"); // 0.4 ETH total (4 * 0.1 ETH)
    const validation = await this.validateMasterWalletBalance(totalRequired);

    if (!validation.valid) {
      throw new Error(
        `Cannot create scenario wallets: ${validation.issues.join(", ")}`
      );
    }

    // Liquidity provider - safe amount for testing
    const liquidityProvider = await this.createWallet({
      name: "liquidity-provider",
      initialBalance: "100000000000000000", // 0.1 ETH (safe amount)
      description: "Wallet for providing liquidity to pools",
    });

    // Trader - safe amount for testing
    const trader = await this.createWallet({
      name: "trader",
      initialBalance: "100000000000000000", // 0.1 ETH (safe amount)
      description: "Wallet for executing swaps and trades",
    });

    // Pool creator - safe amount for testing
    const poolCreator = await this.createWallet({
      name: "pool-creator",
      initialBalance: "100000000000000000", // 0.1 ETH (safe amount)
      description: "Wallet for creating new pools",
    });

    // Observer - minimal balance for read operations
    const observer = await this.createWallet({
      name: "observer",
      initialBalance: "100000000000000000", // 0.1 ETH (consistent amount)
      description: "Wallet for read-only operations and observations",
    });

    console.log("✅ Created scenario wallets with improved safety");

    return {
      liquidityProvider,
      trader,
      poolCreator,
      observer,
    };
  }

  /**
   * Get a wallet by name
   */
  getWallet(name: string): TestWallet | undefined {
    return this.createdWallets.get(name);
  }

  /**
   * Get all created wallets
   */
  getAllWallets(): TestWallet[] {
    return Array.from(this.createdWallets.values());
  }

  /**
   * Get wallet statistics
   */
  getWalletStats(): {
    totalWallets: number;
    totalETHDistributed: BN;
    walletNames: string[];
  } {
    const wallets = this.getAllWallets();

    let totalETH = new BN(0);
    wallets.forEach((wallet) => {
      if (wallet.config.initialBalance) {
        const amount =
          typeof wallet.config.initialBalance === "string"
            ? new BN(wallet.config.initialBalance)
            : wallet.config.initialBalance;
        totalETH = totalETH.add(amount);
      }
    });

    return {
      totalWallets: wallets.length,
      totalETHDistributed: totalETH,
      walletNames: wallets.map((w) => w.name),
    };
  }

  /**
   * Get detailed resource usage statistics
   */
  getResourceStats(): {
    totalWallets: number;
    totalETHDistributed: BN;
    cleanupCallbacksRegistered: number;
    oldestWallet?: Date;
    newestWallet?: Date;
    walletsByAge: Array<{name: string; age: number}>; // age in minutes
  } {
    const wallets = this.getAllWallets();
    const now = new Date();

    let totalETH = new BN(0);
    let oldestWallet: Date | undefined;
    let newestWallet: Date | undefined;

    const walletsByAge = wallets.map((wallet) => {
      const age = (now.getTime() - wallet.createdAt.getTime()) / (1000 * 60); // minutes

      if (!oldestWallet || wallet.createdAt < oldestWallet) {
        oldestWallet = wallet.createdAt;
      }
      if (!newestWallet || wallet.createdAt > newestWallet) {
        newestWallet = wallet.createdAt;
      }

      if (wallet.config.initialBalance) {
        const amount =
          typeof wallet.config.initialBalance === "string"
            ? new BN(wallet.config.initialBalance)
            : wallet.config.initialBalance;
        totalETH = totalETH.add(amount);
      }

      return {
        name: wallet.name,
        age: Math.round(age * 100) / 100, // round to 2 decimal places
      };
    });

    return {
      totalWallets: wallets.length,
      totalETHDistributed: totalETH,
      cleanupCallbacksRegistered: this.cleanupCallbacks.length,
      oldestWallet,
      newestWallet,
      walletsByAge: walletsByAge.sort((a, b) => b.age - a.age), // oldest first
    };
  }

  /**
   * Fund existing wallet with additional tokens
   */
  async fundWallet(
    walletName: string,
    tokens: Array<{symbol: string; amount: string | BN}>
  ): Promise<void> {
    const testWallet = this.getWallet(walletName);
    if (!testWallet) {
      throw new Error(`Wallet ${walletName} not found`);
    }

    // Validate master wallet has sufficient balances before funding
    const requiredTokens = tokens.map(({symbol, amount}) => ({
      symbol,
      amount: typeof amount === "string" ? new BN(amount) : amount,
    }));

    const validation = await this.validateMasterWalletBalance(
      new BN(0), // No ETH required for token transfers
      requiredTokens
    );

    if (!validation.valid) {
      throw new Error(
        `Cannot fund wallet ${walletName}: ${validation.issues.join(", ")}`
      );
    }

    console.log(
      `💰 Funding existing wallet ${walletName} with additional tokens...`
    );
    await testWallet.fundWithTokens(tokens);
    console.log(`✅ Funded ${walletName} with additional tokens`);
  }

  /**
   * Transfer tokens between wallets
   */
  async transferBetweenWallets(
    fromWalletName: string,
    toWalletName: string,
    amount: string | BN
  ): Promise<void> {
    const fromWallet = this.getWallet(fromWalletName);
    const toWallet = this.getWallet(toWalletName);

    if (!fromWallet || !toWallet) {
      throw new Error(`Wallet not found: ${fromWalletName} or ${toWalletName}`);
    }

    const transferAmount = typeof amount === "string" ? new BN(amount) : amount;

    // Validate source wallet has sufficient balance
    const validation = await this.validateWalletBalance(
      fromWalletName,
      transferAmount
    );

    if (!validation.valid) {
      throw new Error(
        `Cannot transfer from ${fromWalletName}: ${validation.issues.join(", ")}`
      );
    }

    console.log(`💸 Transferring from ${fromWalletName} to ${toWalletName}...`);

    // Use retry logic for transfer
    const result = await this.retryWithBackoff(
      async () => {
        const tx = await fromWallet.transfer(toWallet.address, amount);
        return await tx.waitForResult();
      },
      3,
      1000,
      `Transfer from ${fromWalletName} to ${toWalletName}`
    );

    console.log(`✅ Transfer completed: ${result.id}`);
  }

  /**
   * Check balances for all wallets
   */
  async checkAllBalances(): Promise<
    Array<{
      name: string;
      address: string;
      ethBalance: BN;
      tokenBalances: Array<{symbol: string; balance: BN; formatted: string}>;
    }>
  > {
    console.log("💰 Checking balances for all wallets...");

    const results = [];
    const availableTokens = this.tokenFactory.getAllTokens();

    for (const testWallet of this.getAllWallets()) {
      const ethBalance = await testWallet.getBalance();
      const tokenBalances = [];

      // Check balance for each available token
      for (const token of availableTokens) {
        try {
          const balance = await testWallet.getTokenBalance(token.symbol);
          if (balance.gt(0)) {
            tokenBalances.push({
              symbol: token.symbol,
              balance,
              formatted: this.tokenFactory.formatAmount(token.symbol, balance),
            });
          }
        } catch (error) {
          // Skip tokens that can't be checked
        }
      }

      results.push({
        name: testWallet.name,
        address: testWallet.address,
        ethBalance,
        tokenBalances,
      });
    }

    // Log summary
    console.log("📊 Wallet Balance Summary:");
    results.forEach((result) => {
      console.log(`  ${result.name}: ${result.ethBalance.format()} ETH`);
      result.tokenBalances.forEach((token) => {
        console.log(`    ${token.formatted}`);
      });
    });

    return results;
  }

  /**
   * Create a wallet with specific token ratios for testing (safer approach)
   */
  async createBalancedWallet(
    name: string,
    tokenRatios: Array<{symbol: string; ratio: number}> // ratio is percentage (0-100)
  ): Promise<TestWallet> {
    // Very conservative total value for safer testing
    const totalValue = 10; // $10 equivalent in USDC (further reduced for safety)

    // Validate ratios sum to 100%
    const totalRatio = tokenRatios.reduce((sum, {ratio}) => sum + ratio, 0);
    if (Math.abs(totalRatio - 100) > 0.01) {
      throw new Error(`Token ratios must sum to 100%, got ${totalRatio}%`);
    }

    const tokens = tokenRatios.map(({symbol, ratio}) => {
      const valueInUSDC = (totalValue * ratio) / 100;

      // Convert to token amount based on conservative price estimates
      let amount: BN;
      switch (symbol) {
        case "USDC":
        case "USDT":
          amount = this.tokenFactory.getStandardAmount(symbol, valueInUSDC);
          break;
        case "ETH":
          // Assume $2000 per ETH
          amount = this.tokenFactory.getStandardAmount(
            symbol,
            valueInUSDC / 2000
          );
          break;
        case "FUEL":
          // Assume $0.10 per FUEL
          amount = this.tokenFactory.getStandardAmount(
            symbol,
            valueInUSDC / 0.1
          );
          break;
        default:
          // Default to USDC equivalent
          amount = this.tokenFactory.getStandardAmount(symbol, valueInUSDC);
      }

      return {symbol, amount};
    });

    // Create wallet with ETH only first (safer approach)
    const wallet = await this.createWallet({
      name,
      initialBalance: "100000000000000000", // 0.1 ETH for gas
      description: `Balanced wallet with specified token ratios (${totalValue} USD equivalent)`,
    });

    // Note: Token funding is intentionally removed to avoid complex transfers
    // Tokens can be added separately using fundWallet() if needed for specific tests
    console.log(
      `💡 ${name}: Created with ETH only. Use fundWallet() to add tokens if needed.`
    );

    return wallet;
  }

  /**
   * Register a cleanup callback to be executed during cleanup
   */
  registerCleanupCallback(callback: () => Promise<void>): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Perform graceful cleanup of all wallets and resources
   */
  async cleanup(): Promise<void> {
    if (this.isCleanupInProgress) {
      console.log("🧹 WalletFactory cleanup already in progress, skipping...");
      return;
    }

    this.isCleanupInProgress = true;
    console.log("🧹 Starting WalletFactory cleanup...");

    try {
      // Execute cleanup callbacks
      for (const callback of this.cleanupCallbacks) {
        try {
          await callback();
        } catch (error) {
          console.warn("⚠️ Cleanup callback failed:", error);
        }
      }

      // Log wallet statistics before cleanup
      const stats = this.getWalletStats();
      console.log(`📊 Cleaning up ${stats.totalWallets} wallets...`);

      // Clear wallet tracking
      this.createdWallets.clear();
      this.walletCounter = 0;
      this.cleanupCallbacks.length = 0;

      console.log("✅ WalletFactory cleanup completed");
    } catch (error) {
      console.error("❌ WalletFactory cleanup failed:", error);
    } finally {
      this.isCleanupInProgress = false;
    }
  }

  /**
   * Cleanup specific wallet by name
   */
  async cleanupWallet(walletName: string): Promise<void> {
    const wallet = this.getWallet(walletName);
    if (!wallet) {
      console.warn(`⚠️ Wallet ${walletName} not found for cleanup`);
      return;
    }

    try {
      console.log(`🧹 Cleaning up wallet: ${walletName}`);

      // Remove from tracking
      this.createdWallets.delete(walletName);

      console.log(`✅ Cleaned up wallet: ${walletName}`);
    } catch (error) {
      console.error(`❌ Failed to cleanup wallet ${walletName}:`, error);
    }
  }

  /**
   * Setup cleanup handlers for graceful shutdown
   */
  setupCleanupHandlers(): void {
    // Only setup handlers if not already done to prevent memory leaks
    if (!this.cleanupHandlersSetup) {
      const gracefulCleanup = async () => {
        console.log(
          "🧹 WalletFactory: Process exit detected, performing cleanup..."
        );
        await this.cleanup();
      };

      // Register cleanup handlers
      process.on("SIGINT", gracefulCleanup);
      process.on("SIGTERM", gracefulCleanup);
      process.on("beforeExit", gracefulCleanup);

      this.cleanupHandlersSetup = true;
    }
  }

  /**
   * Reset factory state (for test cleanup)
   */
  reset(): void {
    this.createdWallets.clear();
    this.walletCounter = 0;
    this.cleanupCallbacks.length = 0;
    console.log("🧹 WalletFactory reset");
  }

  /**
   * Get master wallet (for emergency operations)
   */
  getMasterWallet(): WalletUnlocked {
    return this.masterWallet;
  }

  /**
   * Validate master wallet has sufficient balance for operations
   */
  async validateMasterWalletBalance(
    requiredETH: BN,
    requiredTokens?: Array<{symbol: string; amount: BN}>
  ): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check master wallet ETH balance
    const masterBalance = await this.masterWallet.getBalance();
    if (masterBalance.lt(requiredETH)) {
      issues.push(
        `Insufficient master wallet ETH balance. Required: ${requiredETH.format()}, Available: ${masterBalance.format()}`
      );
    }

    // Check master wallet token balances if specified
    if (requiredTokens) {
      for (const {symbol, amount} of requiredTokens) {
        try {
          const balance = await this.tokenFactory.getBalance(
            this.masterWallet.address.toB256(),
            symbol
          );
          if (balance.lt(amount)) {
            const formatted = this.tokenFactory.formatAmount(symbol, balance);
            const requiredFormatted = this.tokenFactory.formatAmount(
              symbol,
              amount
            );
            issues.push(
              `Insufficient master wallet ${symbol} balance: has ${formatted}, needs ${requiredFormatted}`
            );
          }
        } catch (error) {
          issues.push(
            `Could not check master wallet ${symbol} balance: ${error.message}`
          );
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Validate wallet has sufficient balance for operation
   */
  async validateWalletBalance(
    walletName: string,
    requiredETH?: BN,
    requiredTokens?: Array<{symbol: string; amount: BN}>
  ): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const wallet = this.getWallet(walletName);
    if (!wallet) {
      return {
        valid: false,
        issues: [`Wallet ${walletName} not found`],
      };
    }

    const issues: string[] = [];

    // Check ETH balance
    if (requiredETH) {
      const ethBalance = await wallet.getBalance();
      if (ethBalance.lt(requiredETH)) {
        issues.push(
          `Insufficient ETH: has ${ethBalance.format()}, needs ${requiredETH.format()}`
        );
      }
    }

    // Check token balances
    if (requiredTokens) {
      for (const {symbol, amount} of requiredTokens) {
        const balance = await wallet.getTokenBalance(symbol);
        if (balance.lt(amount)) {
          const formatted = this.tokenFactory.formatAmount(symbol, balance);
          const requiredFormatted = this.tokenFactory.formatAmount(
            symbol,
            amount
          );
          issues.push(
            `Insufficient ${symbol}: has ${formatted}, needs ${requiredFormatted}`
          );
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

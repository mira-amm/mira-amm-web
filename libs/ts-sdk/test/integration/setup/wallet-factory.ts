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

  constructor(
    provider: Provider,
    masterWallet: WalletUnlocked,
    tokenFactory: TokenFactory
  ) {
    this.provider = provider;
    this.masterWallet = masterWallet;
    this.tokenFactory = tokenFactory;
  }

  /**
   * Create a new test wallet with optional funding
   */
  async createWallet(config: WalletConfig = {}): Promise<TestWallet> {
    this.walletCounter++;
    const walletName = config.name || `test-wallet-${this.walletCounter}`;

    console.log(`🏦 Creating wallet: ${walletName}...`);

    // Generate new wallet
    const wallet = WalletUnlocked.generate({provider: this.provider});
    const address = wallet.address.toB256();

    // Fund with initial ETH balance if specified
    if (config.initialBalance) {
      const amount =
        typeof config.initialBalance === "string"
          ? config.initialBalance
          : config.initialBalance.toString();

      console.log(`💰 Funding ${walletName} with ${amount} ETH...`);

      const tx = await this.masterWallet.transfer(wallet.address, amount);
      await tx.waitForResult();

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
   * Create wallets for specific test scenarios
   */
  async createScenarioWallets(): Promise<{
    liquidityProvider: TestWallet;
    trader: TestWallet;
    poolCreator: TestWallet;
    observer: TestWallet;
  }> {
    console.log("🎭 Creating scenario-specific wallets...");

    // Liquidity provider - needs lots of tokens
    const liquidityProvider = await this.createWallet({
      name: "liquidity-provider",
      initialBalance: "50000000000000000000", // 50 ETH
      tokens: [
        {
          symbol: "USDC",
          amount: this.tokenFactory.getStandardAmount("USDC", 100000),
        }, // 100k USDC
        {
          symbol: "USDT",
          amount: this.tokenFactory.getStandardAmount("USDT", 100000),
        }, // 100k USDT
        {
          symbol: "ETH",
          amount: this.tokenFactory.getStandardAmount("ETH", 100),
        }, // 100 ETH
        {
          symbol: "FUEL",
          amount: this.tokenFactory.getStandardAmount("FUEL", 1000000),
        }, // 1M FUEL
      ],
      description: "Wallet for providing liquidity to pools",
    });

    // Trader - needs moderate amounts for swapping
    const trader = await this.createWallet({
      name: "trader",
      initialBalance: "10000000000000000000", // 10 ETH
      tokens: [
        {
          symbol: "USDC",
          amount: this.tokenFactory.getStandardAmount("USDC", 10000),
        }, // 10k USDC
        {symbol: "ETH", amount: this.tokenFactory.getStandardAmount("ETH", 10)}, // 10 ETH
        {
          symbol: "FUEL",
          amount: this.tokenFactory.getStandardAmount("FUEL", 100000),
        }, // 100k FUEL
      ],
      description: "Wallet for executing swaps and trades",
    });

    // Pool creator - needs gas and some tokens
    const poolCreator = await this.createWallet({
      name: "pool-creator",
      initialBalance: "5000000000000000000", // 5 ETH
      tokens: [
        {
          symbol: "USDC",
          amount: this.tokenFactory.getStandardAmount("USDC", 1000),
        }, // 1k USDC
        {
          symbol: "USDT",
          amount: this.tokenFactory.getStandardAmount("USDT", 1000),
        }, // 1k USDT
      ],
      description: "Wallet for creating new pools",
    });

    // Observer - minimal balance for read operations
    const observer = await this.createWallet({
      name: "observer",
      initialBalance: "1000000000000000000", // 1 ETH
      description: "Wallet for read-only operations and observations",
    });

    console.log("✅ Created scenario wallets");

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

    console.log(`💸 Transferring from ${fromWalletName} to ${toWalletName}...`);

    const tx = await fromWallet.transfer(toWallet.address, amount);

    console.log(`✅ Transfer completed: ${tx.id}`);
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
   * Create a wallet with specific token ratios for testing
   */
  async createBalancedWallet(
    name: string,
    tokenRatios: Array<{symbol: string; ratio: number}> // ratio is percentage (0-100)
  ): Promise<TestWallet> {
    const totalValue = 10000; // $10k equivalent in USDC

    const tokens = tokenRatios.map(({symbol, ratio}) => {
      const valueInUSDC = (totalValue * ratio) / 100;

      // Convert to token amount based on rough price estimates
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

    return await this.createWallet({
      name,
      initialBalance: "5000000000000000000", // 5 ETH for gas
      tokens,
      description: `Balanced wallet with specified token ratios`,
    });
  }

  /**
   * Reset factory state (for test cleanup)
   */
  reset(): void {
    this.createdWallets.clear();
    this.walletCounter = 0;
    console.log("🧹 WalletFactory reset");
  }

  /**
   * Get master wallet (for emergency operations)
   */
  getMasterWallet(): WalletUnlocked {
    return this.masterWallet;
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

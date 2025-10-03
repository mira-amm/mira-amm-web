import {Provider, BN} from "fuels";
import {TokenFactory, TestToken} from "./token-factory";

/**
 * Balance information for a specific asset
 */
export interface AssetBalance {
  assetId: string;
  symbol?: string;
  balance: BN;
  formatted: string;
  decimals?: number;
  isNative: boolean;
}

/**
 * Complete balance information for a wallet
 */
export interface WalletBalance {
  address: string;
  nativeBalance: BN;
  tokenBalances: AssetBalance[];
  totalAssets: number;
  lastChecked: Date;
}

/**
 * Balance comparison result
 */
export interface BalanceComparison {
  address: string;
  assetId: string;
  symbol?: string;
  before: BN;
  after: BN;
  change: BN;
  changeFormatted: string;
  percentChange?: number;
}

/**
 * Balance threshold configuration
 */
export interface BalanceThreshold {
  assetId: string;
  symbol?: string;
  minimum: BN;
  warning: BN;
  critical: BN;
}

/**
 * Comprehensive balance checking utilities for integration testing
 */
export class BalanceChecker {
  private provider: Provider;
  private tokenFactory: TokenFactory;
  private balanceHistory: Map<string, WalletBalance[]> = new Map();
  private thresholds: Map<string, BalanceThreshold> = new Map();

  constructor(provider: Provider, tokenFactory: TokenFactory) {
    this.provider = provider;
    this.tokenFactory = tokenFactory;
    this.setupDefaultThresholds();
  }

  /**
   * Setup default balance thresholds for common tokens
   */
  private setupDefaultThresholds(): void {
    const tokens = this.tokenFactory.getAllTokens();

    tokens.forEach((token) => {
      // Set reasonable thresholds based on token type
      let minimum: BN, warning: BN, critical: BN;

      switch (token.symbol) {
        case "USDC":
        case "USDT":
          minimum = this.tokenFactory.getStandardAmount(token.symbol, 10); // $10
          warning = this.tokenFactory.getStandardAmount(token.symbol, 100); // $100
          critical = this.tokenFactory.getStandardAmount(token.symbol, 1000); // $1000
          break;
        case "ETH":
          minimum = this.tokenFactory.getStandardAmount(token.symbol, 0.01); // 0.01 ETH
          warning = this.tokenFactory.getStandardAmount(token.symbol, 0.1); // 0.1 ETH
          critical = this.tokenFactory.getStandardAmount(token.symbol, 1); // 1 ETH
          break;
        case "FUEL":
          minimum = this.tokenFactory.getStandardAmount(token.symbol, 100); // 100 FUEL
          warning = this.tokenFactory.getStandardAmount(token.symbol, 1000); // 1000 FUEL
          critical = this.tokenFactory.getStandardAmount(token.symbol, 10000); // 10000 FUEL
          break;
        default:
          // Generic thresholds
          minimum = new BN(1);
          warning = new BN(100);
          critical = new BN(1000);
      }

      this.thresholds.set(token.assetId, {
        assetId: token.assetId,
        symbol: token.symbol,
        minimum,
        warning,
        critical,
      });
    });

    // Native asset (ETH) threshold
    this.thresholds.set("native", {
      assetId: "native",
      symbol: "ETH",
      minimum: new BN("1000000000000000000"), // 1 ETH
      warning: new BN("5000000000000000000"), // 5 ETH
      critical: new BN("10000000000000000000"), // 10 ETH
    });
  }

  /**
   * Get complete balance information for a wallet
   */
  async getWalletBalance(address: string): Promise<WalletBalance> {
    console.log(`💰 Checking balances for ${address.slice(0, 10)}...`);

    // Get native balance
    const nativeBalance = await this.provider.getBalance(address);

    // Get all token balances
    const tokenBalances: AssetBalance[] = [];
    const tokens = this.tokenFactory.getAllTokens();

    // Add native balance to token balances
    tokenBalances.push({
      assetId: "native",
      symbol: "ETH",
      balance: nativeBalance,
      formatted: `${nativeBalance.format()} ETH`,
      decimals: 18,
      isNative: true,
    });

    // Check each token balance
    for (const token of tokens) {
      try {
        const balance = await this.tokenFactory.getBalance(
          address,
          token.symbol
        );

        if (balance.gt(0)) {
          tokenBalances.push({
            assetId: token.assetId,
            symbol: token.symbol,
            balance,
            formatted: this.tokenFactory.formatAmount(token.symbol, balance),
            decimals: token.decimals,
            isNative: false,
          });
        }
      } catch (error) {
        console.warn(`⚠️ Could not check balance for ${token.symbol}:`, error);
      }
    }

    const walletBalance: WalletBalance = {
      address,
      nativeBalance,
      tokenBalances,
      totalAssets: tokenBalances.length,
      lastChecked: new Date(),
    };

    // Store in history
    this.addToHistory(address, walletBalance);

    return walletBalance;
  }

  /**
   * Get balances for multiple wallets
   */
  async getMultipleWalletBalances(
    addresses: string[]
  ): Promise<WalletBalance[]> {
    console.log(`💰 Checking balances for ${addresses.length} wallets...`);

    const balances = [];

    for (const address of addresses) {
      try {
        const balance = await this.getWalletBalance(address);
        balances.push(balance);
      } catch (error) {
        console.error(`❌ Failed to get balance for ${address}:`, error);
      }
    }

    return balances;
  }

  /**
   * Compare balances between two points in time
   */
  async compareBalances(
    address: string,
    beforeBalance?: WalletBalance
  ): Promise<BalanceComparison[]> {
    const currentBalance = await this.getWalletBalance(address);

    if (!beforeBalance) {
      const history = this.balanceHistory.get(address);
      if (!history || history.length < 2) {
        throw new Error(`No previous balance found for ${address}`);
      }
      beforeBalance = history[history.length - 2]; // Second to last
    }

    const comparisons: BalanceComparison[] = [];

    // Compare native balance
    const nativeBefore = beforeBalance.nativeBalance;
    const nativeAfter = currentBalance.nativeBalance;
    const nativeChange = nativeAfter.sub(nativeBefore);

    if (!nativeChange.eq(0)) {
      comparisons.push({
        address,
        assetId: "native",
        symbol: "ETH",
        before: nativeBefore,
        after: nativeAfter,
        change: nativeChange,
        changeFormatted: `${nativeChange.gte(0) ? "+" : ""}${nativeChange.format()} ETH`,
        percentChange: this.calculatePercentChange(nativeBefore, nativeAfter),
      });
    }

    // Compare token balances
    const beforeTokens = new Map(
      beforeBalance.tokenBalances.map((t) => [t.assetId, t])
    );
    const afterTokens = new Map(
      currentBalance.tokenBalances.map((t) => [t.assetId, t])
    );

    // Check all assets that existed before or after
    const allAssetIds = new Set([
      ...beforeTokens.keys(),
      ...afterTokens.keys(),
    ]);

    for (const assetId of allAssetIds) {
      if (assetId === "native") continue; // Already handled

      const before = beforeTokens.get(assetId)?.balance || new BN(0);
      const after = afterTokens.get(assetId)?.balance || new BN(0);
      const change = after.sub(before);

      if (!change.eq(0)) {
        const token = this.tokenFactory
          .getAllTokens()
          .find((t) => t.assetId === assetId);
        const symbol = token?.symbol || assetId.slice(0, 8);

        comparisons.push({
          address,
          assetId,
          symbol,
          before,
          after,
          change,
          changeFormatted: token
            ? `${change.gte(0) ? "+" : ""}${this.tokenFactory.formatAmount(symbol, change)}`
            : `${change.gte(0) ? "+" : ""}${change.format()}`,
          percentChange: this.calculatePercentChange(before, after),
        });
      }
    }

    return comparisons;
  }

  /**
   * Calculate percentage change between two values
   */
  private calculatePercentChange(before: BN, after: BN): number | undefined {
    if (before.eq(0)) {
      return after.gt(0) ? Infinity : 0;
    }

    const change = after.sub(before);
    const percentChange = change.mul(new BN(100)).div(before);

    return parseFloat(percentChange.toString());
  }

  /**
   * Check if balances meet threshold requirements
   */
  checkThresholds(walletBalance: WalletBalance): {
    address: string;
    alerts: Array<{
      assetId: string;
      symbol?: string;
      balance: BN;
      threshold: BN;
      level: "minimum" | "warning" | "critical";
      message: string;
    }>;
  } {
    const alerts = [];

    for (const assetBalance of walletBalance.tokenBalances) {
      const threshold = this.thresholds.get(assetBalance.assetId);
      if (!threshold) continue;

      let level: "minimum" | "warning" | "critical" | null = null;
      let thresholdValue: BN;

      if (assetBalance.balance.lt(threshold.minimum)) {
        level = "minimum";
        thresholdValue = threshold.minimum;
      } else if (assetBalance.balance.lt(threshold.warning)) {
        level = "warning";
        thresholdValue = threshold.warning;
      } else if (assetBalance.balance.lt(threshold.critical)) {
        level = "critical";
        thresholdValue = threshold.critical;
      }

      if (level) {
        alerts.push({
          assetId: assetBalance.assetId,
          symbol: assetBalance.symbol,
          balance: assetBalance.balance,
          threshold: thresholdValue,
          level,
          message: `${assetBalance.symbol || assetBalance.assetId} balance (${assetBalance.formatted}) is below ${level} threshold`,
        });
      }
    }

    return {
      address: walletBalance.address,
      alerts,
    };
  }

  /**
   * Monitor balances and alert on threshold violations
   */
  async monitorBalances(addresses: string[]): Promise<void> {
    console.log(`👀 Monitoring balances for ${addresses.length} addresses...`);

    const balances = await this.getMultipleWalletBalances(addresses);

    for (const balance of balances) {
      const thresholdCheck = this.checkThresholds(balance);

      if (thresholdCheck.alerts.length > 0) {
        console.warn(
          `⚠️ Balance alerts for ${balance.address.slice(0, 10)}...:`
        );
        thresholdCheck.alerts.forEach((alert) => {
          const icon =
            alert.level === "critical"
              ? "🚨"
              : alert.level === "warning"
                ? "⚠️"
                : "ℹ️";
          console.warn(`  ${icon} ${alert.message}`);
        });
      }
    }
  }

  /**
   * Add balance to history
   */
  private addToHistory(address: string, balance: WalletBalance): void {
    if (!this.balanceHistory.has(address)) {
      this.balanceHistory.set(address, []);
    }

    const history = this.balanceHistory.get(address)!;
    history.push(balance);

    // Keep only last 10 entries
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * Get balance history for an address
   */
  getBalanceHistory(address: string): WalletBalance[] {
    return this.balanceHistory.get(address) || [];
  }

  /**
   * Set custom threshold for an asset
   */
  setThreshold(assetId: string, threshold: BalanceThreshold): void {
    this.thresholds.set(assetId, threshold);
  }

  /**
   * Get threshold for an asset
   */
  getThreshold(assetId: string): BalanceThreshold | undefined {
    return this.thresholds.get(assetId);
  }

  /**
   * Generate balance report
   */
  generateBalanceReport(balances: WalletBalance[]): {
    totalWallets: number;
    totalAssets: number;
    assetDistribution: {[symbol: string]: {wallets: number; totalBalance: BN}};
    thresholdViolations: number;
    summary: string;
  } {
    const assetDistribution: {
      [symbol: string]: {wallets: number; totalBalance: BN};
    } = {};
    let thresholdViolations = 0;

    balances.forEach((balance) => {
      // Check threshold violations
      const thresholdCheck = this.checkThresholds(balance);
      thresholdViolations += thresholdCheck.alerts.length;

      // Aggregate asset distribution
      balance.tokenBalances.forEach((asset) => {
        const symbol = asset.symbol || asset.assetId;

        if (!assetDistribution[symbol]) {
          assetDistribution[symbol] = {wallets: 0, totalBalance: new BN(0)};
        }

        assetDistribution[symbol].wallets++;
        assetDistribution[symbol].totalBalance = assetDistribution[
          symbol
        ].totalBalance.add(asset.balance);
      });
    });

    const totalAssets = Object.keys(assetDistribution).length;

    const summary = `
Balance Report Summary:
- Total Wallets: ${balances.length}
- Total Asset Types: ${totalAssets}
- Threshold Violations: ${thresholdViolations}
- Most Common Assets: ${Object.entries(assetDistribution)
      .sort((a, b) => b[1].wallets - a[1].wallets)
      .slice(0, 3)
      .map(([symbol, data]) => `${symbol} (${data.wallets} wallets)`)
      .join(", ")}
    `.trim();

    return {
      totalWallets: balances.length,
      totalAssets,
      assetDistribution,
      thresholdViolations,
      summary,
    };
  }

  /**
   * Clear balance history
   */
  clearHistory(): void {
    this.balanceHistory.clear();
    console.log("🧹 Balance history cleared");
  }

  /**
   * Export balance data for analysis
   */
  exportBalanceData(addresses?: string[]): {
    timestamp: Date;
    balances: WalletBalance[];
    thresholds: {[assetId: string]: BalanceThreshold};
  } {
    const targetAddresses = addresses || Array.from(this.balanceHistory.keys());
    const balances = targetAddresses
      .map(
        (addr) =>
          this.balanceHistory.get(addr)?.[
            this.balanceHistory.get(addr)!.length - 1
          ]
      )
      .filter(Boolean) as WalletBalance[];

    const thresholds: {[assetId: string]: BalanceThreshold} = {};
    this.thresholds.forEach((threshold, assetId) => {
      thresholds[assetId] = threshold;
    });

    return {
      timestamp: new Date(),
      balances,
      thresholds,
    };
  }
}

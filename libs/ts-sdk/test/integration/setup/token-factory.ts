import {BN, WalletUnlocked, AssetId} from "fuels";
import * as fs from "fs";
import * as path from "path";
// Import the Fungible contract from the deployed contracts
// Since we can't use relative imports for generated files, we'll import dynamically

export interface TestToken {
  name: string;
  symbol: string;
  assetId: string;
  decimals: number;
  contractId: string;
  subId: string;
}

/**
 * Token factory for creating and managing test tokens
 */
export class TokenFactory {
  private fungibleContract?: Fungible;
  private verifiedAssets: any[] = [];
  private testTokens: Map<string, TestToken> = new Map();

  constructor(
    private wallet: WalletUnlocked,
    private fungibleContractId: string
  ) {
    this.loadVerifiedAssets();
  }

  /**
   * Load verified assets configuration
   */
  private loadVerifiedAssets() {
    try {
      // Find project root by looking for pnpm workspace file
      let currentDir = __dirname;
      while (
        currentDir !== "/" &&
        !fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))
      ) {
        currentDir = path.dirname(currentDir);
      }

      const assetsPath = path.join(
        currentDir,
        "libs/web/src/utils/verified-assets.json"
      );
      this.verifiedAssets = JSON.parse(fs.readFileSync(assetsPath, "utf8"));

      // Extract local testnet tokens
      this.verifiedAssets.forEach((asset) => {
        const localNetwork = asset.networks?.find(
          (n: any) => n.type === "fuel" && n.chain === "local_testnet"
        );

        if (localNetwork) {
          this.testTokens.set(asset.symbol, {
            name: asset.name,
            symbol: asset.symbol,
            assetId: localNetwork.assetId,
            decimals: localNetwork.decimals,
            contractId: localNetwork.contractId,
            subId: localNetwork.subId,
          });
        }
      });

      console.log(`📦 Loaded ${this.testTokens.size} test tokens`);
    } catch (error) {
      console.warn("Could not load verified assets:", error);
    }
  }

  /**
   * Get fungible contract instance
   */
  private async getFungibleContract(): Promise<any> {
    if (!this.fungibleContract) {
      // Find project root to dynamically import the Fungible contract
      let currentDir = __dirname;
      while (
        currentDir !== "/" &&
        !fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))
      ) {
        currentDir = path.dirname(currentDir);
      }

      const fungiblePath = path.join(
        currentDir,
        "apps/indexer/mira-binned-liquidity-api/contracts/Fungible"
      );
      const {Fungible} = await import(fungiblePath);
      this.fungibleContract = new Fungible(
        this.fungibleContractId,
        this.wallet
      );
    }
    return this.fungibleContract;
  }

  /**
   * Get test token by symbol
   */
  getToken(symbol: string): TestToken | undefined {
    return this.testTokens.get(symbol);
  }

  /**
   * Get all available test tokens
   */
  getAllTokens(): TestToken[] {
    return Array.from(this.testTokens.values());
  }

  /**
   * Mint tokens to a wallet
   */
  async mintTokens(
    symbol: string,
    recipient: string,
    amount: BN | string
  ): Promise<void> {
    const token = this.getToken(symbol);
    if (!token) {
      throw new Error(`Token ${symbol} not found`);
    }

    const contract = await this.getFungibleContract();
    const mintAmount = typeof amount === "string" ? new BN(amount) : amount;

    console.log(
      `🪙 Minting ${mintAmount.format()} ${symbol} to ${recipient.slice(0, 10)}...`
    );

    const tx = await contract.functions
      .mint({Address: {bits: recipient}}, token.subId, mintAmount.toNumber())
      .call();

    await tx.waitForResult();
    console.log(`✅ Minted ${symbol} successfully`);
  }

  /**
   * Get token balance for a wallet
   */
  async getBalance(walletAddress: string, symbol: string): Promise<BN> {
    const token = this.getToken(symbol);
    if (!token) {
      throw new Error(`Token ${symbol} not found`);
    }

    const provider = this.wallet.provider;
    const balancesResult = await provider.getBalances(walletAddress);

    // Handle different response formats
    const balances = Array.isArray(balancesResult)
      ? balancesResult
      : balancesResult.balances || [];

    const balance = balances.find((b) => b.assetId === token.assetId);
    return balance ? balance.amount : new BN(0);
  }

  /**
   * Fund a wallet with multiple test tokens
   */
  async fundWallet(
    walletAddress: string,
    tokens: Array<{symbol: string; amount: string | BN}>
  ): Promise<void> {
    console.log(`💰 Funding wallet ${walletAddress.slice(0, 10)}...`);

    for (const {symbol, amount} of tokens) {
      await this.mintTokens(symbol, walletAddress, amount);
    }

    console.log("✅ Wallet funded successfully");
  }

  /**
   * Create standard test token amounts based on decimals
   */
  getStandardAmount(symbol: string, units: number): BN {
    const token = this.getToken(symbol);
    if (!token) {
      throw new Error(`Token ${symbol} not found`);
    }

    // Convert units to smallest denomination
    // Handle decimal inputs by multiplying by 1000 and then adjusting for decimals
    const unitsScaled = Math.floor(units * 1000); // Convert to integer (0.01 -> 10)
    const decimalMultiplier = new BN(10).pow(token.decimals); // 10^decimals
    const scaleDivisor = new BN(1000); // Divide by scale factor

    return new BN(unitsScaled).mul(decimalMultiplier).div(scaleDivisor);
  }

  /**
   * Format token amount for display
   */
  formatAmount(symbol: string, amount: BN): string {
    const token = this.getToken(symbol);
    if (!token) {
      return amount.format();
    }

    const divisor = new BN(10).pow(token.decimals);
    const units = amount.div(divisor);
    const remainder = amount.mod(divisor);

    if (remainder.eq(0)) {
      return `${units.format()} ${symbol}`;
    }

    const decimal = remainder.toString().padStart(token.decimals, "0");
    const trimmedDecimal = decimal.replace(/0+$/, "");
    return `${units.format()}.${trimmedDecimal} ${symbol}`;
  }

  /**
   * Get common test token pairs for pool creation
   */
  getTestPairs(): Array<[TestToken, TestToken]> {
    const pairs: Array<[TestToken, TestToken]> = [];

    // USDC/USDT - Stable pair
    const usdc = this.getToken("USDC");
    const usdt = this.getToken("USDT");
    if (usdc && usdt) {
      pairs.push([usdc, usdt]);
    }

    // ETH/USDC - Volatile pair
    const eth = this.getToken("ETH");
    if (eth && usdc) {
      pairs.push([eth, usdc]);
    }

    // FUEL/USDC - Native token pair
    const fuel = this.getToken("FUEL");
    if (fuel && usdc) {
      pairs.push([fuel, usdc]);
    }

    // mBTC/ETH - Crypto pair
    const mbtc = this.getToken("Manta mBTC");
    if (mbtc && eth) {
      pairs.push([mbtc, eth]);
    }

    return pairs;
  }

  /**
   * Prepare tokens for liquidity provision
   */
  async prepareLiquidityTokens(
    wallet: WalletUnlocked,
    tokenX: string,
    tokenY: string,
    amountX: number,
    amountY: number
  ): Promise<{
    tokenX: TestToken;
    tokenY: TestToken;
    amountXBN: BN;
    amountYBN: BN;
  }> {
    const tokenXInfo = this.getToken(tokenX);
    const tokenYInfo = this.getToken(tokenY);

    if (!tokenXInfo || !tokenYInfo) {
      throw new Error(`Token ${tokenX} or ${tokenY} not found`);
    }

    const amountXBN = this.getStandardAmount(tokenX, amountX);
    const amountYBN = this.getStandardAmount(tokenY, amountY);

    // Mint tokens to wallet
    await this.fundWallet(wallet.address.toB256(), [
      {symbol: tokenX, amount: amountXBN},
      {symbol: tokenY, amount: amountYBN},
    ]);

    return {
      tokenX: tokenXInfo,
      tokenY: tokenYInfo,
      amountXBN,
      amountYBN,
    };
  }

  /**
   * Batch mint tokens to multiple wallets
   */
  async batchMintTokens(
    recipients: Array<{
      address: string;
      tokens: Array<{symbol: string; amount: BN | string}>;
    }>
  ): Promise<void> {
    console.log(`🪙 Batch minting tokens to ${recipients.length} wallets...`);

    for (const recipient of recipients) {
      console.log(`💰 Minting to ${recipient.address.slice(0, 10)}...`);

      for (const {symbol, amount} of recipient.tokens) {
        await this.mintTokens(symbol, recipient.address, amount);
      }
    }

    console.log("✅ Batch minting completed");
  }

  /**
   * Get token balance in multiple formats
   */
  async getBalanceDetails(
    walletAddress: string,
    symbol: string
  ): Promise<{
    raw: BN;
    formatted: string;
    units: number;
    token: TestToken;
  }> {
    const token = this.getToken(symbol);
    if (!token) {
      throw new Error(`Token ${symbol} not found`);
    }

    const balance = await this.getBalance(walletAddress, symbol);
    const formatted = this.formatAmount(symbol, balance);

    // Convert to units (human readable number)
    const divisor = new BN(10).pow(token.decimals);
    const units = parseFloat(balance.div(divisor).toString());

    return {
      raw: balance,
      formatted,
      units,
      token,
    };
  }

  /**
   * Check if wallet has sufficient token balance
   */
  async hasSufficientBalance(
    walletAddress: string,
    symbol: string,
    requiredAmount: BN | string
  ): Promise<boolean> {
    const balance = await this.getBalance(walletAddress, symbol);
    const required =
      typeof requiredAmount === "string"
        ? new BN(requiredAmount)
        : requiredAmount;

    return balance.gte(required);
  }

  /**
   * Get all token balances for a wallet
   */
  async getAllBalances(walletAddress: string): Promise<
    Array<{
      symbol: string;
      balance: BN;
      formatted: string;
      token: TestToken;
    }>
  > {
    const balances = [];

    for (const token of this.getAllTokens()) {
      try {
        const balance = await this.getBalance(walletAddress, token.symbol);
        if (balance.gt(0)) {
          balances.push({
            symbol: token.symbol,
            balance,
            formatted: this.formatAmount(token.symbol, balance),
            token,
          });
        }
      } catch (error) {
        // Skip tokens that can't be queried
        console.warn(`⚠️ Could not get balance for ${token.symbol}:`, error);
      }
    }

    return balances;
  }

  /**
   * Create test token amounts for different scenarios
   */
  getScenarioAmounts(scenario: "small" | "medium" | "large" | "whale"): {
    [symbol: string]: BN;
  } {
    const amounts: {[symbol: string]: BN} = {};

    const multipliers = {
      small: 1,
      medium: 10,
      large: 100,
      whale: 1000,
    };

    const baseAmounts = {
      USDC: 1000, // $1k base
      USDT: 1000, // $1k base
      ETH: 1, // 1 ETH base
      FUEL: 10000, // 10k FUEL base
    };

    const multiplier = multipliers[scenario];

    for (const [symbol, baseAmount] of Object.entries(baseAmounts)) {
      if (this.getToken(symbol)) {
        amounts[symbol] = this.getStandardAmount(
          symbol,
          baseAmount * multiplier
        );
      }
    }

    return amounts;
  }

  /**
   * Transfer tokens between wallets (requires wallet instances)
   */
  async transferTokens(
    fromWallet: WalletUnlocked,
    toAddress: string,
    symbol: string,
    amount: BN | string
  ): Promise<void> {
    const token = this.getToken(symbol);
    if (!token) {
      throw new Error(`Token ${symbol} not found`);
    }

    // For now, we'll use the mint function to simulate transfers
    // In a real implementation, this would use actual token transfer methods
    console.log(
      `🔄 Transferring ${symbol} from ${fromWallet.address.toB256().slice(0, 10)}... to ${toAddress.slice(0, 10)}...`
    );

    // Check sender has sufficient balance
    const senderBalance = await this.getBalance(
      fromWallet.address.toB256(),
      symbol
    );
    const transferAmount = typeof amount === "string" ? new BN(amount) : amount;

    if (senderBalance.lt(transferAmount)) {
      throw new Error(`Insufficient ${symbol} balance for transfer`);
    }

    // For testing purposes, we'll mint to the recipient
    // In production, this would be an actual transfer transaction
    await this.mintTokens(symbol, toAddress, transferAmount);

    console.log(`✅ Transfer completed`);
  }

  /**
   * Validate token configuration
   */
  validateTokenConfig(symbol: string): {
    valid: boolean;
    issues: string[];
  } {
    const token = this.getToken(symbol);
    const issues: string[] = [];

    if (!token) {
      issues.push(`Token ${symbol} not found`);
      return {valid: false, issues};
    }

    // Validate token properties
    if (!token.assetId || !token.assetId.match(/^0x[a-fA-F0-9]{64}$/)) {
      issues.push(`Invalid asset ID format: ${token.assetId}`);
    }

    if (!token.contractId || !token.contractId.match(/^0x[a-fA-F0-9]{64}$/)) {
      issues.push(`Invalid contract ID format: ${token.contractId}`);
    }

    if (token.decimals < 0 || token.decimals > 18) {
      issues.push(`Invalid decimals: ${token.decimals}`);
    }

    if (!token.name || token.name.length === 0) {
      issues.push("Token name is empty");
    }

    if (!token.symbol || token.symbol.length === 0) {
      issues.push("Token symbol is empty");
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get token statistics
   */
  getTokenStats(): {
    totalTokens: number;
    validTokens: number;
    invalidTokens: number;
    tokensByDecimals: {[decimals: number]: string[]};
  } {
    const tokens = this.getAllTokens();
    let validCount = 0;
    let invalidCount = 0;
    const tokensByDecimals: {[decimals: number]: string[]} = {};

    tokens.forEach((token) => {
      const validation = this.validateTokenConfig(token.symbol);
      if (validation.valid) {
        validCount++;
      } else {
        invalidCount++;
      }

      // Group by decimals
      if (!tokensByDecimals[token.decimals]) {
        tokensByDecimals[token.decimals] = [];
      }
      tokensByDecimals[token.decimals].push(token.symbol);
    });

    return {
      totalTokens: tokens.length,
      validTokens: validCount,
      invalidTokens: invalidCount,
      tokensByDecimals,
    };
  }

  /**
   * Create token amounts for swap testing
   */
  getSwapTestAmounts(
    inputToken: string,
    swapSize: "micro" | "small" | "medium" | "large"
  ): BN {
    const token = this.getToken(inputToken);
    if (!token) {
      throw new Error(`Token ${inputToken} not found`);
    }

    // Define swap sizes based on token type and liquidity expectations
    const swapSizes = {
      micro: 0.1, // Very small swap
      small: 1, // Small swap
      medium: 10, // Medium swap
      large: 100, // Large swap
    };

    const baseAmounts: {[symbol: string]: number} = {
      USDC: 100, // $100 base swap
      USDT: 100, // $100 base swap
      ETH: 0.1, // 0.1 ETH base swap
      FUEL: 1000, // 1000 FUEL base swap
    };

    const baseAmount = baseAmounts[inputToken] || 100; // Default to 100 units
    const multiplier = swapSizes[swapSize];

    return this.getStandardAmount(inputToken, baseAmount * multiplier);
  }
}

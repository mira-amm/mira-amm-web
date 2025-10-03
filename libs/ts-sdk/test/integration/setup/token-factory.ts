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
}

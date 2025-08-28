import {BN} from "fuels";
import {AssetId} from "../model";

/**
 * Mock account implementation for testing without blockchain interactions
 * Manages user balances and provides balance checking functionality
 */
export class MockAccount {
  private balances: Map<string, BN> = new Map();

  constructor(
    public readonly address: string,
    initialBalances?: Record<string, BN | string | number>
  ) {
    if (initialBalances) {
      this.initializeBalances(initialBalances);
    }
  }

  /**
   * Initialize account with starting balances
   */
  private initializeBalances(
    balances: Record<string, BN | string | number>
  ): void {
    for (const [assetId, amount] of Object.entries(balances)) {
      const bnAmount =
        typeof amount === "string" || typeof amount === "number"
          ? new BN(amount)
          : amount;
      this.balances.set(assetId, bnAmount);
    }
  }

  /**
   * Get balance for a specific asset
   * @param assetId - The asset identifier
   * @returns The balance amount, or 0 if asset not found
   */
  getBalance(assetId: string | AssetId): BN {
    const id = typeof assetId === "string" ? assetId : assetId.bits;
    return this.balances.get(id) || new BN(0);
  }

  /**
   * Update balance for a specific asset
   * @param assetId - The asset identifier
   * @param amount - The new balance amount
   */
  updateBalance(assetId: string | AssetId, amount: BN): void {
    const id = typeof assetId === "string" ? assetId : assetId.bits;
    this.balances.set(id, amount);
  }

  /**
   * Add to existing balance
   * @param assetId - The asset identifier
   * @param amount - The amount to add
   */
  addBalance(assetId: string | AssetId, amount: BN): void {
    const id = typeof assetId === "string" ? assetId : assetId.bits;
    const currentBalance = this.getBalance(id);
    this.balances.set(id, currentBalance.add(amount));
  }

  /**
   * Subtract from existing balance
   * @param assetId - The asset identifier
   * @param amount - The amount to subtract
   * @throws Error if insufficient balance
   */
  subtractBalance(assetId: string | AssetId, amount: BN): void {
    const id = typeof assetId === "string" ? assetId : assetId.bits;
    const currentBalance = this.getBalance(id);

    if (currentBalance.lt(amount)) {
      throw new Error(
        `Insufficient balance for asset ${id}. Current: ${currentBalance.toString()}, Required: ${amount.toString()}`
      );
    }

    this.balances.set(id, currentBalance.sub(amount));
  }

  /**
   * Check if account has sufficient balance for a specific asset
   * @param assetId - The asset identifier
   * @param amount - The required amount
   * @returns True if balance is sufficient
   */
  hasBalance(assetId: string | AssetId, amount: BN): boolean {
    const currentBalance = this.getBalance(assetId);
    return currentBalance.gte(amount);
  }

  /**
   * Check if account has sufficient balances for multiple assets
   * @param requirements - Map of asset ID to required amount
   * @returns True if all balances are sufficient
   */
  hasBalances(requirements: Map<string | AssetId, BN>): boolean {
    for (const [assetId, amount] of requirements) {
      if (!this.hasBalance(assetId, amount)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all non-zero balances
   * @returns Map of asset ID to balance
   */
  getAllBalances(): Map<string, BN> {
    const nonZeroBalances = new Map<string, BN>();
    for (const [assetId, balance] of this.balances) {
      if (balance.gt(0)) {
        nonZeroBalances.set(assetId, balance);
      }
    }
    return nonZeroBalances;
  }

  /**
   * Set multiple balances at once
   * @param balances - Map of asset ID to balance
   */
  setBalances(balances: Map<string | AssetId, BN>): void {
    for (const [assetId, amount] of balances) {
      this.updateBalance(assetId, amount);
    }
  }

  /**
   * Reset all balances to zero
   */
  clearBalances(): void {
    this.balances.clear();
  }

  /**
   * Create a copy of this account with the same balances
   * @param newAddress - Optional new address for the copy
   * @returns New MockAccount instance
   */
  clone(newAddress?: string): MockAccount {
    const account = new MockAccount(newAddress || this.address);
    account.balances = new Map(this.balances);
    return account;
  }

  /**
   * Get account summary for debugging
   * @returns Object with account details
   */
  getSummary(): {
    address: string;
    totalAssets: number;
    balances: Record<string, string>;
  } {
    const balances: Record<string, string> = {};
    for (const [assetId, balance] of this.getAllBalances()) {
      balances[assetId] = balance.toString();
    }

    return {
      address: this.address,
      totalAssets: this.balances.size,
      balances,
    };
  }

  /**
   * Create a mock account with default test balances
   * @param address - Account address
   * @returns MockAccount with test balances
   */
  static createWithTestBalances(
    address: string = "0x1234567890abcdef"
  ): MockAccount {
    const testBalances = {
      // ETH equivalent
      "0x0000000000000000000000000000000000000000000000000000000000000000":
        new BN("1000000000000000000"), // 1 ETH
      // USDC equivalent
      "0x0000000000000000000000000000000000000000000000000000000000000001":
        new BN("1000000000"), // 1000 USDC (6 decimals)
      // DAI equivalent
      "0x0000000000000000000000000000000000000000000000000000000000000002":
        new BN("1000000000000000000000"), // 1000 DAI (18 decimals)
    };

    return new MockAccount(address, testBalances);
  }
}

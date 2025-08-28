import {describe, it, expect, beforeEach} from "vitest";
import {BN} from "fuels";
import {MockAccount} from "../MockAccount";

describe("MockAccount", () => {
  let account: MockAccount;
  const testAddress = "0x1234567890abcdef";
  const assetId1 =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const assetId2 =
    "0x0000000000000000000000000000000000000000000000000000000000000001";

  beforeEach(() => {
    account = new MockAccount(testAddress);
  });

  describe("constructor", () => {
    it("should create account with address", () => {
      expect(account.address).toBe(testAddress);
    });

    it("should initialize with provided balances", () => {
      const initialBalances = {
        [assetId1]: new BN(1000),
        [assetId2]: "2000",
      };

      const accountWithBalances = new MockAccount(testAddress, initialBalances);

      expect(accountWithBalances.getBalance(assetId1)).toEqual(new BN(1000));
      expect(accountWithBalances.getBalance(assetId2)).toEqual(new BN(2000));
    });
  });

  describe("balance management", () => {
    it("should return zero for non-existent asset", () => {
      expect(account.getBalance(assetId1)).toEqual(new BN(0));
    });

    it("should update balance correctly", () => {
      const amount = new BN(1000);
      account.updateBalance(assetId1, amount);

      expect(account.getBalance(assetId1)).toEqual(amount);
    });

    it("should add to existing balance", () => {
      account.updateBalance(assetId1, new BN(1000));
      account.addBalance(assetId1, new BN(500));

      expect(account.getBalance(assetId1).eq(new BN(1500))).toBe(true);
    });

    it("should subtract from existing balance", () => {
      account.updateBalance(assetId1, new BN(1000));
      account.subtractBalance(assetId1, new BN(300));

      expect(account.getBalance(assetId1).eq(new BN(700))).toBe(true);
    });

    it("should throw error when subtracting more than balance", () => {
      account.updateBalance(assetId1, new BN(100));

      expect(() => {
        account.subtractBalance(assetId1, new BN(200));
      }).toThrow("Insufficient balance");
    });
  });

  describe("balance checking", () => {
    beforeEach(() => {
      account.updateBalance(assetId1, new BN(1000));
      account.updateBalance(assetId2, new BN(500));
    });

    it("should correctly check if has sufficient balance", () => {
      expect(account.hasBalance(assetId1, new BN(500))).toBe(true);
      expect(account.hasBalance(assetId1, new BN(1000))).toBe(true);
      expect(account.hasBalance(assetId1, new BN(1500))).toBe(false);
    });

    it("should check multiple balances", () => {
      const requirements = new Map([
        [assetId1, new BN(500)],
        [assetId2, new BN(300)],
      ]);

      expect(account.hasBalances(requirements)).toBe(true);

      requirements.set(assetId2, new BN(600));
      expect(account.hasBalances(requirements)).toBe(false);
    });
  });

  describe("utility methods", () => {
    beforeEach(() => {
      account.updateBalance(assetId1, new BN(1000));
      account.updateBalance(assetId2, new BN(0)); // Zero balance should not appear in getAllBalances
    });

    it("should get all non-zero balances", () => {
      const balances = account.getAllBalances();

      expect(balances.size).toBe(1);
      expect(balances.get(assetId1)).toEqual(new BN(1000));
      expect(balances.has(assetId2)).toBe(false);
    });

    it("should set multiple balances", () => {
      const newBalances = new Map([
        [assetId1, new BN(2000)],
        [assetId2, new BN(3000)],
      ]);

      account.setBalances(newBalances);

      expect(account.getBalance(assetId1)).toEqual(new BN(2000));
      expect(account.getBalance(assetId2)).toEqual(new BN(3000));
    });

    it("should clear all balances", () => {
      account.clearBalances();

      expect(account.getBalance(assetId1)).toEqual(new BN(0));
      expect(account.getAllBalances().size).toBe(0);
    });

    it("should clone account correctly", () => {
      const cloned = account.clone();

      expect(cloned.address).toBe(account.address);
      expect(cloned.getBalance(assetId1)).toEqual(account.getBalance(assetId1));

      // Verify independence
      cloned.updateBalance(assetId1, new BN(5000));
      expect(account.getBalance(assetId1)).toEqual(new BN(1000));
    });

    it("should clone with new address", () => {
      const newAddress = "0xabcdef1234567890";
      const cloned = account.clone(newAddress);

      expect(cloned.address).toBe(newAddress);
      expect(cloned.getBalance(assetId1)).toEqual(account.getBalance(assetId1));
    });

    it("should provide account summary", () => {
      const summary = account.getSummary();

      expect(summary.address).toBe(testAddress);
      expect(summary.totalAssets).toBe(2); // Including zero balance asset
      expect(summary.balances[assetId1]).toBe("1000");
    });
  });

  describe("static factory methods", () => {
    it("should create account with test balances", () => {
      const testAccount = MockAccount.createWithTestBalances();

      expect(testAccount.address).toBe("0x1234567890abcdef");

      const balances = testAccount.getAllBalances();
      expect(balances.size).toBe(3);

      // Check that test balances are set
      expect(
        testAccount
          .getBalance(
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          )
          .gt(0)
      ).toBe(true);
      expect(
        testAccount
          .getBalance(
            "0x0000000000000000000000000000000000000000000000000000000000000001"
          )
          .gt(0)
      ).toBe(true);
      expect(
        testAccount
          .getBalance(
            "0x0000000000000000000000000000000000000000000000000000000000000002"
          )
          .gt(0)
      ).toBe(true);
    });

    it("should create account with custom address and test balances", () => {
      const customAddress = "0xcustom123456789";
      const testAccount = MockAccount.createWithTestBalances(customAddress);

      expect(testAccount.address).toBe(customAddress);
      expect(testAccount.getAllBalances().size).toBe(3);
    });
  });
});

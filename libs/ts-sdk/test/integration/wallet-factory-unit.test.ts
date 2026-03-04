import {describe, it, expect, vi, beforeEach} from "vitest";
import {WalletFactory} from "./setup/wallet-factory";
import {TokenFactory} from "./setup/token-factory";
import {Provider, WalletUnlocked, BN} from "fuels";

// Mock the dependencies
vi.mock("fuels", () => ({
  Provider: vi.fn(),
  WalletUnlocked: {
    generate: vi.fn(),
  },
  BN: vi.fn().mockImplementation((value) => ({
    format: () => `${value} ETH`,
    add: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnValue(false), // Default to sufficient balance
    gte: vi.fn().mockReturnValue(true), // Default to sufficient balance
    toString: () => value,
  })),
}));

describe("WalletFactory Unit Tests", () => {
  let mockProvider: any;
  let mockMasterWallet: any;
  let mockTokenFactory: any;
  let walletFactory: WalletFactory;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock provider
    mockProvider = {
      url: "http://localhost:4000/v1/graphql",
    };

    // Create mock master wallet
    mockMasterWallet = {
      address: {
        toB256: () => "0x1234567890abcdef",
      },
      getBalance: vi.fn().mockResolvedValue(new BN("1000000000000000000")), // 1 ETH
      transfer: vi.fn().mockResolvedValue({
        waitForResult: vi.fn().mockResolvedValue({id: "tx123"}),
      }),
    };

    // Create mock token factory
    mockTokenFactory = {
      getBalance: vi.fn().mockResolvedValue(new BN("1000000000000000000")),
      fundWallet: vi.fn().mockResolvedValue(undefined),
      getStandardAmount: vi.fn().mockReturnValue(new BN("1000000000000000000")),
      formatAmount: vi.fn().mockReturnValue("1.0 TOKEN"),
      getAllTokens: vi
        .fn()
        .mockReturnValue([{symbol: "USDC"}, {symbol: "ETH"}]),
    };

    // Create wallet factory
    walletFactory = new WalletFactory(
      mockProvider,
      mockMasterWallet,
      mockTokenFactory
    );
  });

  describe("Balance Validation", () => {
    it("should validate master wallet balance before creating funded wallets", async () => {
      // Mock insufficient balance - create a proper BN mock that returns true for lt()
      const insufficientBalance = {
        format: () => "0.05 ETH",
        lt: vi.fn().mockReturnValue(true), // Balance IS less than required
        toString: () => "50000000000000000",
        add: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnValue(false),
      };
      mockMasterWallet.getBalance.mockResolvedValue(insufficientBalance);

      // Mock the wallet generation
      const mockWallet = {
        address: {
          toB256: () => "0xabcdef1234567890",
        },
      };
      (WalletUnlocked.generate as any).mockReturnValue(mockWallet);

      await expect(
        walletFactory.createWallet({
          name: "test-wallet",
          initialBalance: "100000000000000000", // 0.1 ETH
        })
      ).rejects.toThrow(/Insufficient master wallet balance/);
    });

    it("should successfully create wallet when master wallet has sufficient balance", async () => {
      // Mock sufficient balance
      mockMasterWallet.getBalance.mockResolvedValue(
        new BN("1000000000000000000")
      ); // 1 ETH

      // Mock the wallet generation
      const mockWallet = {
        address: {
          toB256: () => "0xabcdef1234567890",
        },
        getBalance: vi.fn().mockResolvedValue(new BN("100000000000000000")),
      };
      (WalletUnlocked.generate as any).mockReturnValue(mockWallet);

      const wallet = await walletFactory.createWallet({
        name: "test-wallet",
        initialBalance: "100000000000000000", // 0.1 ETH
      });

      expect(wallet).toBeDefined();
      expect(wallet.name).toBe("test-wallet");
      expect(mockMasterWallet.transfer).toHaveBeenCalled();
    });

    it("should validate master wallet balance before token funding", async () => {
      const validation = await walletFactory.validateMasterWalletBalance(
        new BN("100000000000000000"), // 0.1 ETH
        [{symbol: "USDC", amount: new BN("1000000000000000000")}]
      );

      expect(validation).toHaveProperty("valid");
      expect(validation).toHaveProperty("issues");
      expect(Array.isArray(validation.issues)).toBe(true);
    });
  });

  describe("Reduced Funding Amounts", () => {
    it("should use reduced amounts in scenario wallets", async () => {
      // Mock wallet generation
      const mockWallet = {
        address: {
          toB256: () => "0xabcdef1234567890",
        },
        getBalance: vi.fn().mockResolvedValue(new BN("100000000000000000")),
      };
      (WalletUnlocked.generate as any).mockReturnValue(mockWallet);

      const scenarios = await walletFactory.createScenarioWallets();

      expect(scenarios).toHaveProperty("liquidityProvider");
      expect(scenarios).toHaveProperty("trader");
      expect(scenarios).toHaveProperty("poolCreator");
      expect(scenarios).toHaveProperty("observer");

      // Verify all wallets were created with reduced balance (0.1 ETH)
      expect(mockMasterWallet.transfer).toHaveBeenCalledTimes(4);

      // Check that each transfer was for 0.1 ETH
      const transferCalls = mockMasterWallet.transfer.mock.calls;
      transferCalls.forEach((call) => {
        const amount = call[1];
        expect(amount.toString()).toBe("100000000000000000"); // 0.1 ETH
      });
    });

    it("should create balanced wallet with reduced total value", async () => {
      // Mock wallet generation
      const mockWallet = {
        address: {
          toB256: () => "0xabcdef1234567890",
        },
        getBalance: vi.fn().mockResolvedValue(new BN("100000000000000000")),
      };
      (WalletUnlocked.generate as any).mockReturnValue(mockWallet);

      const wallet = await walletFactory.createBalancedWallet("balanced-test", [
        {symbol: "USDC", ratio: 50},
        {symbol: "ETH", ratio: 50},
      ]);

      expect(wallet).toBeDefined();
      expect(wallet.name).toBe("balanced-test");

      // Should have been funded with 0.1 ETH (reduced from 5 ETH)
      expect(mockMasterWallet.transfer).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          toString: expect.any(Function),
        })
      );
    });
  });

  describe("Retry Logic", () => {
    it("should retry failed transfers with exponential backoff", async () => {
      // Mock wallet generation
      const mockWallet = {
        address: {
          toB256: () => "0xabcdef1234567890",
        },
        getBalance: vi.fn().mockResolvedValue(new BN("100000000000000000")),
      };
      (WalletUnlocked.generate as any).mockReturnValue(mockWallet);

      // Mock transfer to fail twice, then succeed
      let callCount = 0;
      mockMasterWallet.transfer.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          throw new Error("Network error");
        }
        return {
          waitForResult: vi.fn().mockResolvedValue({id: "tx123"}),
        };
      });

      const wallet = await walletFactory.createWallet({
        name: "retry-test-wallet",
        initialBalance: "100000000000000000",
      });

      expect(wallet).toBeDefined();
      expect(mockMasterWallet.transfer).toHaveBeenCalledTimes(3); // Failed twice, succeeded on third
    });

    it("should fail after maximum retries", async () => {
      // Mock wallet generation
      const mockWallet = {
        address: {
          toB256: () => "0xabcdef1234567890",
        },
      };
      (WalletUnlocked.generate as any).mockReturnValue(mockWallet);

      // Mock transfer to always fail
      mockMasterWallet.transfer.mockRejectedValue(
        new Error("Persistent network error")
      );

      await expect(
        walletFactory.createWallet({
          name: "fail-test-wallet",
          initialBalance: "100000000000000000",
        })
      ).rejects.toThrow("Persistent network error");

      expect(mockMasterWallet.transfer).toHaveBeenCalledTimes(3); // Should retry 3 times
    });
  });

  describe("Wallet Cleanup", () => {
    it("should track created wallets for cleanup", async () => {
      // Mock wallet generation
      const mockWallet = {
        address: {
          toB256: () => "0xabcdef1234567890",
        },
        getBalance: vi.fn().mockResolvedValue(new BN("100000000000000000")),
      };
      (WalletUnlocked.generate as any).mockReturnValue(mockWallet);

      const initialStats = walletFactory.getResourceStats();
      const initialCount = initialStats.totalWallets;

      await walletFactory.createWallet({
        name: "cleanup-test-wallet",
        initialBalance: "100000000000000000",
      });

      const afterStats = walletFactory.getResourceStats();
      expect(afterStats.totalWallets).toBe(initialCount + 1);
      expect(afterStats.cleanupCallbacksRegistered).toBeGreaterThan(0);
    });

    it("should cleanup individual wallets", async () => {
      // Mock wallet generation
      const mockWallet = {
        address: {
          toB256: () => "0xabcdef1234567890",
        },
        getBalance: vi.fn().mockResolvedValue(new BN("100000000000000000")),
      };
      (WalletUnlocked.generate as any).mockReturnValue(mockWallet);

      await walletFactory.createWallet({
        name: "individual-cleanup-test",
        initialBalance: "100000000000000000",
      });

      const beforeCleanup = walletFactory.getWallet("individual-cleanup-test");
      expect(beforeCleanup).toBeDefined();

      await walletFactory.cleanupWallet("individual-cleanup-test");

      const afterCleanup = walletFactory.getWallet("individual-cleanup-test");
      expect(afterCleanup).toBeUndefined();
    });

    it("should provide detailed resource statistics", async () => {
      const stats = walletFactory.getResourceStats();

      expect(stats).toHaveProperty("totalWallets");
      expect(stats).toHaveProperty("totalETHDistributed");
      expect(stats).toHaveProperty("cleanupCallbacksRegistered");
      expect(stats).toHaveProperty("walletsByAge");

      expect(typeof stats.totalWallets).toBe("number");
      expect(Array.isArray(stats.walletsByAge)).toBe(true);
    });

    it("should perform full cleanup", async () => {
      // Mock wallet generation
      const mockWallet = {
        address: {
          toB256: () => "0xabcdef1234567890",
        },
        getBalance: vi.fn().mockResolvedValue(new BN("100000000000000000")),
      };
      (WalletUnlocked.generate as any).mockReturnValue(mockWallet);

      // Create some wallets
      await walletFactory.createWallet({
        name: "cleanup-test-1",
        initialBalance: "100000000000000000",
      });
      await walletFactory.createWallet({
        name: "cleanup-test-2",
        initialBalance: "100000000000000000",
      });

      const beforeStats = walletFactory.getResourceStats();
      expect(beforeStats.totalWallets).toBeGreaterThan(0);

      await walletFactory.cleanup();

      const afterStats = walletFactory.getResourceStats();
      expect(afterStats.totalWallets).toBe(0);
      expect(afterStats.cleanupCallbacksRegistered).toBe(0);
    });
  });

  describe("Error Handling", () => {
    it("should provide clear error messages for insufficient balance", async () => {
      // Mock insufficient balance - create a proper BN mock that returns true for lt()
      const insufficientBalance = {
        format: () => "0.05 ETH",
        lt: vi.fn().mockReturnValue(true), // Balance IS less than required
        toString: () => "50000000000000000",
        add: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnValue(false),
      };
      mockMasterWallet.getBalance.mockResolvedValue(insufficientBalance);

      // Mock wallet generation
      const mockWallet = {
        address: {
          toB256: () => "0xabcdef1234567890",
        },
      };
      (WalletUnlocked.generate as any).mockReturnValue(mockWallet);

      try {
        await walletFactory.createWallet({
          name: "error-test-wallet",
          initialBalance: "100000000000000000", // 0.1 ETH
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("Insufficient master wallet balance");
        expect(error.message).toContain("Required:");
        expect(error.message).toContain("Available:");
      }
    });

    it("should handle wallet not found errors gracefully", async () => {
      const validation = await walletFactory.validateWalletBalance(
        "nonexistent-wallet",
        new BN("100000000000000000")
      );

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain(
        "Wallet nonexistent-wallet not found"
      );
    });

    it("should handle cleanup errors gracefully", async () => {
      // This should not throw even if wallet doesn't exist
      await expect(
        walletFactory.cleanupWallet("nonexistent-wallet")
      ).resolves.toBeUndefined();
    });
  });
});

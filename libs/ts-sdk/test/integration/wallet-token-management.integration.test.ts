import {describe, it, expect, beforeAll, afterAll} from "vitest";
import {defaultTestRunner} from "./setup/test-runner";
import {testEnvironment} from "./setup/test-environment";
import {
  WalletFactory,
  TokenFactory,
  TransactionUtilities,
  BalanceChecker,
} from "./setup";
import {BN} from "fuels";

describe("Wallet and Token Management Integration Tests", () => {
  let walletFactory: WalletFactory;
  let tokenFactory: TokenFactory;
  let transactionUtilities: TransactionUtilities;
  let balanceChecker: BalanceChecker;

  beforeAll(async () => {
    console.log("🧪 Starting wallet and token management integration tests...");
    await defaultTestRunner.setup();

    // Create isolated environment with all utilities
    const env = await defaultTestRunner.createIsolatedEnvironment();
    walletFactory = env.walletFactory;
    tokenFactory = env.tokenFactory;
    transactionUtilities = env.transactionUtilities;
    balanceChecker = env.balanceChecker;
  }, 120000);

  afterAll(async () => {
    await defaultTestRunner.teardown();
  });

  describe("WalletFactory Tests", () => {
    it("should create a basic wallet with ETH funding", async () => {
      await defaultTestRunner.runTest("create-basic-wallet", async () => {
        const wallet = await walletFactory.createWallet({
          name: "basic-test-wallet",
          initialBalance: "5000000000000000000", // 5 ETH
          description: "Basic wallet for testing",
        });

        expect(wallet.name).toBe("basic-test-wallet");
        expect(wallet.address).toBeDefined();
        expect(wallet.wallet).toBeDefined();

        // Check balance
        const balance = await wallet.getBalance();
        expect(balance.gt(new BN("4000000000000000000"))).toBe(true); // At least 4 ETH (accounting for gas)

        console.log(
          `✅ Created wallet: ${wallet.name} with balance ${balance.format()}`
        );
      });
    });

    it("should create a wallet with token funding", async () => {
      await defaultTestRunner.runTest("create-wallet-with-tokens", async () => {
        const wallet = await walletFactory.createWallet({
          name: "token-funded-wallet",
          initialBalance: "2000000000000000000", // 2 ETH
          tokens: [
            {
              symbol: "USDC",
              amount: tokenFactory.getStandardAmount("USDC", 1000),
            }, // 1000 USDC
            {symbol: "ETH", amount: tokenFactory.getStandardAmount("ETH", 1)}, // 1 ETH token
          ],
        });

        expect(wallet.name).toBe("token-funded-wallet");

        // Check token balances
        const usdcBalance = await wallet.getTokenBalance("USDC");
        const ethTokenBalance = await wallet.getTokenBalance("ETH");

        expect(usdcBalance.gt(0)).toBe(true);
        expect(ethTokenBalance.gt(0)).toBe(true);

        console.log(
          `✅ Wallet funded with USDC: ${tokenFactory.formatAmount("USDC", usdcBalance)}`
        );
        console.log(
          `✅ Wallet funded with ETH tokens: ${tokenFactory.formatAmount("ETH", ethTokenBalance)}`
        );
      });
    });

    it("should create scenario-specific wallets", async () => {
      await defaultTestRunner.runTest("create-scenario-wallets", async () => {
        const scenarioWallets = await walletFactory.createScenarioWallets();

        expect(scenarioWallets.liquidityProvider).toBeDefined();
        expect(scenarioWallets.trader).toBeDefined();
        expect(scenarioWallets.poolCreator).toBeDefined();
        expect(scenarioWallets.observer).toBeDefined();

        // Verify liquidity provider has substantial balances
        const lpBalance = await scenarioWallets.liquidityProvider.getBalance();
        expect(lpBalance.gt(new BN("40000000000000000000"))).toBe(true); // At least 40 ETH

        const lpUsdcBalance =
          await scenarioWallets.liquidityProvider.getTokenBalance("USDC");
        expect(lpUsdcBalance.gt(0)).toBe(true);

        console.log(`✅ Liquidity provider balance: ${lpBalance.format()}`);
        console.log(
          `✅ Liquidity provider USDC: ${tokenFactory.formatAmount("USDC", lpUsdcBalance)}`
        );
      });
    });

    it("should create multiple wallets with same configuration", async () => {
      await defaultTestRunner.runTest("create-multiple-wallets", async () => {
        const wallets = await walletFactory.createWallets(3, {
          name: "batch-wallet",
          initialBalance: "1000000000000000000", // 1 ETH
          tokens: [
            {
              symbol: "USDC",
              amount: tokenFactory.getStandardAmount("USDC", 100),
            }, // 100 USDC
          ],
        });

        expect(wallets.length).toBe(3);
        expect(wallets[0].name).toBe("batch-wallet-1");
        expect(wallets[1].name).toBe("batch-wallet-2");
        expect(wallets[2].name).toBe("batch-wallet-3");

        // Verify all wallets have balances
        for (const wallet of wallets) {
          const balance = await wallet.getBalance();
          const usdcBalance = await wallet.getTokenBalance("USDC");

          expect(balance.gt(0)).toBe(true);
          expect(usdcBalance.gt(0)).toBe(true);
        }

        console.log(
          `✅ Created ${wallets.length} wallets with consistent configuration`
        );
      });
    });

    it("should validate wallet balances", async () => {
      await defaultTestRunner.runTest("validate-wallet-balances", async () => {
        const wallet = await walletFactory.createWallet({
          name: "validation-wallet",
          initialBalance: "3000000000000000000", // 3 ETH
          tokens: [
            {
              symbol: "USDC",
              amount: tokenFactory.getStandardAmount("USDC", 500),
            }, // 500 USDC
          ],
        });

        // Test sufficient balance validation
        const sufficientValidation = await walletFactory.validateWalletBalance(
          wallet.name,
          new BN("1000000000000000000"), // 1 ETH
          [
            {
              symbol: "USDC",
              amount: tokenFactory.getStandardAmount("USDC", 100),
            },
          ] // 100 USDC
        );

        expect(sufficientValidation.valid).toBe(true);
        expect(sufficientValidation.issues.length).toBe(0);

        // Test insufficient balance validation
        const insufficientValidation =
          await walletFactory.validateWalletBalance(
            wallet.name,
            new BN("10000000000000000000"), // 10 ETH (more than available)
            [
              {
                symbol: "USDC",
                amount: tokenFactory.getStandardAmount("USDC", 1000),
              },
            ] // 1000 USDC (more than available)
          );

        expect(insufficientValidation.valid).toBe(false);
        expect(insufficientValidation.issues.length).toBeGreaterThan(0);

        console.log(`✅ Wallet validation working correctly`);
        console.log(
          `📊 Insufficient balance issues: ${insufficientValidation.issues.length}`
        );
      });
    });
  });

  describe("Enhanced TokenFactory Tests", () => {
    it("should get detailed balance information", async () => {
      await defaultTestRunner.runTest("get-balance-details", async () => {
        const wallet = await walletFactory.createWallet({
          name: "balance-details-wallet",
          tokens: [
            {
              symbol: "USDC",
              amount: tokenFactory.getStandardAmount("USDC", 1500),
            }, // 1500 USDC
          ],
        });

        const balanceDetails = await tokenFactory.getBalanceDetails(
          wallet.address,
          "USDC"
        );

        expect(balanceDetails.raw).toBeDefined();
        expect(balanceDetails.formatted).toBeDefined();
        expect(balanceDetails.units).toBeGreaterThan(1400); // Should be around 1500
        expect(balanceDetails.token).toBeDefined();
        expect(balanceDetails.token.symbol).toBe("USDC");

        console.log(
          `✅ Balance details: ${balanceDetails.formatted} (${balanceDetails.units} units)`
        );
      });
    });

    it("should check sufficient balance", async () => {
      await defaultTestRunner.runTest("check-sufficient-balance", async () => {
        const wallet = await walletFactory.createWallet({
          name: "sufficient-balance-wallet",
          tokens: [
            {
              symbol: "FUEL",
              amount: tokenFactory.getStandardAmount("FUEL", 5000),
            }, // 5000 FUEL
          ],
        });

        const hasSufficient = await tokenFactory.hasSufficientBalance(
          wallet.address,
          "FUEL",
          tokenFactory.getStandardAmount("FUEL", 1000) // Check for 1000 FUEL
        );

        const hasInsufficient = await tokenFactory.hasSufficientBalance(
          wallet.address,
          "FUEL",
          tokenFactory.getStandardAmount("FUEL", 10000) // Check for 10000 FUEL
        );

        expect(hasSufficient).toBe(true);
        expect(hasInsufficient).toBe(false);

        console.log(`✅ Sufficient balance check: ${hasSufficient}`);
        console.log(`✅ Insufficient balance check: ${hasInsufficient}`);
      });
    });

    it("should get all token balances for a wallet", async () => {
      await defaultTestRunner.runTest("get-all-balances", async () => {
        const wallet = await walletFactory.createWallet({
          name: "multi-token-wallet",
          tokens: [
            {
              symbol: "USDC",
              amount: tokenFactory.getStandardAmount("USDC", 1000),
            },
            {
              symbol: "USDT",
              amount: tokenFactory.getStandardAmount("USDT", 500),
            },
            {symbol: "ETH", amount: tokenFactory.getStandardAmount("ETH", 2)},
          ],
        });

        const allBalances = await tokenFactory.getAllBalances(wallet.address);

        expect(allBalances.length).toBeGreaterThan(0);

        const usdcBalance = allBalances.find((b) => b.symbol === "USDC");
        const usdtBalance = allBalances.find((b) => b.symbol === "USDT");
        const ethBalance = allBalances.find((b) => b.symbol === "ETH");

        expect(usdcBalance).toBeDefined();
        expect(usdtBalance).toBeDefined();
        expect(ethBalance).toBeDefined();

        console.log(`✅ Found ${allBalances.length} token balances:`);
        allBalances.forEach((balance) => {
          console.log(`  - ${balance.formatted}`);
        });
      });
    });

    it("should generate scenario amounts", async () => {
      await defaultTestRunner.runTest("generate-scenario-amounts", async () => {
        const smallAmounts = tokenFactory.getScenarioAmounts("small");
        const mediumAmounts = tokenFactory.getScenarioAmounts("medium");
        const largeAmounts = tokenFactory.getScenarioAmounts("large");
        const whaleAmounts = tokenFactory.getScenarioAmounts("whale");

        expect(Object.keys(smallAmounts).length).toBeGreaterThan(0);
        expect(Object.keys(mediumAmounts).length).toBeGreaterThan(0);
        expect(Object.keys(largeAmounts).length).toBeGreaterThan(0);
        expect(Object.keys(whaleAmounts).length).toBeGreaterThan(0);

        // Verify amounts increase with scenario size
        if (smallAmounts.USDC && mediumAmounts.USDC) {
          expect(mediumAmounts.USDC.gt(smallAmounts.USDC)).toBe(true);
        }

        console.log(
          `✅ Generated scenario amounts for ${Object.keys(smallAmounts).length} tokens`
        );
        console.log(
          `📊 Small USDC: ${smallAmounts.USDC ? tokenFactory.formatAmount("USDC", smallAmounts.USDC) : "N/A"}`
        );
        console.log(
          `📊 Whale USDC: ${whaleAmounts.USDC ? tokenFactory.formatAmount("USDC", whaleAmounts.USDC) : "N/A"}`
        );
      });
    });

    it("should validate token configurations", async () => {
      await defaultTestRunner.runTest("validate-token-configs", async () => {
        const tokens = tokenFactory.getAllTokens();
        expect(tokens.length).toBeGreaterThan(0);

        let validCount = 0;
        let invalidCount = 0;

        for (const token of tokens) {
          const validation = tokenFactory.validateTokenConfig(token.symbol);

          if (validation.valid) {
            validCount++;
          } else {
            invalidCount++;
            console.warn(
              `⚠️ Invalid token config for ${token.symbol}:`,
              validation.issues
            );
          }
        }

        expect(validCount).toBeGreaterThan(0);

        console.log(
          `✅ Token validation: ${validCount} valid, ${invalidCount} invalid`
        );
      });
    });
  });

  describe("BalanceChecker Tests", () => {
    it("should get comprehensive wallet balance", async () => {
      await defaultTestRunner.runTest("get-wallet-balance", async () => {
        const wallet = await walletFactory.createWallet({
          name: "balance-check-wallet",
          initialBalance: "3000000000000000000", // 3 ETH
          tokens: [
            {
              symbol: "USDC",
              amount: tokenFactory.getStandardAmount("USDC", 2000),
            },
            {
              symbol: "FUEL",
              amount: tokenFactory.getStandardAmount("FUEL", 10000),
            },
          ],
        });

        const walletBalance = await balanceChecker.getWalletBalance(
          wallet.address
        );

        expect(walletBalance.address).toBe(wallet.address);
        expect(walletBalance.nativeBalance.gt(0)).toBe(true);
        expect(walletBalance.tokenBalances.length).toBeGreaterThan(0);
        expect(walletBalance.totalAssets).toBeGreaterThan(0);

        // Should include native ETH and tokens
        const nativeBalance = walletBalance.tokenBalances.find(
          (b) => b.isNative
        );
        const usdcBalance = walletBalance.tokenBalances.find(
          (b) => b.symbol === "USDC"
        );
        const fuelBalance = walletBalance.tokenBalances.find(
          (b) => b.symbol === "FUEL"
        );

        expect(nativeBalance).toBeDefined();
        expect(usdcBalance).toBeDefined();
        expect(fuelBalance).toBeDefined();

        console.log(`✅ Wallet balance check completed`);
        console.log(`📊 Total assets: ${walletBalance.totalAssets}`);
        console.log(
          `📊 Native balance: ${walletBalance.nativeBalance.format()}`
        );
      });
    });

    it("should compare balances between operations", async () => {
      await defaultTestRunner.runTest("compare-balances", async () => {
        const wallet = await walletFactory.createWallet({
          name: "balance-comparison-wallet",
          initialBalance: "2000000000000000000", // 2 ETH
          tokens: [
            {
              symbol: "USDC",
              amount: tokenFactory.getStandardAmount("USDC", 1000),
            },
          ],
        });

        // Get initial balance
        const initialBalance = await balanceChecker.getWalletBalance(
          wallet.address
        );

        // Add more tokens
        await wallet.fundWithTokens([
          {symbol: "USDC", amount: tokenFactory.getStandardAmount("USDC", 500)}, // Add 500 more USDC
        ]);

        // Compare balances
        const comparisons = await balanceChecker.compareBalances(
          wallet.address,
          initialBalance
        );

        expect(comparisons.length).toBeGreaterThan(0);

        const usdcComparison = comparisons.find((c) => c.symbol === "USDC");
        expect(usdcComparison).toBeDefined();
        expect(usdcComparison!.change.gt(0)).toBe(true); // Should be positive change

        console.log(`✅ Balance comparison completed`);
        console.log(`📊 Changes detected: ${comparisons.length}`);
        comparisons.forEach((comp) => {
          console.log(`  ${comp.symbol}: ${comp.changeFormatted}`);
        });
      });
    });

    it("should check balance thresholds", async () => {
      await defaultTestRunner.runTest("check-balance-thresholds", async () => {
        // Create wallet with low balances to trigger threshold alerts
        const wallet = await walletFactory.createWallet({
          name: "threshold-test-wallet",
          initialBalance: "500000000000000000", // 0.5 ETH (below warning threshold)
          tokens: [
            {symbol: "USDC", amount: tokenFactory.getStandardAmount("USDC", 5)}, // 5 USDC (below minimum threshold)
          ],
        });

        const walletBalance = await balanceChecker.getWalletBalance(
          wallet.address
        );
        const thresholdCheck = balanceChecker.checkThresholds(walletBalance);

        expect(thresholdCheck.address).toBe(wallet.address);
        expect(thresholdCheck.alerts.length).toBeGreaterThan(0); // Should have alerts for low balances

        const usdcAlert = thresholdCheck.alerts.find(
          (a) => a.symbol === "USDC"
        );
        expect(usdcAlert).toBeDefined();
        expect(usdcAlert!.level).toBe("minimum"); // Should be below minimum threshold

        console.log(`✅ Threshold check completed`);
        console.log(`⚠️ Alerts generated: ${thresholdCheck.alerts.length}`);
        thresholdCheck.alerts.forEach((alert) => {
          console.log(`  ${alert.level.toUpperCase()}: ${alert.message}`);
        });
      });
    });

    it("should generate balance report", async () => {
      await defaultTestRunner.runTest("generate-balance-report", async () => {
        // Create multiple wallets with different balances
        const wallets = await walletFactory.createWallets(3, {
          name: "report-wallet",
          initialBalance: "1000000000000000000", // 1 ETH
          tokens: [
            {
              symbol: "USDC",
              amount: tokenFactory.getStandardAmount("USDC", 500),
            },
            {
              symbol: "FUEL",
              amount: tokenFactory.getStandardAmount("FUEL", 2000),
            },
          ],
        });

        // Get balances for all wallets
        const balances = await balanceChecker.getMultipleWalletBalances(
          wallets.map((w) => w.address)
        );

        const report = balanceChecker.generateBalanceReport(balances);

        expect(report.totalWallets).toBe(3);
        expect(report.totalAssets).toBeGreaterThan(0);
        expect(report.assetDistribution).toBeDefined();
        expect(report.summary).toBeDefined();

        console.log(`✅ Balance report generated`);
        console.log(report.summary);
      });
    });
  });

  describe("Integration Tests", () => {
    it("should perform end-to-end wallet and token operations", async () => {
      await defaultTestRunner.runTest("end-to-end-operations", async () => {
        // Create scenario wallets
        const scenarioWallets = await walletFactory.createScenarioWallets();

        // Get initial balances
        const initialBalances = await balanceChecker.getMultipleWalletBalances([
          scenarioWallets.liquidityProvider.address,
          scenarioWallets.trader.address,
        ]);

        expect(initialBalances.length).toBe(2);

        // Perform token operations
        await scenarioWallets.trader.fundWithTokens([
          {
            symbol: "USDT",
            amount: tokenFactory.getStandardAmount("USDT", 1000),
          },
        ]);

        // Check balance changes
        const traderComparisons = await balanceChecker.compareBalances(
          scenarioWallets.trader.address,
          initialBalances.find(
            (b) => b.address === scenarioWallets.trader.address
          )
        );

        expect(traderComparisons.length).toBeGreaterThan(0);

        const usdtChange = traderComparisons.find((c) => c.symbol === "USDT");
        expect(usdtChange).toBeDefined();
        expect(usdtChange!.change.gt(0)).toBe(true);

        // Generate final report
        const finalBalances = await balanceChecker.getMultipleWalletBalances([
          scenarioWallets.liquidityProvider.address,
          scenarioWallets.trader.address,
          scenarioWallets.poolCreator.address,
          scenarioWallets.observer.address,
        ]);

        const report = balanceChecker.generateBalanceReport(finalBalances);

        console.log(`✅ End-to-end operations completed`);
        console.log(
          `📊 Final report: ${report.totalWallets} wallets, ${report.totalAssets} asset types`
        );
        console.log(`📊 Threshold violations: ${report.thresholdViolations}`);
      });
    });

    it("should validate all utilities work together", async () => {
      await defaultTestRunner.runTest("utilities-integration", async () => {
        // Test that all utilities are properly initialized and working
        expect(walletFactory).toBeDefined();
        expect(tokenFactory).toBeDefined();
        expect(transactionUtilities).toBeDefined();
        expect(balanceChecker).toBeDefined();

        // Test wallet factory stats
        const walletStats = walletFactory.getWalletStats();
        expect(walletStats.totalWallets).toBeGreaterThan(0);

        // Test token factory stats
        const tokenStats = tokenFactory.getTokenStats();
        expect(tokenStats.totalTokens).toBeGreaterThan(0);
        expect(tokenStats.validTokens).toBeGreaterThan(0);

        // Test transaction utilities config
        const txConfig = transactionUtilities.getDefaultConfig();
        expect(txConfig.timeout).toBeDefined();
        expect(txConfig.retries).toBeDefined();

        console.log(`✅ All utilities integration validated`);
        console.log(`📊 Wallets created: ${walletStats.totalWallets}`);
        console.log(
          `📊 Tokens available: ${tokenStats.totalTokens} (${tokenStats.validTokens} valid)`
        );
        console.log(`📊 Transaction timeout: ${txConfig.timeout}ms`);
      });
    });
  });
});

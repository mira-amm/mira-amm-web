import {describe, it, expect, beforeAll, afterAll} from "vitest";
import {testEnvironment, defaultTestRunner} from "./setup";
import {TokenFactory} from "./setup/token-factory";

describe("Simple Integration Test Setup (Enhanced)", () => {
  let tokenFactory: TokenFactory;

  beforeAll(async () => {
    console.log(
      "🧪 Starting simple integration test with enhanced infrastructure..."
    );

    // Use enhanced test runner for setup
    await defaultTestRunner.setup();

    // Create a unique wallet for this test to avoid UTXO conflicts
    const wallet = await testEnvironment.createWallet("100000000000"); // 100,000 ETH for testing
    const contractIds = testEnvironment.getContractIds();

    console.log("📋 Contract IDs:", contractIds);
    console.log("💰 Wallet address:", wallet.address.toB256());

    // Initialize token factory
    tokenFactory = new TokenFactory(wallet, contractIds.fungible);
  }, 120000); // Increased timeout for enhanced setup

  afterAll(async () => {
    await defaultTestRunner.teardown();
  });

  it("should connect to test environment services", async () => {
    const config = testEnvironment.getConfig();

    // Test node connection
    const nodeResponse = await fetch(config.fuelNode.url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({query: "{ __typename }"}),
    });

    expect(nodeResponse.ok).toBe(true);
    console.log("✅ Node connection successful");

    // Test indexer connection (optional)
    try {
      const indexerResponse = await fetch(config.indexer.url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({query: "{ __typename }"}),
      });

      if (indexerResponse.ok) {
        console.log("✅ Indexer connection successful");
      } else {
        console.log("⚠️ Indexer connection failed, but continuing tests");
      }
    } catch (error) {
      console.log("⚠️ Indexer not available, but continuing tests");
    }
  });

  it("should have a funded wallet", async () => {
    const wallet = testEnvironment.getWallet();
    const balance = await wallet.getBalance();

    console.log(`💰 Wallet balance: ${balance.format()}`);
    expect(balance.gt(0)).toBe(true);
  });

  it("should load test tokens", () => {
    const tokens = tokenFactory.getAllTokens();

    console.log("📦 Available test tokens:");
    tokens.forEach((token) => {
      console.log(
        `  - ${token.symbol} (${token.name}): ${token.assetId.slice(0, 10)}...`
      );
    });

    expect(tokens.length).toBeGreaterThan(0);

    // Check for key tokens
    const usdc = tokenFactory.getToken("USDC");
    const fuel = tokenFactory.getToken("FUEL");
    const eth = tokenFactory.getToken("ETH");

    expect(usdc).toBeDefined();
    expect(fuel).toBeDefined();
    expect(eth).toBeDefined();

    console.log("✅ Key test tokens available");
  });

  it("should be able to mint test tokens", async () => {
    const wallet = testEnvironment.getWallet();
    const usdc = tokenFactory.getToken("USDC");

    if (!usdc) {
      throw new Error("USDC token not available");
    }

    const initialBalance = await tokenFactory.getBalance(
      wallet.address.toB256(),
      "USDC"
    );
    console.log(
      `💰 Initial USDC balance: ${tokenFactory.formatAmount("USDC", initialBalance)}`
    );

    // Mint some USDC
    const mintAmount = tokenFactory.getStandardAmount("USDC", 1000); // 1000 USDC
    await tokenFactory.mintTokens("USDC", wallet.address.toB256(), mintAmount);

    const newBalance = await tokenFactory.getBalance(
      wallet.address.toB256(),
      "USDC"
    );
    console.log(
      `💰 New USDC balance: ${tokenFactory.formatAmount("USDC", newBalance)}`
    );

    expect(newBalance.gt(initialBalance)).toBe(true);
    console.log("✅ Token minting successful");
  }, 30000);

  it("should have valid contract IDs", () => {
    const contractIds = testEnvironment.getContractIds();

    expect(contractIds.basicHook).toBeDefined();
    expect(contractIds.poolCurveState).toBeDefined();
    expect(contractIds.simpleProxy).toBeDefined();
    expect(contractIds.fungible).toBeDefined();

    // Contract IDs should be valid hex strings
    expect(contractIds.basicHook).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(contractIds.poolCurveState).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(contractIds.simpleProxy).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(contractIds.fungible).toMatch(/^0x[a-fA-F0-9]{64}$/);

    console.log("✅ All contract IDs are valid");
  });
});

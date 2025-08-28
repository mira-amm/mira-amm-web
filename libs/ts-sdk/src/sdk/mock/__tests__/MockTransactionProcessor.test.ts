import {BN, AssetId} from "fuels";
import {vi, describe, it, expect, beforeEach} from "vitest";
import {MockTransactionProcessor} from "../MockTransactionProcessor";
import {MockErrorSimulator} from "../MockErrorSimulator";
import {MockLiquidityCalculator} from "../MockLiquidityCalculator";
import {MockStateManager} from "../MockStateManager";
import {MockAccount} from "../MockAccount";
import {DEFAULT_MOCK_CONFIG, MockPoolState, MockSDKConfig} from "../types";
import {PoolIdV2} from "../../model";

describe("MockTransactionProcessor", () => {
  let stateManager: MockStateManager;
  let processor: MockTransactionProcessor;
  let account: MockAccount;
  let poolId: PoolIdV2;
  let assetA: AssetId;
  let assetB: AssetId;

  beforeEach(() => {
    const config: MockSDKConfig = {
      ...DEFAULT_MOCK_CONFIG,
      defaultFailureRate: 0, // Disable failures for most tests
    };

    stateManager = new MockStateManager(config);
    processor = new MockTransactionProcessor(config, stateManager);
    account = MockAccount.createWithTestBalances();

    assetA = {
      bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };
    assetB = {
      bits: "0x0000000000000000000000000000000000000000000000000000000000000001",
    };

    poolId = {
      assetA,
      assetB,
      binStep: 25,
    };

    // Create a test pool
    const poolState: MockPoolState = {
      poolId: "test-pool",
      metadata: {
        assetA,
        assetB,
        binStep: 25,
        baseFactor: new BN(5000),
        filterPeriod: new BN(30),
        decayPeriod: new BN(600),
        reductionFactor: new BN(5000),
        variableFeeControl: new BN(40000),
        protocolShare: new BN(1000),
        maxVolatilityAccumulator: new BN(350000),
        isOpen: true,
      },
      bins: new Map(),
      activeBinId: 8388608,
      totalReserves: {assetA: new BN(1000000), assetB: new BN(2000000)},
      protocolFees: {assetA: new BN(10), assetB: new BN(20)},
      volume24h: new BN(50000),
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    stateManager.setPool("test-pool", poolState);
  });

  it("should create instance without errors", () => {
    expect(processor).toBeDefined();
    expect(processor.getErrorSimulator()).toBeInstanceOf(MockErrorSimulator);
  });

  it("should provide access to liquidity calculator", () => {
    const calculator = MockTransactionProcessor.getLiquidityCalculator();
    expect(calculator).toBe(MockLiquidityCalculator);
  });

  describe("Add Liquidity Processing", () => {
    it("should process add liquidity successfully", async () => {
      const params = {
        poolId: "test-pool",
        amountADesired: new BN("1000000"),
        amountBDesired: new BN("2000000"),
        amountAMin: new BN("950000"),
        amountBMin: new BN("1900000"),
        deadline: new BN(Date.now() + 20 * 60 * 1000),
        activeIdDesired: 8388608,
      };

      const result = await processor.processAddLiquidity(
        params,
        account.address
      );

      expect(result.result?.success).toBe(true);
      expect(result.result?.transactionId).toBeDefined();
      expect(result.result?.gasUsed.gt(0)).toBe(true);
      expect(result.result?.events.length).toBeGreaterThan(0);
    });

    it("should fail with insufficient balance", async () => {
      const params = {
        poolId: "test-pool",
        amountADesired: new BN("10000000000000000000"), // Excessive amount
        amountBDesired: new BN("2000000"),
        amountAMin: new BN("950000"),
        amountBMin: new BN("1900000"),
        deadline: new BN(Date.now() + 20 * 60 * 1000),
        activeIdDesired: 8388608,
      };

      await expect(
        processor.processAddLiquidity(params, account.address)
      ).rejects.toThrow("Insufficient balance");
    });

    it("should fail with expired deadline", async () => {
      const params = {
        poolId: "test-pool",
        amountADesired: new BN("1000000"),
        amountBDesired: new BN("2000000"),
        amountAMin: new BN("950000"),
        amountBMin: new BN("1900000"),
        deadline: new BN(Date.now() - 60 * 1000), // Past deadline
        activeIdDesired: 8388608,
      };

      await expect(
        processor.processAddLiquidity(params, account.address)
      ).rejects.toThrow("Deadline exceeded");
    });

    it("should fail with slippage exceeded", async () => {
      const params = {
        poolId: "test-pool",
        amountADesired: new BN("1000000"),
        amountBDesired: new BN("2000000"),
        amountAMin: new BN("1100000"), // Higher than desired
        amountBMin: new BN("1900000"),
        deadline: new BN(Date.now() + 20 * 60 * 1000),
        activeIdDesired: 8388608,
      };

      await expect(
        processor.processAddLiquidity(params, account.address)
      ).rejects.toThrow("Slippage exceeded");
    });
  });

  describe("Remove Liquidity Processing", () => {
    beforeEach(async () => {
      // Add liquidity first
      const addParams = {
        poolId: "test-pool",
        amountADesired: new BN("1000000"),
        amountBDesired: new BN("2000000"),
        amountAMin: new BN("950000"),
        amountBMin: new BN("1900000"),
        deadline: new BN(Date.now() + 20 * 60 * 1000),
        activeIdDesired: 8388608,
      };
      await processor.processAddLiquidity(addParams, account.address);
    });

    it("should process remove liquidity successfully", async () => {
      const params = {
        poolId: "test-pool",
        binIds: [8388608],
        amountAMin: new BN("100000"),
        amountBMin: new BN("200000"),
        deadline: new BN(Date.now() + 20 * 60 * 1000),
      };

      const result = await processor.processRemoveLiquidity(
        params,
        account.address
      );

      expect(result.result?.success).toBe(true);
      expect(result.result?.transactionId).toBeDefined();
      expect(result.result?.gasUsed.gt(0)).toBe(true);
    });

    it("should fail with no position", async () => {
      const newAccount = new MockAccount("0xnewuser", new Map());
      const params = {
        poolId: "test-pool",
        binIds: [8388608],
        amountAMin: new BN("100000"),
        amountBMin: new BN("200000"),
        deadline: new BN(Date.now() + 20 * 60 * 1000),
      };

      await expect(
        processor.processRemoveLiquidity(params, newAccount.address)
      ).rejects.toThrow("No position found");
    });
  });

  describe("Swap Processing", () => {
    it("should process swap exact input successfully", async () => {
      const params = {
        amountIn: new BN("100000"),
        assetIn: assetA,
        amountOutMin: new BN("90000"),
        pools: ["test-pool"],
        deadline: new BN(Date.now() + 20 * 60 * 1000),
      };

      const result = await processor.processSwap(params, account.address);

      expect(result.result?.success).toBe(true);
      expect(result.result?.transactionId).toBeDefined();
      expect(result.result?.gasUsed.gt(0)).toBe(true);
    });

    it("should fail with insufficient liquidity", async () => {
      const params = {
        amountIn: new BN("10000000000"), // Excessive amount
        assetIn: assetA,
        amountOutMin: new BN("90000"),
        pools: ["test-pool"],
        deadline: new BN(Date.now() + 20 * 60 * 1000),
      };

      await expect(
        processor.processSwap(params, account.address)
      ).rejects.toThrow("Insufficient liquidity");
    });
  });

  describe("Create Pool Processing", () => {
    it("should process create pool successfully", async () => {
      const params = {
        pool: {
          assetA: {
            bits: "0x1111111111111111111111111111111111111111111111111111111111111111",
          },
          assetB: {
            bits: "0x2222222222222222222222222222222222222222222222222222222222222222",
          },
          binStep: 50,
          baseFactor: 5000,
        },
        activeId: 8388608,
      };

      const result = await processor.processCreatePool(params, account.address);

      expect(result.result?.success).toBe(true);
      expect(result.result?.transactionId).toBeDefined();
      expect(result.result?.gasUsed.gt(0)).toBe(true);

      // Verify pool was created
      const pools = stateManager.getAllPools();
      const newPool = pools.find(
        (p) => p.metadata.assetA.bits === params.pool.assetA.bits
      );
      expect(newPool).toBeDefined();
    });

    it("should fail if pool already exists", async () => {
      const params = {
        pool: {
          assetA,
          assetB,
          binStep: 25,
          baseFactor: 5000,
        },
        activeId: 8388608,
      };

      await expect(
        processor.processCreatePool(params, account.address)
      ).rejects.toThrow("Pool already exists");
    });
  });

  describe("Gas Estimation", () => {
    it("should include realistic gas usage in transaction results", async () => {
      const params = {
        poolId: "test-pool",
        amountADesired: new BN("1000000"),
        amountBDesired: new BN("2000000"),
        amountAMin: new BN("950000"),
        amountBMin: new BN("1900000"),
        deadline: new BN(Date.now() + 20 * 60 * 1000),
        activeIdDesired: 8388608,
      };

      const result = await processor.processAddLiquidity(
        params,
        account.address
      );

      expect(result.result?.gasUsed.gt(0)).toBe(true);
      expect(result.result?.gasUsed.lt(new BN("1000000"))).toBe(true); // Reasonable upper bound
      expect(result.gasPrice.gt(0)).toBe(true);
    });

    it("should vary gas usage by operation complexity", async () => {
      // Create pool (most expensive)
      const createParams = {
        pool: {
          assetA: {
            bits: "0x1111111111111111111111111111111111111111111111111111111111111111",
          },
          assetB: {
            bits: "0x2222222222222222222222222222222222222222222222222222222222222222",
          },
          binStep: 50,
          baseFactor: 5000,
        },
        activeId: 8388608,
      };
      const createResult = await processor.processCreatePool(
        createParams,
        account.address
      );

      // Add liquidity (medium)
      const addParams = {
        poolId: "test-pool",
        amountADesired: new BN("1000000"),
        amountBDesired: new BN("2000000"),
        amountAMin: new BN("950000"),
        amountBMin: new BN("1900000"),
        deadline: new BN(Date.now() + 20 * 60 * 1000),
        activeIdDesired: 8388608,
      };
      const addResult = await processor.processAddLiquidity(
        addParams,
        account.address
      );

      // Swap (least expensive)
      const swapParams = {
        amountIn: new BN("100000"),
        assetIn: assetA,
        amountOutMin: new BN("90000"),
        pools: ["test-pool"],
        deadline: new BN(Date.now() + 20 * 60 * 1000),
      };
      const swapResult = await processor.processSwap(
        swapParams,
        account.address
      );

      // Create pool should use most gas
      expect(
        createResult.result?.gasUsed.gt(addResult.result?.gasUsed || new BN(0))
      ).toBe(true);
      expect(
        addResult.result?.gasUsed.gt(swapResult.result?.gasUsed || new BN(0))
      ).toBe(true);
    });
  });

  describe("Latency Simulation", () => {
    it("should simulate realistic latency", async () => {
      const config: MockSDKConfig = {
        ...DEFAULT_MOCK_CONFIG,
        defaultLatencyMs: 100,
      };
      const latencyProcessor = new MockTransactionProcessor(
        config,
        stateManager
      );

      const startTime = Date.now();

      const params = {
        poolId: "test-pool",
        amountADesired: new BN("1000000"),
        amountBDesired: new BN("2000000"),
        amountAMin: new BN("950000"),
        amountBMin: new BN("1900000"),
        deadline: new BN(Date.now() + 20 * 60 * 1000),
        activeIdDesired: 8388608,
      };

      await latencyProcessor.processAddLiquidity(params, account.address);

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(50); // Should have some delay
    });
  });
});

describe("MockErrorSimulator", () => {
  it("should create instance and configure error rates", () => {
    const simulator = new MockErrorSimulator(DEFAULT_MOCK_CONFIG);

    simulator.setErrorRate("addLiquidity", 0.1);
    const config = simulator.getErrorConfig("addLiquidity");

    expect(config?.failureRate).toBe(0.1);
  });

  it("should provide predefined scenarios", () => {
    const scenarios = MockErrorSimulator.getPredefinedScenarios();
    expect(scenarios.length).toBeGreaterThan(0);
    expect(scenarios[0]).toHaveProperty("name");
    expect(scenarios[0]).toHaveProperty("operations");
  });
});

describe("MockLiquidityCalculator", () => {
  it("should calculate bin prices correctly", () => {
    const binId = 0;
    const binStep = 25; // 0.25%

    const price = MockLiquidityCalculator.getBinPrice(binId, binStep);
    expect(price.toString()).toBe(new BN(10).pow(18).toString()); // Should be 1.0 scaled
  });

  it("should calculate price bin ID correctly", () => {
    const price = new BN(10).pow(18); // 1.0 scaled
    const binStep = 25;

    const binId = MockLiquidityCalculator.getPriceBinId(price, binStep);
    expect(binId).toBe(0);
  });

  it("should distribute liquidity across bins", () => {
    const totalAmountX = new BN("1000000");
    const totalAmountY = new BN("2000000");
    const config = {
      centerBinId: 0,
      binCount: 5,
      strategy: "uniform" as const,
    };
    const binStep = 25;

    const bins = MockLiquidityCalculator.distributeLiquidity(
      totalAmountX,
      totalAmountY,
      config,
      binStep
    );

    expect(bins).toHaveLength(5);
    expect(bins[2].isActive).toBe(true); // Center bin should be active
  });
});

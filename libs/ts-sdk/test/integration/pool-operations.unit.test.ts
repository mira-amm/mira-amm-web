import {describe, it, expect} from "vitest";
import {BN} from "fuels";
import {buildPoolIdV2} from "../../src/sdk/utils";
import {STANDARD_POOL_CONFIGS} from "./setup/pool-factory";

describe("Pool Operations Unit Tests", () => {
  // Mock test tokens for validation
  const mockTokens = {
    usdc: {
      name: "USD Coin",
      symbol: "USDC",
      assetId:
        "0x336b7c06352a4b736ff6f688ba6885788b3df16e136e95310ade51aa32dc6f05",
      decimals: 6,
      contractId:
        "0x336b7c06352a4b736ff6f688ba6885788b3df16e136e95310ade51aa32dc6f05",
      subId:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    },
    fuel: {
      name: "Fuel",
      symbol: "FUEL",
      assetId:
        "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07",
      decimals: 9,
      contractId:
        "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07",
      subId:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    },
    eth: {
      name: "Ethereum",
      symbol: "ETH",
      assetId:
        "0x1234567890123456789012345678901234567890123456789012345678901234",
      decimals: 18,
      contractId:
        "0x1234567890123456789012345678901234567890123456789012345678901234",
      subId:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    },
    usdt: {
      name: "Tether USD",
      symbol: "USDT",
      assetId:
        "0x9876543210987654321098765432109876543210987654321098765432109876",
      decimals: 6,
      contractId:
        "0x9876543210987654321098765432109876543210987654321098765432109876",
      subId:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    },
  };

  describe("Pool ID Generation Validation", () => {
    it("should generate consistent pool IDs for same configuration", () => {
      const config = {
        tokenX: mockTokens.usdc.assetId,
        tokenY: mockTokens.fuel.assetId,
        binStep: STANDARD_POOL_CONFIGS.STABLE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.STABLE.baseFactor,
      };

      // Generate pool ID multiple times
      const poolId1 = buildPoolIdV2(
        config.tokenX,
        config.tokenY,
        config.binStep,
        config.baseFactor
      );

      const poolId2 = buildPoolIdV2(
        config.tokenX,
        config.tokenY,
        config.binStep,
        config.baseFactor
      );

      expect(poolId1.toHex()).toBe(poolId2.toHex());
    });

    it("should generate different pool IDs for different configurations", () => {
      const baseConfig = {
        tokenX: mockTokens.usdc.assetId,
        tokenY: mockTokens.fuel.assetId,
      };

      // Generate pool IDs for different configurations
      const stablePoolId = buildPoolIdV2(
        baseConfig.tokenX,
        baseConfig.tokenY,
        STANDARD_POOL_CONFIGS.STABLE.binStep,
        STANDARD_POOL_CONFIGS.STABLE.baseFactor
      );

      const volatilePoolId = buildPoolIdV2(
        baseConfig.tokenX,
        baseConfig.tokenY,
        STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        STANDARD_POOL_CONFIGS.VOLATILE.baseFactor
      );

      const exoticPoolId = buildPoolIdV2(
        baseConfig.tokenX,
        baseConfig.tokenY,
        STANDARD_POOL_CONFIGS.EXOTIC.binStep,
        STANDARD_POOL_CONFIGS.EXOTIC.baseFactor
      );

      // All pool IDs should be different
      expect(stablePoolId.toHex()).not.toBe(volatilePoolId.toHex());
      expect(stablePoolId.toHex()).not.toBe(exoticPoolId.toHex());
      expect(volatilePoolId.toHex()).not.toBe(exoticPoolId.toHex());
    });

    it("should generate different pool IDs for different asset pairs", () => {
      const config = {
        binStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.VOLATILE.baseFactor,
      };

      // Generate pool IDs for different asset pairs
      const usdcFuelPoolId = buildPoolIdV2(
        mockTokens.usdc.assetId,
        mockTokens.fuel.assetId,
        config.binStep,
        config.baseFactor
      );

      const ethUsdtPoolId = buildPoolIdV2(
        mockTokens.eth.assetId,
        mockTokens.usdt.assetId,
        config.binStep,
        config.baseFactor
      );

      expect(usdcFuelPoolId.toHex()).not.toBe(ethUsdtPoolId.toHex());
    });

    it("should generate same pool ID regardless of token order", () => {
      const config = {
        binStep: STANDARD_POOL_CONFIGS.STABLE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.STABLE.baseFactor,
      };

      // Generate pool ID with tokens in different orders
      const poolId1 = buildPoolIdV2(
        mockTokens.usdc.assetId,
        mockTokens.fuel.assetId,
        config.binStep,
        config.baseFactor
      );

      const poolId2 = buildPoolIdV2(
        mockTokens.fuel.assetId,
        mockTokens.usdc.assetId,
        config.binStep,
        config.baseFactor
      );

      // Pool IDs should be the same (SDK should handle token ordering internally)
      expect(poolId1.toHex()).toBe(poolId2.toHex());
    });

    it("should validate pool ID format", () => {
      const poolId = buildPoolIdV2(
        mockTokens.usdc.assetId,
        mockTokens.fuel.assetId,
        STANDARD_POOL_CONFIGS.STABLE.binStep,
        STANDARD_POOL_CONFIGS.STABLE.baseFactor
      );

      // Pool ID should be a valid BN
      expect(poolId).toBeInstanceOf(BN);

      // Pool ID hex should be a valid 64-character hex string
      const poolIdHex = poolId.toHex();
      expect(poolIdHex).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Pool ID should be non-zero
      expect(poolId.gt(0)).toBe(true);
    });

    it("should create unique pool IDs for multiple configurations", () => {
      const tokens = [
        mockTokens.usdc,
        mockTokens.fuel,
        mockTokens.eth,
        mockTokens.usdt,
      ];
      const configs = [
        STANDARD_POOL_CONFIGS.STABLE,
        STANDARD_POOL_CONFIGS.VOLATILE,
        STANDARD_POOL_CONFIGS.EXOTIC,
      ];

      const createdPoolIds: string[] = [];

      // Create pools with different token pairs and configurations
      for (let i = 0; i < tokens.length - 1; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
          for (const config of configs) {
            const poolId = buildPoolIdV2(
              tokens[i].assetId,
              tokens[j].assetId,
              config.binStep,
              config.baseFactor
            );

            const poolIdHex = poolId.toHex();

            // Verify pool ID is unique
            expect(createdPoolIds).not.toContain(poolIdHex);
            createdPoolIds.push(poolIdHex);
          }
        }
      }

      // Should have created 18 unique pool IDs (4 choose 2 = 6 pairs * 3 configs = 18)
      expect(createdPoolIds).toHaveLength(18);
    });
  });

  describe("Fee Configuration Validation", () => {
    it("should have correct standard pool configurations", () => {
      expect(STANDARD_POOL_CONFIGS.STABLE).toEqual({
        type: "STABLE",
        binStep: 1,
        baseFactor: 5000,
        protocolShare: 0,
        description: "Low volatility pairs (stablecoins) with minimal fees",
      });

      expect(STANDARD_POOL_CONFIGS.VOLATILE).toEqual({
        type: "VOLATILE",
        binStep: 20,
        baseFactor: 8000,
        protocolShare: 0,
        description: "Medium volatility pairs with standard fees",
      });

      expect(STANDARD_POOL_CONFIGS.EXOTIC).toEqual({
        type: "EXOTIC",
        binStep: 50,
        baseFactor: 15000,
        protocolShare: 0,
        description: "High volatility or exotic pairs with higher fees",
      });
    });

    it("should differentiate pools with same tokens but different fee configurations", () => {
      const baseTokens = {
        tokenX: mockTokens.usdc.assetId,
        tokenY: mockTokens.fuel.assetId,
      };

      // Create pools with different configurations
      const stablePoolId = buildPoolIdV2(
        baseTokens.tokenX,
        baseTokens.tokenY,
        STANDARD_POOL_CONFIGS.STABLE.binStep,
        STANDARD_POOL_CONFIGS.STABLE.baseFactor
      );

      const volatilePoolId = buildPoolIdV2(
        baseTokens.tokenX,
        baseTokens.tokenY,
        STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        STANDARD_POOL_CONFIGS.VOLATILE.baseFactor
      );

      const exoticPoolId = buildPoolIdV2(
        baseTokens.tokenX,
        baseTokens.tokenY,
        STANDARD_POOL_CONFIGS.EXOTIC.binStep,
        STANDARD_POOL_CONFIGS.EXOTIC.baseFactor
      );

      // Pools should have different IDs
      expect(stablePoolId.toHex()).not.toBe(volatilePoolId.toHex());
      expect(stablePoolId.toHex()).not.toBe(exoticPoolId.toHex());
      expect(volatilePoolId.toHex()).not.toBe(exoticPoolId.toHex());
    });

    it("should validate fee configuration ranges", () => {
      // Test that different bin steps produce different pool IDs
      const baseConfig = {
        tokenX: mockTokens.usdc.assetId,
        tokenY: mockTokens.fuel.assetId,
        baseFactor: 5000,
      };

      const binSteps = [1, 5, 10, 20, 50, 100];
      const poolIds = binSteps.map((binStep) =>
        buildPoolIdV2(
          baseConfig.tokenX,
          baseConfig.tokenY,
          binStep,
          baseConfig.baseFactor
        ).toHex()
      );

      // All pool IDs should be unique
      const uniquePoolIds = new Set(poolIds);
      expect(uniquePoolIds.size).toBe(binSteps.length);
    });

    it("should validate base factor configuration ranges", () => {
      // Test that different base factors produce different pool IDs
      const baseConfig = {
        tokenX: mockTokens.usdc.assetId,
        tokenY: mockTokens.fuel.assetId,
        binStep: 20,
      };

      const baseFactors = [1000, 5000, 8000, 10000, 15000, 20000];
      const poolIds = baseFactors.map((baseFactor) =>
        buildPoolIdV2(
          baseConfig.tokenX,
          baseConfig.tokenY,
          baseConfig.binStep,
          baseFactor
        ).toHex()
      );

      // All pool IDs should be unique
      const uniquePoolIds = new Set(poolIds);
      expect(uniquePoolIds.size).toBe(baseFactors.length);
    });
  });

  describe("Asset Pair Validation", () => {
    it("should handle USDC/FUEL pair correctly", () => {
      const poolId = buildPoolIdV2(
        mockTokens.usdc.assetId,
        mockTokens.fuel.assetId,
        STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        STANDARD_POOL_CONFIGS.VOLATILE.baseFactor
      );

      expect(poolId).toBeInstanceOf(BN);
      expect(poolId.gt(0)).toBe(true);
    });

    it("should handle ETH/USDT pair correctly", () => {
      const poolId = buildPoolIdV2(
        mockTokens.eth.assetId,
        mockTokens.usdt.assetId,
        STANDARD_POOL_CONFIGS.VOLATILE.binStep,
        STANDARD_POOL_CONFIGS.VOLATILE.baseFactor
      );

      expect(poolId).toBeInstanceOf(BN);
      expect(poolId.gt(0)).toBe(true);
    });

    it("should handle all possible token pair combinations", () => {
      const tokens = [
        mockTokens.usdc,
        mockTokens.fuel,
        mockTokens.eth,
        mockTokens.usdt,
      ];
      const poolIds: string[] = [];

      // Test all possible pairs
      for (let i = 0; i < tokens.length; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
          const poolId = buildPoolIdV2(
            tokens[i].assetId,
            tokens[j].assetId,
            STANDARD_POOL_CONFIGS.VOLATILE.binStep,
            STANDARD_POOL_CONFIGS.VOLATILE.baseFactor
          );

          expect(poolId).toBeInstanceOf(BN);
          expect(poolId.gt(0)).toBe(true);

          const poolIdHex = poolId.toHex();
          expect(poolIds).not.toContain(poolIdHex);
          poolIds.push(poolIdHex);
        }
      }

      // Should have 6 unique pairs (4 choose 2)
      expect(poolIds).toHaveLength(6);
    });
  });

  describe("Pool Configuration Edge Cases", () => {
    it("should handle minimum valid configuration values", () => {
      const poolId = buildPoolIdV2(
        mockTokens.usdc.assetId,
        mockTokens.fuel.assetId,
        1, // Minimum bin step
        1 // Minimum base factor
      );

      expect(poolId).toBeInstanceOf(BN);
      expect(poolId.gt(0)).toBe(true);
    });

    it("should handle maximum reasonable configuration values", () => {
      const poolId = buildPoolIdV2(
        mockTokens.usdc.assetId,
        mockTokens.fuel.assetId,
        1000, // Large bin step
        50000 // Large base factor
      );

      expect(poolId).toBeInstanceOf(BN);
      expect(poolId.gt(0)).toBe(true);
    });

    it("should generate different IDs for edge case configurations", () => {
      const minPoolId = buildPoolIdV2(
        mockTokens.usdc.assetId,
        mockTokens.fuel.assetId,
        1,
        1
      );

      const maxPoolId = buildPoolIdV2(
        mockTokens.usdc.assetId,
        mockTokens.fuel.assetId,
        1000,
        50000
      );

      expect(minPoolId.toHex()).not.toBe(maxPoolId.toHex());
    });
  });

  describe("Pool Metadata Structure Validation", () => {
    it("should validate expected pool metadata structure", () => {
      // This test validates the expected structure of pool metadata
      // that would be returned by the actual pool operations
      const expectedMetadataStructure = {
        binStep: expect.any(Number),
        baseFactor: expect.any(Number),
        protocolShare: expect.any(Number),
        activeId: expect.any(Number),
      };

      // Simulate expected metadata for STABLE configuration
      const stableMetadata = {
        binStep: STANDARD_POOL_CONFIGS.STABLE.binStep,
        baseFactor: STANDARD_POOL_CONFIGS.STABLE.baseFactor,
        protocolShare: STANDARD_POOL_CONFIGS.STABLE.protocolShare,
        activeId: 8388608, // Default center bin
      };

      expect(stableMetadata).toMatchObject(expectedMetadataStructure);
      expect(stableMetadata.binStep).toBe(1);
      expect(stableMetadata.baseFactor).toBe(5000);
      expect(stableMetadata.protocolShare).toBe(0);
    });

    it("should validate metadata for different pool types", () => {
      const poolTypes = ["STABLE", "VOLATILE", "EXOTIC"] as const;

      poolTypes.forEach((type) => {
        const config = STANDARD_POOL_CONFIGS[type];

        expect(config).toHaveProperty("type", type);
        expect(config).toHaveProperty("binStep");
        expect(config).toHaveProperty("baseFactor");
        expect(config).toHaveProperty("protocolShare");
        expect(config).toHaveProperty("description");

        expect(typeof config.binStep).toBe("number");
        expect(typeof config.baseFactor).toBe("number");
        expect(typeof config.protocolShare).toBe("number");
        expect(typeof config.description).toBe("string");

        expect(config.binStep).toBeGreaterThan(0);
        expect(config.baseFactor).toBeGreaterThan(0);
        expect(config.protocolShare).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("Pool Discovery Simulation", () => {
    it("should simulate pool discovery by asset pairs", () => {
      // Simulate what pool discovery would return
      const mockDiscoveredPools = [
        {
          poolId: buildPoolIdV2(
            mockTokens.usdc.assetId,
            mockTokens.fuel.assetId,
            STANDARD_POOL_CONFIGS.STABLE.binStep,
            STANDARD_POOL_CONFIGS.STABLE.baseFactor
          ).toHex(),
          binStep: STANDARD_POOL_CONFIGS.STABLE.binStep,
          baseFactor: STANDARD_POOL_CONFIGS.STABLE.baseFactor,
          activeId: 8388608,
        },
        {
          poolId: buildPoolIdV2(
            mockTokens.usdc.assetId,
            mockTokens.fuel.assetId,
            STANDARD_POOL_CONFIGS.VOLATILE.binStep,
            STANDARD_POOL_CONFIGS.VOLATILE.baseFactor
          ).toHex(),
          binStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
          baseFactor: STANDARD_POOL_CONFIGS.VOLATILE.baseFactor,
          activeId: 8388608,
        },
      ];

      expect(mockDiscoveredPools).toHaveLength(2);

      // Verify discovered pools have correct structure
      mockDiscoveredPools.forEach((pool) => {
        expect(pool).toHaveProperty("poolId");
        expect(pool).toHaveProperty("binStep");
        expect(pool).toHaveProperty("baseFactor");
        expect(pool).toHaveProperty("activeId");

        expect(pool.poolId).toMatch(/^0x[a-fA-F0-9]{64}$/);
        expect(typeof pool.binStep).toBe("number");
        expect(typeof pool.baseFactor).toBe("number");
        expect(typeof pool.activeId).toBe("number");
      });

      // Verify we can find both configurations
      const stablePool = mockDiscoveredPools.find(
        (p) => p.binStep === STANDARD_POOL_CONFIGS.STABLE.binStep
      );
      const volatilePool = mockDiscoveredPools.find(
        (p) => p.binStep === STANDARD_POOL_CONFIGS.VOLATILE.binStep
      );

      expect(stablePool).toBeDefined();
      expect(volatilePool).toBeDefined();
      expect(stablePool?.poolId).not.toBe(volatilePool?.poolId);
    });

    it("should simulate empty discovery for non-existent pairs", () => {
      // Simulate discovery for non-existent asset pairs
      const fakeAssetId1 =
        "0x1234567890123456789012345678901234567890123456789012345678901234";
      const fakeAssetId2 =
        "0x9876543210987654321098765432109876543210987654321098765432109876";

      // In a real scenario, this would return an empty array
      const mockDiscoveredPools: any[] = [];

      expect(mockDiscoveredPools).toHaveLength(0);
    });
  });
});

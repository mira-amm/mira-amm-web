import {BN} from "fuels";
import {MockDataGenerator, PoolScenarioConfig} from "../MockDataGenerator";
import {MockPoolScenario} from "../types";

describe("MockDataGenerator", () => {
  describe("generatePoolScenario", () => {
    it("should generate a complete pool scenario with concentrated distribution", () => {
      const config: PoolScenarioConfig = {
        name: "Test Pool",
        description: "Test pool scenario",
        assetA:
          "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07",
        assetB:
          "0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b",
        binStep: 25,
        activeBinId: 8388608,
        basePrice: new BN(2000000000),
        totalLiquidity: {
          assetA: new BN("100000000000000000000"),
          assetB: new BN("200000000000"),
        },
        binCount: 11,
        distributionType: "concentrated",
        volume24h: new BN("50000000000"),
      };

      const scenario = MockDataGenerator.generatePoolScenario(config);

      expect(scenario.name).toBe("Test Pool");
      expect(scenario.description).toBe("Test pool scenario");
      expect(scenario.poolConfig.activeBinId).toBe(8388608);
      expect(scenario.bins).toHaveLength(11);

      // Check that active bin has both assets
      const activeBin = scenario.bins.find((bin) => bin.binId === 8388608);
      expect(activeBin).toBeDefined();
      expect(activeBin!.reserves.assetA.gt(0)).toBe(true);
      expect(activeBin!.reserves.assetB.gt(0)).toBe(true);
    });

    it("should generate different distributions for different types", () => {
      const baseConfig: PoolScenarioConfig = {
        name: "Test",
        description: "Test",
        assetA:
          "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07",
        assetB:
          "0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b",
        binStep: 25,
        activeBinId: 8388608,
        basePrice: new BN(2000000000),
        totalLiquidity: {
          assetA: new BN("100000000000000000000"),
          assetB: new BN("200000000000"),
        },
        binCount: 11,
        distributionType: "concentrated",
      };

      const concentratedScenario = MockDataGenerator.generatePoolScenario({
        ...baseConfig,
        distributionType: "concentrated",
      });

      const uniformScenario = MockDataGenerator.generatePoolScenario({
        ...baseConfig,
        distributionType: "uniform",
      });

      // Concentrated should have more liquidity in active bin
      const concentratedActiveBin = concentratedScenario.bins.find(
        (bin) => bin.binId === 8388608
      )!;
      const uniformActiveBin = uniformScenario.bins.find(
        (bin) => bin.binId === 8388608
      )!;

      // In concentrated distribution, active bin should have more LP tokens
      expect(concentratedActiveBin.lpTokens.gt(uniformActiveBin.lpTokens)).toBe(
        true
      );
    });
  });

  describe("generateBinDistribution", () => {
    it("should create correct number of bins around active bin", () => {
      const bins = MockDataGenerator.generateBinDistribution(
        8388608, // activeBin
        11, // binCount
        {
          assetA: new BN("100000000000000000000"),
          assetB: new BN("200000000000"),
        },
        "concentrated",
        new BN(2000000000),
        25
      );

      expect(bins).toHaveLength(11);

      // Check bin IDs are correct (5 below, active, 5 above)
      const binIds = bins.map((bin) => bin.binId).sort((a, b) => a - b);
      expect(binIds[0]).toBe(8388603); // activeBin - 5
      expect(binIds[5]).toBe(8388608); // activeBin
      expect(binIds[10]).toBe(8388613); // activeBin + 5
    });

    it("should mark only the active bin as active", () => {
      const bins = MockDataGenerator.generateBinDistribution(
        8388608,
        11,
        {
          assetA: new BN("100000000000000000000"),
          assetB: new BN("200000000000"),
        },
        "concentrated",
        new BN(2000000000),
        25
      );

      const activeBins = bins.filter((bin) => bin.isActive);
      expect(activeBins).toHaveLength(1);
      expect(activeBins[0].binId).toBe(8388608);
    });

    it("should distribute assets correctly based on bin position", () => {
      const bins = MockDataGenerator.generateBinDistribution(
        8388608,
        11,
        {
          assetA: new BN("100000000000000000000"),
          assetB: new BN("200000000000"),
        },
        "concentrated",
        new BN(2000000000),
        25
      );

      const activeBin = bins.find((bin) => bin.binId === 8388608)!;
      const lowerBin = bins.find((bin) => bin.binId === 8388603)!; // Below active
      const upperBin = bins.find((bin) => bin.binId === 8388613)!; // Above active

      // Active bin should have both assets
      expect(activeBin.reserves.assetA.gt(0)).toBe(true);
      expect(activeBin.reserves.assetB.gt(0)).toBe(true);

      // Lower bin should have only asset A
      expect(lowerBin.reserves.assetA.gt(0)).toBe(true);
      expect(lowerBin.reserves.assetB.eq(0)).toBe(true);

      // Upper bin should have only asset B
      expect(upperBin.reserves.assetA.eq(0)).toBe(true);
      expect(upperBin.reserves.assetB.gt(0)).toBe(true);
    });
  });

  describe("calculateBinPrice", () => {
    it("should return base price for active bin (offset 0)", () => {
      const basePrice = new BN(2000000000);
      const price = MockDataGenerator.calculateBinPrice(basePrice, 0, 25);
      expect(price.eq(basePrice)).toBe(true);
    });

    it("should calculate higher prices for positive offsets", () => {
      const basePrice = new BN(2000000000);
      const price1 = MockDataGenerator.calculateBinPrice(basePrice, 1, 25);
      const price2 = MockDataGenerator.calculateBinPrice(basePrice, 2, 25);

      expect(price1.gt(basePrice)).toBe(true);
      expect(price2.gt(price1)).toBe(true);
    });

    it("should calculate lower prices for negative offsets", () => {
      const basePrice = new BN(2000000000);
      const price1 = MockDataGenerator.calculateBinPrice(basePrice, -1, 25);
      const price2 = MockDataGenerator.calculateBinPrice(basePrice, -2, 25);

      expect(price1.lt(basePrice)).toBe(true);
      expect(price2.lt(price1)).toBe(true);
    });
  });

  describe("generateVolumeData", () => {
    it("should generate correct number of data points", () => {
      const baseVolume = new BN("50000000000");
      const volumeData = MockDataGenerator.generateVolumeData(baseVolume, 24);

      expect(volumeData).toHaveLength(24);
    });

    it("should generate realistic volume distribution", () => {
      const baseVolume = new BN("50000000000");
      const volumeData = MockDataGenerator.generateVolumeData(baseVolume, 24);

      // Sum of all volumes should be approximately equal to base volume
      const totalVolume = volumeData.reduce(
        (sum, point) => sum.add(point.volume),
        new BN(0)
      );

      // Should be within 50% of base volume (due to randomness)
      const lowerBound = baseVolume.mul(50).div(100);
      const upperBound = baseVolume.mul(150).div(100);
      expect(totalVolume.gte(lowerBound)).toBe(true);
      expect(totalVolume.lte(upperBound)).toBe(true);
    });

    it("should generate timestamps in chronological order", () => {
      const baseVolume = new BN("50000000000");
      const volumeData = MockDataGenerator.generateVolumeData(baseVolume, 12);

      for (let i = 1; i < volumeData.length; i++) {
        expect(volumeData[i].timestamp.getTime()).toBeGreaterThan(
          volumeData[i - 1].timestamp.getTime()
        );
      }
    });
  });

  describe("generateFeeData", () => {
    it("should calculate fees correctly based on volume and rate", () => {
      const volume = new BN("1000000000000"); // $1M volume
      const feeRate = 30; // 0.3%
      const fees = MockDataGenerator.generateFeeData(volume, feeRate);

      const expectedFees = volume.mul(30).div(10000); // 0.3% of volume
      expect(fees.eq(expectedFees)).toBe(true);
    });

    it("should use default fee rate when not specified", () => {
      const volume = new BN("1000000000000");
      const fees = MockDataGenerator.generateFeeData(volume);

      const expectedFees = volume.mul(30).div(10000); // Default 0.3%
      expect(fees.eq(expectedFees)).toBe(true);
    });
  });

  describe("predefined scenarios", () => {
    describe("createEthUsdcPoolScenario", () => {
      it("should create ETH/USDC pool with correct assets", () => {
        const scenario =
          MockDataGenerator.createEthUsdcPoolScenario("concentrated");

        expect(scenario.name).toContain("ETH/USDC");
        expect(scenario.poolConfig.metadata.assetA).toBe(
          "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07"
        );
        expect(scenario.poolConfig.metadata.assetB).toBe(
          "0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b"
        );
        expect(scenario.bins.length).toBeGreaterThan(0);
      });

      it("should create different distributions for different types", () => {
        const concentrated =
          MockDataGenerator.createEthUsdcPoolScenario("concentrated");
        const uniform = MockDataGenerator.createEthUsdcPoolScenario("uniform");

        expect(concentrated.name).toContain("concentrated");
        expect(uniform.name).toContain("uniform");
        expect(concentrated.bins.length).toBe(uniform.bins.length);
      });
    });

    describe("createUsdcEthPoolScenario", () => {
      it("should create USDC/ETH pool with swapped assets", () => {
        const scenario = MockDataGenerator.createUsdcEthPoolScenario("wide");

        expect(scenario.name).toContain("USDC/ETH");
        expect(scenario.poolConfig.metadata.assetA).toBe(
          "0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b"
        );
        expect(scenario.poolConfig.metadata.assetB).toBe(
          "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07"
        );
      });
    });

    describe("getAllPredefinedScenarios", () => {
      it("should return multiple predefined scenarios", () => {
        const scenarios = MockDataGenerator.getAllPredefinedScenarios();

        expect(scenarios.length).toBeGreaterThan(0);
        expect(
          scenarios.every((s) => s.name && s.description && s.bins.length > 0)
        ).toBe(true);
      });

      it("should include both ETH/USDC and USDC/ETH scenarios", () => {
        const scenarios = MockDataGenerator.getAllPredefinedScenarios();

        const ethUsdcScenarios = scenarios.filter((s) =>
          s.name.includes("ETH/USDC")
        );
        const usdcEthScenarios = scenarios.filter((s) =>
          s.name.includes("USDC/ETH")
        );

        expect(ethUsdcScenarios.length).toBeGreaterThan(0);
        expect(usdcEthScenarios.length).toBeGreaterThan(0);
      });
    });

    describe("createCustomPoolScenario", () => {
      it("should create custom scenario with provided config", () => {
        const customConfig = {
          name: "My Custom Pool",
          binCount: 7,
          distributionType: "asymmetric" as const,
        };

        const scenario =
          MockDataGenerator.createCustomPoolScenario(customConfig);

        expect(scenario.name).toBe("My Custom Pool");
        expect(scenario.bins).toHaveLength(7);
      });

      it("should use defaults for unspecified config", () => {
        const scenario = MockDataGenerator.createCustomPoolScenario({});

        expect(scenario.name).toBe("Custom Pool");
        expect(scenario.bins.length).toBeGreaterThan(0);
        expect(scenario.poolConfig.metadata.assetA).toBe(
          "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07"
        );
      });
    });
  });

  describe("generatePriceMovement", () => {
    it("should generate correct number of price points", () => {
      const currentPrice = new BN(2000000000);
      const prices = MockDataGenerator.generatePriceMovement(
        currentPrice,
        0.1,
        24
      );

      expect(prices).toHaveLength(24);
      expect(prices[0].eq(currentPrice)).toBe(true);
    });

    it("should generate realistic price movements", () => {
      const currentPrice = new BN(2000000000);
      const prices = MockDataGenerator.generatePriceMovement(
        currentPrice,
        0.1,
        10
      );

      // All prices should be positive
      expect(prices.every((price) => price.gt(0))).toBe(true);

      // Prices should not deviate too wildly (within 50% for low volatility)
      const minExpected = currentPrice.mul(50).div(100);
      const maxExpected = currentPrice.mul(150).div(100);

      expect(
        prices.every(
          (price) => price.gte(minExpected) && price.lte(maxExpected)
        )
      ).toBe(true);
    });
  });

  describe("getAssetInfo", () => {
    it("should return correct info for ETH", () => {
      const info = MockDataGenerator.getAssetInfo(
        "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07"
      );

      expect(info.symbol).toBe("ETH");
      expect(info.name).toBe("Ethereum");
      expect(info.decimals).toBe(9);
    });

    it("should return correct info for USDC", () => {
      const info = MockDataGenerator.getAssetInfo(
        "0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b"
      );

      expect(info.symbol).toBe("USDC");
      expect(info.name).toBe("USD Coin");
      expect(info.decimals).toBe(6);
    });

    it("should return unknown for unrecognized assets", () => {
      const info = MockDataGenerator.getAssetInfo("0x1234567890");

      expect(info.symbol).toBe("UNKNOWN");
      expect(info.name).toBe("Unknown Asset");
      expect(info.decimals).toBe(18);
    });
  });
});

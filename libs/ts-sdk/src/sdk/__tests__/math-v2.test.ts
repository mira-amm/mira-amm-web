import {BN} from "fuels";
import {
  getAmountOutV2,
  getAmountInV2,
  getBinPrice,
  getPriceBinId,
  calculateLiquidityDistributionV2,
  calculateOptimalDistribution,
  calculatePositionValue,
  calculateImpermanentLossV2,
  calculateSwapFeeV2,
  calculateEffectivePrice,
  calculatePriceImpact,
  calculateMinAmountOut,
  calculateMaxAmountIn,
  calculateBinLiquidity,
  roundingUpDivision,
} from "../math-v2";
import {
  getAmountOutWithFeesV2,
  getAmountInWithFeesV2,
  getAmountsOutV2,
  getAmountsInV2,
  calculateProportionalAmountV2,
  validateSlippageV2,
} from "../math";
import {PoolMetadataV2, Amounts, LiquidityConfig} from "../model";
import {InvalidAmountError, InsufficientReservesError} from "../errors";

describe("Math V2 Functions", () => {
  const mockPoolMetadata: PoolMetadataV2 = {
    poolId: new BN(1),
    pool: {
      assetX: {bits: "0x1"},
      assetY: {bits: "0x2"},
      binStep: 25,
      baseFactor: 8000,
    },
    activeId: 8388608, // ID for price = 1.0
    reserves: {
      x: new BN("1000000000000000000"), // 1 token
      y: new BN("1000000000000000000"), // 1 token
    },
    protocolFees: {
      x: new BN(0),
      y: new BN(0),
    },
  };

  describe("getBinPrice", () => {
    it("should calculate correct price for bin ID 0", () => {
      const price = getBinPrice(0, 25);
      expect(price.toString()).toBe("1000000000000000000"); // 1.0 with 18 decimals
    });

    it("should calculate correct price for positive bin ID", () => {
      const price = getBinPrice(1, 25);
      // Price should be (1 + 25/10000)^1 = 1.0025
      expect(price.gt(new BN("1000000000000000000"))).toBe(true);
    });

    it("should calculate correct price for negative bin ID", () => {
      const price = getBinPrice(-1, 25);
      // Price should be (1 + 25/10000)^(-1) ≈ 0.9975
      expect(price.lt(new BN("1000000000000000000"))).toBe(true);
    });
  });

  describe("getPriceBinId", () => {
    it("should return 0 for price = 1.0", () => {
      const binId = getPriceBinId(new BN("1000000000000000000"), 25);
      expect(binId).toBe(0);
    });

    it("should return positive bin ID for price > 1.0", () => {
      const binId = getPriceBinId(new BN("1002500000000000000"), 25); // ~1.0025
      expect(binId).toBeGreaterThan(0);
    });

    it("should return negative bin ID for price < 1.0", () => {
      const binId = getPriceBinId(new BN("997500000000000000"), 25); // ~0.9975
      expect(binId).toBeLessThan(0);
    });
  });

  describe("calculateLiquidityDistributionV2", () => {
    it("should distribute liquidity correctly across bins", () => {
      const totalAmountX = new BN("1000000000000000000");
      const totalAmountY = new BN("2000000000000000000");
      const activeBinId = 0;
      const liquidityConfigs: LiquidityConfig[] = [
        {binId: -1, distributionX: 5000, distributionY: 0}, // 50% X
        {binId: 0, distributionX: 5000, distributionY: 5000}, // 50% X, 50% Y
        {binId: 1, distributionX: 0, distributionY: 5000}, // 50% Y
      ];

      const distribution = calculateLiquidityDistributionV2(
        totalAmountX,
        totalAmountY,
        activeBinId,
        liquidityConfigs
      );

      expect(distribution.size).toBe(3);
      expect(distribution.get(-1)?.x.toString()).toBe("500000000000000000"); // 50% of X
      expect(distribution.get(-1)?.y.toString()).toBe("0");
      expect(distribution.get(0)?.x.toString()).toBe("500000000000000000"); // 50% of X
      expect(distribution.get(0)?.y.toString()).toBe("1000000000000000000"); // 50% of Y
      expect(distribution.get(1)?.x.toString()).toBe("0");
      expect(distribution.get(1)?.y.toString()).toBe("1000000000000000000"); // 50% of Y
    });

    it("should throw error for zero total distribution", () => {
      const liquidityConfigs: LiquidityConfig[] = [
        {binId: 0, distributionX: 0, distributionY: 0},
      ];

      expect(() =>
        calculateLiquidityDistributionV2(
          new BN(1000),
          new BN(1000),
          0,
          liquidityConfigs
        )
      ).toThrow("Total distribution cannot be zero");
    });
  });

  describe("calculateOptimalDistribution", () => {
    it("should create distribution with correct number of bins", () => {
      const configs = calculateOptimalDistribution(0, -5, 5, 0.5);
      expect(configs.length).toBe(11); // -5 to 5 inclusive
    });

    it("should concentrate liquidity around active bin", () => {
      const configs = calculateOptimalDistribution(0, -2, 2, 0.8);
      const activeBinConfig = configs.find((c) => c.binId === 0);
      const edgeBinConfig = configs.find((c) => c.binId === 2);

      expect(activeBinConfig).toBeDefined();
      expect(edgeBinConfig).toBeDefined();
      expect(
        activeBinConfig!.distributionX + activeBinConfig!.distributionY
      ).toBeGreaterThan(
        edgeBinConfig!.distributionX + edgeBinConfig!.distributionY
      );
    });

    it("should throw error for invalid concentration factor", () => {
      expect(() => calculateOptimalDistribution(0, -1, 1, -0.1)).toThrow();
      expect(() => calculateOptimalDistribution(0, -1, 1, 1.1)).toThrow();
    });
  });

  describe("calculatePositionValue", () => {
    it("should calculate total position value correctly", () => {
      const binPositions = [
        {binId: -1, amounts: {x: new BN(100), y: new BN(0)}},
        {binId: 0, amounts: {x: new BN(200), y: new BN(300)}},
        {binId: 1, amounts: {x: new BN(0), y: new BN(400)}},
      ];

      const totalValue = calculatePositionValue(binPositions, mockPoolMetadata);
      expect(totalValue.x.toString()).toBe("300"); // 100 + 200 + 0
      expect(totalValue.y.toString()).toBe("700"); // 0 + 300 + 400
    });
  });

  describe("calculateImpermanentLossV2", () => {
    it("should calculate zero loss when price doesn't change", () => {
      const initialAmounts = {x: new BN(1000), y: new BN(1000)};
      const currentAmounts = {x: new BN(1000), y: new BN(1000)};
      const price = new BN("1000000000000000000");

      const loss = calculateImpermanentLossV2(
        initialAmounts,
        currentAmounts,
        price,
        price
      );

      expect(loss.toString()).toBe("0");
    });

    it("should calculate positive loss when price changes unfavorably", () => {
      const initialAmounts = {x: new BN(1000), y: new BN(1000)};
      const currentAmounts = {x: new BN(800), y: new BN(1200)}; // Rebalanced
      const initialPrice = new BN("1000000000000000000");
      const currentPrice = new BN("2000000000000000000"); // Price doubled

      const loss = calculateImpermanentLossV2(
        initialAmounts,
        currentAmounts,
        initialPrice,
        currentPrice
      );

      expect(loss.gt(new BN(0))).toBe(true);
    });
  });

  describe("calculateSwapFeeV2", () => {
    it("should calculate fee correctly", () => {
      const amountIn = new BN("1000000000000000000");
      const feeBasisPoints = new BN(30); // 0.3%

      const fee = calculateSwapFeeV2(amountIn, feeBasisPoints);
      expect(fee.toString()).toBe("3000000000000000"); // 0.3% of 1 token
    });
  });

  describe("calculateEffectivePrice", () => {
    it("should calculate effective price correctly", () => {
      const amountIn = new BN("1000000000000000000");
      const amountOut = new BN("990000000000000000");

      const effectivePrice = calculateEffectivePrice(amountIn, amountOut);
      expect(effectivePrice.toString()).toBe("990000000000000000"); // 0.99
    });

    it("should throw error for zero input", () => {
      expect(() => calculateEffectivePrice(new BN(0), new BN(100))).toThrow(
        "Input amount cannot be zero"
      );
    });
  });

  describe("calculatePriceImpact", () => {
    it("should calculate price impact correctly", () => {
      const spotPrice = new BN("1000000000000000000");
      const effectivePrice = new BN("990000000000000000");

      const impact = calculatePriceImpact(spotPrice, effectivePrice);
      expect(impact.toString()).toBe("100"); // 1% in basis points
    });

    it("should return zero for zero spot price", () => {
      const impact = calculatePriceImpact(new BN(0), new BN(100));
      expect(impact.toString()).toBe("0");
    });
  });

  describe("calculateMinAmountOut", () => {
    it("should calculate minimum amount with slippage", () => {
      const amountOut = new BN("1000000000000000000");
      const slippage = new BN(100); // 1%

      const minAmount = calculateMinAmountOut(amountOut, slippage);
      expect(minAmount.toString()).toBe("990000000000000000"); // 99% of original
    });
  });

  describe("calculateMaxAmountIn", () => {
    it("should calculate maximum amount with slippage", () => {
      const amountIn = new BN("1000000000000000000");
      const slippage = new BN(100); // 1%

      const maxAmount = calculateMaxAmountIn(amountIn, slippage);
      expect(maxAmount.toString()).toBe("1010000000000000000"); // 101% of original
    });
  });

  describe("calculateBinLiquidity", () => {
    it("should calculate liquidity for both tokens", () => {
      const amountX = new BN("1000000000000000000");
      const amountY = new BN("1000000000000000000");
      const binId = 0;
      const binStep = 25;

      const liquidity = calculateBinLiquidity(amountX, amountY, binId, binStep);
      expect(liquidity.gt(new BN(0))).toBe(true);
    });

    it("should handle zero amounts", () => {
      const liquidity = calculateBinLiquidity(new BN(0), new BN(0), 0, 25);
      expect(liquidity.toString()).toBe("0");
    });

    it("should handle single token amounts", () => {
      const liquidityX = calculateBinLiquidity(new BN(1000), new BN(0), 0, 25);
      const liquidityY = calculateBinLiquidity(new BN(0), new BN(1000), 0, 25);

      expect(liquidityX.gt(new BN(0))).toBe(true);
      expect(liquidityY.gt(new BN(0))).toBe(true);
    });
  });

  describe("roundingUpDivision", () => {
    it("should round up when there's a remainder", () => {
      const result = roundingUpDivision(new BN(10), new BN(3));
      expect(result.toString()).toBe("4"); // 10/3 = 3.33... rounds up to 4
    });

    it("should not round when division is exact", () => {
      const result = roundingUpDivision(new BN(10), new BN(2));
      expect(result.toString()).toBe("5"); // 10/2 = 5 exactly
    });
  });
});

describe("Math V2 Integration Functions", () => {
  const mockPoolMetadata: PoolMetadataV2 = {
    poolId: new BN(1),
    pool: {
      assetX: {bits: "0x1"},
      assetY: {bits: "0x2"},
      binStep: 25,
      baseFactor: 8000,
    },
    activeId: 8388608,
    reserves: {
      x: new BN("1000000000000000000"),
      y: new BN("1000000000000000000"),
    },
    protocolFees: {
      x: new BN(0),
      y: new BN(0),
    },
  };

  describe("calculateProportionalAmountV2", () => {
    it("should calculate proportional Y amount for given X", () => {
      const amountX = new BN("500000000000000000");
      const amountY = calculateProportionalAmountV2(
        mockPoolMetadata,
        amountX,
        true
      );

      // With equal reserves, should return same amount
      expect(amountY.toString()).toBe("500000000000000000");
    });

    it("should calculate proportional X amount for given Y", () => {
      const amountY = new BN("500000000000000000");
      const amountX = calculateProportionalAmountV2(
        mockPoolMetadata,
        amountY,
        false
      );

      // With equal reserves, should return same amount
      expect(amountX.toString()).toBe("500000000000000000");
    });

    it("should return zero for empty pool", () => {
      const emptyPoolMetadata = {
        ...mockPoolMetadata,
        reserves: {x: new BN(0), y: new BN(0)},
      };

      const amount = calculateProportionalAmountV2(
        emptyPoolMetadata,
        new BN(1000),
        true
      );
      expect(amount.toString()).toBe("0");
    });
  });

  describe("validateSlippageV2", () => {
    it("should validate amounts within slippage tolerance", () => {
      const expected = new BN("1000000000000000000");
      const actual = new BN("995000000000000000"); // 0.5% less
      const slippage = new BN(100); // 1% tolerance

      const isValid = validateSlippageV2(expected, actual, slippage);
      expect(isValid).toBe(true);
    });

    it("should reject amounts outside slippage tolerance", () => {
      const expected = new BN("1000000000000000000");
      const actual = new BN("980000000000000000"); // 2% less
      const slippage = new BN(100); // 1% tolerance

      const isValid = validateSlippageV2(expected, actual, slippage);
      expect(isValid).toBe(false);
    });
  });

  describe("getAmountsOutV2", () => {
    it("should calculate amounts for multi-hop route", () => {
      const poolsMetadata = [mockPoolMetadata, mockPoolMetadata];
      const amountIn = new BN("1000000000000000000");
      const swapDirections = [true, false]; // X->Y then Y->X
      const fees = [new BN(30), new BN(30)]; // 0.3% each

      const amounts = getAmountsOutV2(
        poolsMetadata,
        amountIn,
        swapDirections,
        fees
      );

      expect(amounts.length).toBe(3); // Input + 2 intermediate amounts
      expect(amounts[0].toString()).toBe(amountIn.toString());
      expect(amounts[amounts.length - 1].lt(amountIn)).toBe(true); // Should be less due to fees
    });

    it("should throw error for mismatched array lengths", () => {
      expect(() =>
        getAmountsOutV2(
          [mockPoolMetadata],
          new BN(1000),
          [true, false],
          [new BN(30)]
        )
      ).toThrow("Arrays must have the same length");
    });
  });

  describe("getAmountsInV2", () => {
    it("should calculate required inputs for multi-hop route", () => {
      const poolsMetadata = [mockPoolMetadata, mockPoolMetadata];
      const amountOut = new BN("100000000000000000"); // Smaller amount to avoid insufficient reserves
      const swapDirections = [true, false];
      const fees = [new BN(30), new BN(30)];

      const amounts = getAmountsInV2(
        poolsMetadata,
        amountOut,
        swapDirections,
        fees
      );

      expect(amounts.length).toBe(3);
      expect(amounts[amounts.length - 1].toString()).toBe(amountOut.toString());
      expect(amounts[0].gt(amountOut)).toBe(true); // Should be more due to fees
    });
  });
});

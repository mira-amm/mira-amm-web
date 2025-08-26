import {describe, it, expect} from "vitest";
import {BN, AssetId} from "fuels";
import {
  validatePoolId,
  validateAssetId,
  validateDifferentAssets,
  validateAmount,
  validateBinId,
  validateBinStep,
  validateSlippage,
  validateDeadline,
  validateLiquidityDistribution,
  validateLiquidityConfig,
  validatePoolInput,
  validateSwapParams,
  validateAddLiquidityParams,
  validateRemoveLiquidityParams,
  DEFAULT_VALIDATION_OPTIONS,
} from "../../validation/v2-validation";
import {EnhancedMiraV2Error} from "../../errors/v2-errors";
import {
  PoolCurveStateError,
  type PoolInput,
  type LiquidityConfig,
} from "../../model";

describe("V2 Validation", () => {
  const mockAssetId1 = {bits: "0x1234567890abcdef"} as AssetId;
  const mockAssetId2 = {bits: "0xfedcba0987654321"} as AssetId;
  const mockPoolId = new BN(123);

  describe("validatePoolId", () => {
    it("should pass for valid pool ID", () => {
      expect(() => validatePoolId(mockPoolId)).not.toThrow();
    });

    it("should throw for zero pool ID", () => {
      expect(() => validatePoolId(new BN(0))).toThrow(EnhancedMiraV2Error);
    });

    it("should throw for null pool ID", () => {
      expect(() => validatePoolId(null as any)).toThrow(EnhancedMiraV2Error);
    });
  });

  describe("validateAssetId", () => {
    it("should pass for valid asset ID", () => {
      expect(() => validateAssetId(mockAssetId1, "testAsset")).not.toThrow();
    });

    it("should throw for invalid asset ID", () => {
      expect(() => validateAssetId(null as any, "testAsset")).toThrow(
        EnhancedMiraV2Error
      );
    });

    it("should throw for asset ID without bits", () => {
      const invalidAsset = {} as AssetId;
      expect(() => validateAssetId(invalidAsset, "testAsset")).toThrow(
        EnhancedMiraV2Error
      );
    });
  });

  describe("validateDifferentAssets", () => {
    it("should pass for different assets", () => {
      expect(() =>
        validateDifferentAssets(mockAssetId1, mockAssetId2)
      ).not.toThrow();
    });

    it("should throw for identical assets", () => {
      expect(() => validateDifferentAssets(mockAssetId1, mockAssetId1)).toThrow(
        EnhancedMiraV2Error
      );
    });
  });

  describe("validateAmount", () => {
    it("should pass for positive amounts", () => {
      expect(() => validateAmount(new BN(100), "testAmount")).not.toThrow();
      expect(() => validateAmount("100", "testAmount")).not.toThrow();
      expect(() => validateAmount(100, "testAmount")).not.toThrow();
    });

    it("should throw for negative amounts", () => {
      expect(() => validateAmount(new BN(-100), "testAmount")).toThrow(
        EnhancedMiraV2Error
      );
    });

    it("should throw for zero amounts by default", () => {
      expect(() => validateAmount(new BN(0), "testAmount")).toThrow(
        EnhancedMiraV2Error
      );
    });

    it("should allow zero amounts when configured", () => {
      expect(() =>
        validateAmount(new BN(0), "testAmount", {allowZeroAmounts: true})
      ).not.toThrow();
    });
  });

  describe("validateBinId", () => {
    it("should pass for valid bin IDs", () => {
      expect(() => validateBinId(0)).not.toThrow();
      expect(() => validateBinId(1000)).not.toThrow();
      expect(() => validateBinId(-1000)).not.toThrow();
    });

    it("should throw for bin IDs outside valid range", () => {
      expect(() => validateBinId(-8388609)).toThrow(EnhancedMiraV2Error);
      expect(() => validateBinId(8388608)).toThrow(EnhancedMiraV2Error);
    });
  });

  describe("validateBinStep", () => {
    it("should pass for valid bin steps", () => {
      expect(() => validateBinStep(1)).not.toThrow();
      expect(() => validateBinStep(50)).not.toThrow();
      expect(() => validateBinStep(100)).not.toThrow();
    });

    it("should throw for bin steps outside valid range", () => {
      expect(() => validateBinStep(0)).toThrow(EnhancedMiraV2Error);
      expect(() => validateBinStep(101)).toThrow(EnhancedMiraV2Error);
    });
  });

  describe("validateSlippage", () => {
    it("should pass for valid slippage values", () => {
      expect(() => validateSlippage(0)).not.toThrow();
      expect(() => validateSlippage(5)).not.toThrow();
      expect(() => validateSlippage(50)).not.toThrow();
    });

    it("should throw for negative slippage", () => {
      expect(() => validateSlippage(-1)).toThrow(EnhancedMiraV2Error);
    });

    it("should throw for excessive slippage", () => {
      expect(() => validateSlippage(51)).toThrow(EnhancedMiraV2Error);
    });
  });

  describe("validateDeadline", () => {
    it("should pass for future deadlines", () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      expect(() => validateDeadline(futureTime)).not.toThrow();
    });

    it("should throw for past deadlines", () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      expect(() => validateDeadline(pastTime)).toThrow(EnhancedMiraV2Error);
    });

    it("should throw for deadlines too far in the future", () => {
      const farFutureTime = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
      expect(() => validateDeadline(farFutureTime)).toThrow(
        EnhancedMiraV2Error
      );
    });
  });

  describe("validateLiquidityDistribution", () => {
    it("should pass for valid distributions", () => {
      const distributionX = [50, 50];
      const distributionY = [30, 70];
      const deltaIds = [{}, {}];

      expect(() =>
        validateLiquidityDistribution(distributionX, distributionY, deltaIds)
      ).not.toThrow();
    });

    it("should throw for mismatched array lengths", () => {
      const distributionX = [50, 50];
      const distributionY = [100]; // Different length

      expect(() =>
        validateLiquidityDistribution(distributionX, distributionY)
      ).toThrow(EnhancedMiraV2Error);
    });

    it("should throw for invalid distribution totals", () => {
      const distributionX = [30, 30]; // Totals to 60, not 100

      expect(() => validateLiquidityDistribution(distributionX)).toThrow(
        EnhancedMiraV2Error
      );
    });
  });

  describe("validateLiquidityConfig", () => {
    it("should pass for valid liquidity config", () => {
      const configs: LiquidityConfig[] = [
        {binId: 100, distributionX: 50, distributionY: 50},
        {binId: 101, distributionX: 30, distributionY: 70},
      ];

      expect(() => validateLiquidityConfig(configs)).not.toThrow();
    });

    it("should throw for empty config array", () => {
      expect(() => validateLiquidityConfig([])).toThrow(EnhancedMiraV2Error);
    });

    it("should throw for invalid distribution percentages", () => {
      const configs: LiquidityConfig[] = [
        {binId: 100, distributionX: 150, distributionY: 50}, // Invalid X
      ];

      expect(() => validateLiquidityConfig(configs)).toThrow(
        EnhancedMiraV2Error
      );
    });
  });

  describe("validatePoolInput", () => {
    it("should pass for valid pool input", () => {
      const poolInput: PoolInput = {
        assetX: mockAssetId1,
        assetY: mockAssetId2,
        binStep: 25,
        baseFactor: 10000,
      };

      expect(() => validatePoolInput(poolInput)).not.toThrow();
    });

    it("should throw for identical assets", () => {
      const poolInput: PoolInput = {
        assetX: mockAssetId1,
        assetY: mockAssetId1, // Same as X
        binStep: 25,
        baseFactor: 10000,
      };

      expect(() => validatePoolInput(poolInput)).toThrow(EnhancedMiraV2Error);
    });
  });

  describe("validateSwapParams", () => {
    it("should pass for valid swap parameters", () => {
      const futureDeadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
      const pools = [mockPoolId];

      expect(() =>
        validateSwapParams(100, 90, pools, futureDeadline)
      ).not.toThrow();
    });

    it("should throw for empty pools array", () => {
      const futureDeadline = Math.floor(Date.now() / 1000) + 1800;

      expect(() => validateSwapParams(100, 90, [], futureDeadline)).toThrow(
        EnhancedMiraV2Error
      );
    });
  });

  describe("validateAddLiquidityParams", () => {
    it("should pass for valid add liquidity parameters", () => {
      const futureDeadline = Math.floor(Date.now() / 1000) + 1800;

      expect(() =>
        validateAddLiquidityParams(
          mockPoolId,
          1000, // amountADesired
          2000, // amountBDesired
          900, // amountAMin
          1800, // amountBMin
          futureDeadline
        )
      ).not.toThrow();
    });

    it("should throw when min amounts exceed desired amounts", () => {
      const futureDeadline = Math.floor(Date.now() / 1000) + 1800;

      expect(() =>
        validateAddLiquidityParams(
          mockPoolId,
          1000, // amountADesired
          2000, // amountBDesired
          1100, // amountAMin > amountADesired
          1800, // amountBMin
          futureDeadline
        )
      ).toThrow(EnhancedMiraV2Error);
    });
  });

  describe("validateRemoveLiquidityParams", () => {
    it("should pass for valid remove liquidity parameters", () => {
      const futureDeadline = Math.floor(Date.now() / 1000) + 1800;
      const binIds = [100, 101, 102];

      expect(() =>
        validateRemoveLiquidityParams(
          mockPoolId,
          binIds,
          900, // amountAMin
          1800, // amountBMin
          futureDeadline
        )
      ).not.toThrow();
    });

    it("should throw for empty bin IDs array", () => {
      const futureDeadline = Math.floor(Date.now() / 1000) + 1800;

      expect(() =>
        validateRemoveLiquidityParams(
          mockPoolId,
          [], // Empty bin IDs
          900,
          1800,
          futureDeadline
        )
      ).toThrow(EnhancedMiraV2Error);
    });
  });
});

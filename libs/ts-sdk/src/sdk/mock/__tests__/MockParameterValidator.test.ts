import {BN, AssetId} from "fuels";
import {
  MockParameterValidator,
  DEFAULT_MOCK_VALIDATION_OPTIONS,
} from "../MockParameterValidator";
import {MockError, MockErrorType} from "../types";
import {PoolIdV2, PoolInput} from "../../model";
import {it} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {it} from "node:test";
import {describe} from "node:test";
import {beforeEach} from "node:test";
import {describe} from "node:test";

describe("MockParameterValidator", () => {
  let validator: MockParameterValidator;

  beforeEach(() => {
    validator = new MockParameterValidator(DEFAULT_MOCK_VALIDATION_OPTIONS);
  });

  describe("validateAddLiquidity", () => {
    const validParams = {
      poolId: new BN("12345"),
      amountADesired: new BN("1000000"),
      amountBDesired: new BN("2000000"),
      amountAMin: new BN("950000"),
      amountBMin: new BN("1900000"),
      deadline: new BN(Math.floor(Date.now() / 1000) + 10 * 60), // 10 minutes from now in seconds
    };

    it("should validate correct parameters without throwing", () => {
      expect(() => {
        validator.validateAddLiquidity(
          validParams.poolId,
          validParams.amountADesired,
          validParams.amountBDesired,
          validParams.amountAMin,
          validParams.amountBMin,
          validParams.deadline
        );
      }).not.toThrow();
    });

    it("should throw for zero pool ID", () => {
      expect(() => {
        validator.validateAddLiquidity(
          new BN(0),
          validParams.amountADesired,
          validParams.amountBDesired,
          validParams.amountAMin,
          validParams.amountBMin,
          validParams.deadline
        );
      }).toThrow("Pool ID cannot be zero or null");
    });

    it("should throw for negative amounts", () => {
      expect(() => {
        validator.validateAddLiquidity(
          validParams.poolId,
          new BN(-1000),
          validParams.amountBDesired,
          validParams.amountAMin,
          validParams.amountBMin,
          validParams.deadline
        );
      }).toThrow("amountADesired cannot be negative");
    });

    it("should throw for zero amounts when not allowed", () => {
      expect(() => {
        validator.validateAddLiquidity(
          validParams.poolId,
          new BN(0),
          validParams.amountBDesired,
          validParams.amountAMin,
          validParams.amountBMin,
          validParams.deadline
        );
      }).toThrow("amountADesired cannot be zero");
    });

    it("should throw when min amount exceeds desired amount", () => {
      expect(() => {
        validator.validateAddLiquidity(
          validParams.poolId,
          validParams.amountADesired,
          validParams.amountBDesired,
          new BN("2000000"), // Greater than desired
          validParams.amountBMin,
          validParams.deadline
        );
      }).toThrow("Minimum amount A cannot be greater than desired amount A");
    });

    it("should throw for past deadline", () => {
      expect(() => {
        validator.validateAddLiquidity(
          validParams.poolId,
          validParams.amountADesired,
          validParams.amountBDesired,
          validParams.amountAMin,
          validParams.amountBMin,
          new BN(Math.floor(Date.now() / 1000) - 60) // Past deadline (1 minute ago)
        );
      }).toThrow("Deadline must be in the future");
    });

    it("should validate distribution arrays", () => {
      const deltaIds = [{Positive: 0}, {Positive: 1}];
      const distributionX = [new BN(50), new BN(50)];
      const distributionY = [new BN(60), new BN(40)];

      expect(() => {
        validator.validateAddLiquidity(
          validParams.poolId,
          validParams.amountADesired,
          validParams.amountBDesired,
          validParams.amountAMin,
          validParams.amountBMin,
          validParams.deadline,
          new BN(8388607),
          new BN(5),
          deltaIds,
          distributionX,
          distributionY
        );
      }).not.toThrow();
    });

    it("should throw for mismatched distribution array lengths", () => {
      const deltaIds = [{Positive: 0}, {Positive: 1}];
      const distributionX = [new BN(50), new BN(50)];
      const distributionY = [new BN(100)]; // Different length

      expect(() => {
        validator.validateAddLiquidity(
          validParams.poolId,
          validParams.amountADesired,
          validParams.amountBDesired,
          validParams.amountAMin,
          validParams.amountBMin,
          validParams.deadline,
          new BN(8388608),
          new BN(5),
          deltaIds,
          distributionX,
          distributionY
        );
      }).toThrow("Distribution arrays must have the same length");
    });

    it("should throw for too many bins", () => {
      validator.updateOptions({maxBinsPerOperation: 2});

      const deltaIds = [{Positive: 0}, {Positive: 1}, {Positive: 2}]; // 3 bins, max is 2
      const distributionX = [new BN(33), new BN(33), new BN(34)];
      const distributionY = [new BN(33), new BN(33), new BN(34)];

      expect(() => {
        validator.validateAddLiquidity(
          validParams.poolId,
          validParams.amountADesired,
          validParams.amountBDesired,
          validParams.amountAMin,
          validParams.amountBMin,
          validParams.deadline,
          new BN(8388608),
          new BN(5),
          deltaIds,
          distributionX,
          distributionY
        );
      }).toThrow("Too many bins specified");
    });
  });

  describe("validateRemoveLiquidity", () => {
    const validParams = {
      poolId: new BN("12345"),
      binIds: [new BN(8388607), new BN(8388606)], // Use valid bin IDs within range
      amountAMin: new BN("950000"),
      amountBMin: new BN("1900000"),
      deadline: new BN(Math.floor(Date.now() / 1000) + 10 * 60), // 10 minutes from now in seconds
    };

    it("should validate correct parameters without throwing", () => {
      expect(() => {
        validator.validateRemoveLiquidity(
          validParams.poolId,
          validParams.binIds,
          validParams.amountAMin,
          validParams.amountBMin,
          validParams.deadline
        );
      }).not.toThrow();
    });

    it("should throw for empty bin IDs array", () => {
      expect(() => {
        validator.validateRemoveLiquidity(
          validParams.poolId,
          [],
          validParams.amountAMin,
          validParams.amountBMin,
          validParams.deadline
        );
      }).toThrow("At least one bin ID must be provided");
    });

    it("should throw for duplicate bin IDs", () => {
      expect(() => {
        validator.validateRemoveLiquidity(
          validParams.poolId,
          [new BN(8388607), new BN(8388607)], // Duplicate
          validParams.amountAMin,
          validParams.amountBMin,
          validParams.deadline
        );
      }).toThrow("Duplicate bin IDs are not allowed");
    });

    it("should throw for too many bins", () => {
      validator.updateOptions({maxBinsPerOperation: 1});

      expect(() => {
        validator.validateRemoveLiquidity(
          validParams.poolId,
          [new BN(8388607), new BN(8388606)], // 2 bins, max is 1
          validParams.amountAMin,
          validParams.amountBMin,
          validParams.deadline
        );
      }).toThrow("Too many bins specified for removal");
    });
  });

  describe("validateSwap", () => {
    const mockAssetIn: AssetId = {bits: "0x1234567890abcdef"} as AssetId;
    const validParams = {
      amountIn: new BN("1000000"),
      assetIn: mockAssetIn,
      amountOutMin: new BN("950000"),
      pools: [new BN("12345")],
      deadline: new BN(Math.floor(Date.now() / 1000) + 10 * 60), // 10 minutes from now in seconds
    };

    it("should validate correct parameters without throwing", () => {
      expect(() => {
        validator.validateSwap(
          validParams.amountIn,
          validParams.assetIn,
          validParams.amountOutMin,
          validParams.pools,
          validParams.deadline
        );
      }).not.toThrow();
    });

    it("should throw for empty pools array", () => {
      expect(() => {
        validator.validateSwap(
          validParams.amountIn,
          validParams.assetIn,
          validParams.amountOutMin,
          [],
          validParams.deadline
        );
      }).toThrow("At least one pool must be provided");
    });

    it("should throw for too many pools", () => {
      validator.updateOptions({maxPoolsInRoute: 2});

      const manyPools = [new BN("1"), new BN("2"), new BN("3")]; // 3 pools, max is 2

      expect(() => {
        validator.validateSwap(
          validParams.amountIn,
          validParams.assetIn,
          validParams.amountOutMin,
          manyPools,
          validParams.deadline
        );
      }).toThrow("Too many pools in swap route");
    });

    it("should throw for zero amount in", () => {
      expect(() => {
        validator.validateSwap(
          new BN(0),
          validParams.assetIn,
          validParams.amountOutMin,
          validParams.pools,
          validParams.deadline
        );
      }).toThrow("amountIn cannot be zero");
    });
  });

  describe("validateCreatePool", () => {
    const mockAssetX: AssetId = {bits: "0x1234567890abcdef"} as AssetId;
    const mockAssetY: AssetId = {bits: "0xfedcba0987654321"} as AssetId;

    const validPool: PoolInput = {
      assetX: mockAssetX,
      assetY: mockAssetY,
      binStep: new BN(25),
      baseFactor: new BN(15000),
    };

    it("should validate correct parameters without throwing", () => {
      expect(() => {
        validator.validateCreatePool(validPool, new BN(8388607)); // Use valid bin ID within range
      }).not.toThrow();
    });

    it("should throw for identical assets", () => {
      const invalidPool: PoolInput = {
        assetX: mockAssetX,
        assetY: mockAssetX, // Same as assetX
        binStep: new BN(25),
        baseFactor: new BN(15000),
      };

      expect(() => {
        validator.validateCreatePool(invalidPool, new BN(8388608));
      }).toThrow("Assets must be different");
    });

    it("should throw for invalid bin step", () => {
      const invalidPool: PoolInput = {
        ...validPool,
        binStep: new BN(0), // Invalid
      };

      expect(() => {
        validator.validateCreatePool(invalidPool, new BN(8388608));
      }).toThrow("Bin step must be at least 1");
    });

    it("should throw for invalid base factor", () => {
      const invalidPool: PoolInput = {
        ...validPool,
        baseFactor: new BN(5000), // Too low
      };

      expect(() => {
        validator.validateCreatePool(invalidPool, new BN(8388607));
      }).toThrow("Base factor must be between 10000 and 20000");
    });

    it("should throw for extreme active ID", () => {
      expect(() => {
        validator.validateCreatePool(validPool, new BN(10000000)); // Too high
      }).toThrow("Active ID 10000000 is outside reasonable range");
    });
  });

  describe("validateBalanceRequirements", () => {
    it("should validate sufficient balances", () => {
      const userBalances = new Map([
        ["asset1", new BN("1000000")],
        ["asset2", new BN("2000000")],
      ]);

      const requiredBalances = new Map([
        ["asset1", new BN("500000")],
        ["asset2", new BN("1000000")],
      ]);

      expect(() => {
        validator.validateBalanceRequirements(
          userBalances,
          requiredBalances,
          "test"
        );
      }).not.toThrow();
    });

    it("should throw for insufficient balance", () => {
      const userBalances = new Map([
        ["asset1", new BN("100000")], // Insufficient
        ["asset2", new BN("2000000")],
      ]);

      const requiredBalances = new Map([
        ["asset1", new BN("500000")],
        ["asset2", new BN("1000000")],
      ]);

      expect(() => {
        validator.validateBalanceRequirements(
          userBalances,
          requiredBalances,
          "test"
        );
      }).toThrow(MockError);

      try {
        validator.validateBalanceRequirements(
          userBalances,
          requiredBalances,
          "test"
        );
      } catch (error) {
        expect(error).toBeInstanceOf(MockError);
        expect((error as MockError).type).toBe(
          MockErrorType.INSUFFICIENT_BALANCE
        );
        expect((error as MockError).context?.shortfall).toBe("400000");
      }
    });

    it("should skip validation when configured", () => {
      validator.updateOptions({skipBalanceValidation: true});

      const userBalances = new Map([["asset1", new BN("100")]]);
      const requiredBalances = new Map([["asset1", new BN("1000000")]]);

      expect(() => {
        validator.validateBalanceRequirements(
          userBalances,
          requiredBalances,
          "test"
        );
      }).not.toThrow();
    });
  });

  describe("validatePoolExistence", () => {
    it("should validate existing pool", () => {
      expect(() => {
        validator.validatePoolExistence(new BN("12345"), true, "test");
      }).not.toThrow();
    });

    it("should throw for non-existent pool", () => {
      expect(() => {
        validator.validatePoolExistence(new BN("12345"), false, "test");
      }).toThrow(MockError);

      try {
        validator.validatePoolExistence(new BN("12345"), false, "test");
      } catch (error) {
        expect(error).toBeInstanceOf(MockError);
        expect((error as MockError).type).toBe(MockErrorType.POOL_NOT_FOUND);
        expect((error as MockError).context?.suggestion).toContain(
          "Create the pool first"
        );
      }
    });

    it("should skip validation when configured", () => {
      validator.updateOptions({skipPoolExistenceValidation: true});

      expect(() => {
        validator.validatePoolExistence(new BN("12345"), false, "test");
      }).not.toThrow();
    });
  });

  describe("validateSlippageTolerance", () => {
    it("should validate acceptable slippage", () => {
      const expected = new BN("1000000");
      const actual = new BN("950000"); // 5% slippage

      expect(() => {
        validator.validateSlippageTolerance(expected, actual, 10, "test"); // 10% max
      }).not.toThrow();
    });

    it("should throw for excessive slippage", () => {
      const expected = new BN("1000000");
      const actual = new BN("800000"); // 20% slippage

      expect(() => {
        validator.validateSlippageTolerance(expected, actual, 10, "test"); // 10% max
      }).toThrow(MockError);

      try {
        validator.validateSlippageTolerance(expected, actual, 10, "test");
      } catch (error) {
        expect(error).toBeInstanceOf(MockError);
        expect((error as MockError).type).toBe(MockErrorType.SLIPPAGE_EXCEEDED);
        expect((error as MockError).context?.slippagePercent).toBe("20.00");
      }
    });
  });

  describe("updateOptions", () => {
    it("should update validation options", () => {
      const newOptions = {
        allowZeroAmounts: true,
        maxBinStep: 200,
        skipBalanceValidation: true,
      };

      validator.updateOptions(newOptions);

      // Test that zero amounts are now allowed
      expect(() => {
        validator.validateAddLiquidity(
          new BN("12345"),
          new BN(0), // Zero amount now allowed
          new BN("1000000"),
          new BN(0),
          new BN("950000"),
          new BN(Math.floor(Date.now() / 1000) + 10 * 60) // 10 minutes from now in seconds
        );
      }).not.toThrow();
    });
  });
});

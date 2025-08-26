import {describe, it, expect, vi, beforeEach} from "vitest";
import {BN, Provider} from "fuels";
import {ReadonlyMiraAmmV2} from "../readonly_mira_amm_v2";
import {PoolIdV2, PoolMetadataV2, Amounts} from "../model";

// Mock the provider and contract
const mockProvider = {
  getBalance: vi.fn(),
} as unknown as Provider;

const mockContract = {
  functions: {
    get_pool: vi.fn(),
    get_pool_active_bin_id: vi.fn(),
    get_bin: vi.fn(),
    get_price_from_id: vi.fn(),
    total_supply: vi.fn(),
  },
  multiCall: vi.fn(),
  id: {toB256: () => "0x1234567890abcdef"},
};

describe("Position Management V2", () => {
  let readonlyAmm: ReadonlyMiraAmmV2;
  let mockPoolId: PoolIdV2;
  let mockPoolMetadata: PoolMetadataV2;

  beforeEach(() => {
    vi.clearAllMocks();

    readonlyAmm = new ReadonlyMiraAmmV2(mockProvider);
    // Replace the contract with our mock
    (readonlyAmm as any).ammContract = mockContract;

    mockPoolId = new BN(12345);
    mockPoolMetadata = {
      poolId: mockPoolId,
      pool: {
        assetX: {bits: "0xassetX"},
        assetY: {bits: "0xassetY"},
        binStep: 25,
        baseFactor: 5000,
      },
      activeId: 100,
      reserves: {
        x: new BN(1000000),
        y: new BN(2000000),
      },
      protocolFees: {
        x: new BN(1000),
        y: new BN(2000),
      },
    };
  });

  describe("getOtherTokenToAddLiquidity", () => {
    it("should calculate required Y token amount when adding X token", async () => {
      // Mock pool metadata
      vi.spyOn(readonlyAmm, "poolMetadata").mockResolvedValue(mockPoolMetadata);

      // Mock active bin
      vi.spyOn(readonlyAmm, "getActiveBin").mockResolvedValue(100);

      // Mock active bin liquidity
      const activeBinLiquidity: Amounts = {
        x: new BN(500000),
        y: new BN(1000000),
      };
      vi.spyOn(readonlyAmm, "getBinLiquidity").mockResolvedValue(
        activeBinLiquidity
      );

      const result = await readonlyAmm.getOtherTokenToAddLiquidity(
        mockPoolId,
        new BN(100000), // Adding 100,000 X tokens
        true // isFirstToken = true (adding X)
      );

      expect(result[0]).toEqual(mockPoolMetadata.pool.assetY);
      // Should calculate Y amount based on X/Y ratio in active bin: 100000 * 1000000 / 500000 = 200000
      expect(result[1].gte(new BN(200000))).toBe(true); // Should be at least 200000 with buffer
    });

    it("should calculate required X token amount when adding Y token", async () => {
      // Mock pool metadata
      vi.spyOn(readonlyAmm, "poolMetadata").mockResolvedValue(mockPoolMetadata);

      // Mock active bin
      vi.spyOn(readonlyAmm, "getActiveBin").mockResolvedValue(100);

      // Mock active bin liquidity
      const activeBinLiquidity: Amounts = {
        x: new BN(500000),
        y: new BN(1000000),
      };
      vi.spyOn(readonlyAmm, "getBinLiquidity").mockResolvedValue(
        activeBinLiquidity
      );

      const result = await readonlyAmm.getOtherTokenToAddLiquidity(
        mockPoolId,
        new BN(200000), // Adding 200,000 Y tokens
        false // isFirstToken = false (adding Y)
      );

      expect(result[0]).toEqual(mockPoolMetadata.pool.assetX);
      // Should calculate X amount based on Y/X ratio in active bin: 200000 * 500000 / 1000000 = 100000
      expect(result[1].gte(new BN(100000))).toBe(true); // Should be at least 100000 with buffer
    });

    it("should handle case when active bin has no liquidity", async () => {
      // Mock pool metadata
      vi.spyOn(readonlyAmm, "poolMetadata").mockResolvedValue(mockPoolMetadata);

      // Mock active bin
      vi.spyOn(readonlyAmm, "getActiveBin").mockResolvedValue(100);

      // Mock active bin with no liquidity
      vi.spyOn(readonlyAmm, "getBinLiquidity").mockResolvedValue({
        x: new BN(0),
        y: new BN(0),
      });

      const result = await readonlyAmm.getOtherTokenToAddLiquidity(
        mockPoolId,
        new BN(100000),
        true
      );

      expect(result[0]).toEqual(mockPoolMetadata.pool.assetY);
      // Should fall back to total pool reserves ratio
      expect(result[1].gt(new BN(0))).toBe(true);
    });
  });

  describe("getLiquidityPosition", () => {
    it("should calculate liquidity position based on bin distribution", async () => {
      // Mock pool metadata
      vi.spyOn(readonlyAmm, "poolMetadata").mockResolvedValue(mockPoolMetadata);

      // Mock liquidity distribution
      const mockDistribution = {
        totalLiquidity: {
          x: new BN(1000000),
          y: new BN(2000000),
        },
        activeBinId: 100,
        bins: [
          {
            binId: 99,
            liquidity: {x: new BN(300000), y: new BN(600000)},
            price: new BN(9950),
          },
          {
            binId: 100,
            liquidity: {x: new BN(400000), y: new BN(800000)},
            price: new BN(10000),
          },
          {
            binId: 101,
            liquidity: {x: new BN(300000), y: new BN(600000)},
            price: new BN(10050),
          },
        ],
      };
      vi.spyOn(readonlyAmm, "getLiquidityDistribution").mockResolvedValue(
        mockDistribution
      );

      const result = await readonlyAmm.getLiquidityPosition(
        mockPoolId,
        new BN(100000) // LP token amount
      );

      expect(result[0][0]).toEqual(mockPoolMetadata.pool.assetX);
      expect(result[1][0]).toEqual(mockPoolMetadata.pool.assetY);
      expect(result[0][1].gt(new BN(0))).toBe(true); // Should have some X amount
      expect(result[1][1].gt(new BN(0))).toBe(true); // Should have some Y amount
    });

    it("should fall back to simple calculation when bin distribution fails", async () => {
      // Mock pool metadata
      vi.spyOn(readonlyAmm, "poolMetadata").mockResolvedValue(mockPoolMetadata);

      // Mock liquidity distribution to throw error
      vi.spyOn(readonlyAmm, "getLiquidityDistribution").mockRejectedValue(
        new Error("No bins")
      );

      const result = await readonlyAmm.getLiquidityPosition(
        mockPoolId,
        new BN(100000)
      );

      expect(result[0][0]).toEqual(mockPoolMetadata.pool.assetX);
      expect(result[1][0]).toEqual(mockPoolMetadata.pool.assetY);
      expect(result[0][1].gt(new BN(0))).toBe(true);
      expect(result[1][1].gt(new BN(0))).toBe(true);
    });
  });

  describe("getLiquidityPositionDetailed", () => {
    it("should return detailed position information across bins", async () => {
      const userAddress = {bits: "0xuser123"};

      // Mock pool metadata
      vi.spyOn(readonlyAmm, "poolMetadata").mockResolvedValue(mockPoolMetadata);

      // Mock user bin positions
      const mockBinPositions = [
        {
          binId: 99,
          lpTokenAmount: new BN(50000),
          underlyingAmounts: {x: new BN(25000), y: new BN(50000)},
        },
        {
          binId: 100,
          lpTokenAmount: new BN(30000),
          underlyingAmounts: {x: new BN(15000), y: new BN(30000)},
        },
      ];
      vi.spyOn(readonlyAmm, "getUserBinPositions").mockResolvedValue(
        mockBinPositions
      );

      // Mock active bin
      vi.spyOn(readonlyAmm, "getActiveBin").mockResolvedValue(100);

      // Mock price queries
      vi.spyOn(readonlyAmm, "getPriceFromId")
        .mockResolvedValueOnce(new BN(9950))
        .mockResolvedValueOnce(new BN(10000));

      const result = await readonlyAmm.getLiquidityPositionDetailed(
        mockPoolId,
        userAddress
      );

      expect(result.totalPosition[0][0]).toEqual(mockPoolMetadata.pool.assetX);
      expect(result.totalPosition[1][0]).toEqual(mockPoolMetadata.pool.assetY);
      expect(result.totalPosition[0][1].toString()).toEqual(
        new BN(40000).toString()
      ); // 25000 + 15000
      expect(result.totalPosition[1][1].toString()).toEqual(
        new BN(80000).toString()
      ); // 50000 + 30000
      expect(result.binPositions).toEqual(mockBinPositions);
      expect(result.activeBinId).toBe(100);
      expect(result.positionValue.gt(new BN(0))).toBe(true);
    });
  });

  describe("calculateOptimalLiquidityDistribution", () => {
    it("should calculate optimal distribution across price range", async () => {
      // Mock pool metadata
      vi.spyOn(readonlyAmm, "poolMetadata").mockResolvedValue(mockPoolMetadata);

      // Mock active bin
      vi.spyOn(readonlyAmm, "getActiveBin").mockResolvedValue(100);

      // Mock bin ID calculations
      vi.spyOn(readonlyAmm as any, "getBinIdFromPrice")
        .mockResolvedValueOnce(95) // min bin
        .mockResolvedValueOnce(105); // max bin

      // Mock price queries for each bin
      vi.spyOn(readonlyAmm, "getPriceFromId").mockResolvedValue(new BN(10000));

      const result = await readonlyAmm.calculateOptimalLiquidityDistribution(
        mockPoolId,
        new BN(1000000), // amountX
        new BN(2000000), // amountY
        {
          minPrice: new BN(9500),
          maxPrice: new BN(10500),
        }
      );

      expect(result.distributions.length).toBe(11); // 95 to 105 inclusive
      expect(result.activeBinId).toBe(100);
      expect(result.totalBins).toBe(11);

      // Check that distributions sum up correctly
      const totalPercentage = result.distributions.reduce(
        (sum, dist) => sum + dist.percentage,
        0
      );
      expect(totalPercentage).toBeGreaterThan(0);
    });
  });
});

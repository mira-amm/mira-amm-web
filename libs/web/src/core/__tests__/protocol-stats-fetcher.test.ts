import {describe, it, expect, vi, beforeEach} from "vitest";
import {StatsService} from "../stats-service";
import type {PoolData} from "../../types/protocol-stats";

// Mock the cached GraphQL client
vi.mock("../cached-graphql-client", () => ({
  cachedSubsquidClient: {
    query: vi.fn(),
    clearCache: vi.fn(),
    getCacheStats: vi.fn(),
  },
}));

describe("StatsService", () => {
  let statsService: StatsService;
  const mockPoolData: PoolData[] = [
    {
      poolTVL: 1000000,
      poolAlltimeVolume: 5000000,
      snapshot24hours: [{poolHourVolume: 10000}, {poolHourVolume: 15000}],
      snapshot7days: [
        {poolHourVolume: 5000},
        {poolHourVolume: 8000},
        {poolHourVolume: 12000},
      ],
    },
    {
      poolTVL: 2000000,
      poolAlltimeVolume: 8000000,
      snapshot24hours: [{poolHourVolume: 20000}],
      snapshot7days: [{poolHourVolume: 15000}, {poolHourVolume: 18000}],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    statsService = new StatsService();
  });

  it("should calculate stats correctly from pool data", async () => {
    const {cachedSubsquidClient} = await import("../cached-graphql-client");
    vi.mocked(cachedSubsquidClient.query).mockResolvedValue({
      pools: mockPoolData,
    });

    const result = await statsService.fetchProtocolStats();

    expect(result).toEqual({
      totalTVL: 3000000, // 1M + 2M
      allTimeVolume: 13000000, // 5M + 8M
      oneDayVolume: 45000, // 10k + 15k + 20k
      sevenDayVolume: 58000, // 5k + 8k + 12k + 15k + 18k
    });
  });

  it("should handle empty pool data", async () => {
    const {cachedSubsquidClient} = await import("../cached-graphql-client");
    vi.mocked(cachedSubsquidClient.query).mockResolvedValue({pools: []});

    const result = await statsService.fetchProtocolStats();

    expect(result).toEqual({
      totalTVL: 0,
      allTimeVolume: 0,
      oneDayVolume: 0,
      sevenDayVolume: 0,
    });
  });

  it("should handle null/undefined values gracefully", async () => {
    const {cachedSubsquidClient} = await import("../cached-graphql-client");
    const poolDataWithNulls: PoolData[] = [
      {
        poolTVL: 1000000,
        poolAlltimeVolume: 0,
        snapshot24hours: [],
        snapshot7days: [],
      },
    ];

    vi.mocked(cachedSubsquidClient.query).mockResolvedValue({
      pools: poolDataWithNulls,
    });

    const result = await statsService.fetchProtocolStats();

    expect(result).toEqual({
      totalTVL: 1000000,
      allTimeVolume: 0,
      oneDayVolume: 0,
      sevenDayVolume: 0,
    });
  });

  it("should fallback to basic query on error", async () => {
    const {cachedSubsquidClient} = await import("../cached-graphql-client");

    // First call fails, second call (fallback) succeeds
    vi.mocked(cachedSubsquidClient.query)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        pools: [
          {
            poolTVL: 500000,
            poolAlltimeVolume: 2000000,
            snapshot24hours: [],
            snapshot7days: [],
          },
        ],
      });

    const result = await statsService.fetchProtocolStats();

    expect(result).toEqual({
      totalTVL: 500000,
      allTimeVolume: 2000000,
      oneDayVolume: 0, // Not available in basic query
      sevenDayVolume: 0, // Not available in basic query
    });
  });

  it("should throw error when both queries fail", async () => {
    const {cachedSubsquidClient} = await import("../cached-graphql-client");
    vi.mocked(cachedSubsquidClient.query).mockRejectedValue(
      new Error("Network error")
    );

    await expect(statsService.fetchProtocolStats()).rejects.toThrow(
      "Unable to fetch protocol statistics"
    );
  });

  it("should validate GraphQL response structure", async () => {
    const {cachedSubsquidClient} = await import("../cached-graphql-client");

    // Test invalid response structure - both main and fallback queries return null
    vi.mocked(cachedSubsquidClient.query).mockResolvedValue(null as any);

    await expect(statsService.fetchProtocolStats()).rejects.toThrow(
      "Unable to fetch protocol statistics"
    );
  });

  it("should validate pool data fields", async () => {
    const {cachedSubsquidClient} = await import("../cached-graphql-client");

    // Test invalid pool data - both main and fallback queries return invalid data
    const invalidPoolData = {
      pools: [
        {
          poolTVL: "invalid", // Should be number
          poolAlltimeVolume: 1000000,
          snapshot24hours: [],
          snapshot7days: [],
        },
      ],
    };

    vi.mocked(cachedSubsquidClient.query).mockResolvedValue(
      invalidPoolData as any
    );

    await expect(statsService.fetchProtocolStats()).rejects.toThrow(
      "Unable to fetch protocol statistics"
    );
  });

  it("should handle negative values by converting to zero", async () => {
    const {cachedSubsquidClient} = await import("../cached-graphql-client");

    const poolDataWithNegatives: PoolData[] = [
      {
        poolTVL: -1000, // Negative value
        poolAlltimeVolume: 5000000,
        snapshot24hours: [{poolHourVolume: -500}], // Negative volume
        snapshot7days: [{poolHourVolume: 1000}],
      },
    ];

    vi.mocked(cachedSubsquidClient.query).mockResolvedValue({
      pools: poolDataWithNegatives,
    });

    const result = await statsService.fetchProtocolStats();

    expect(result.totalTVL).toBe(0); // Negative converted to 0
    expect(result.oneDayVolume).toBe(0); // Negative volume converted to 0
    expect(result.allTimeVolume).toBe(5000000); // Positive value preserved
  });

  it("should handle malformed snapshot data", async () => {
    const {cachedSubsquidClient} = await import("../cached-graphql-client");

    // Test malformed snapshot data - this should fail validation for both main and fallback queries
    const poolDataWithMalformedSnapshots: any[] = [
      {
        poolTVL: 1000000,
        poolAlltimeVolume: 5000000,
        snapshot24hours: [
          {poolHourVolume: 1000},
          null, // Null snapshot
          {poolHourVolume: "invalid"}, // Invalid volume type
          {poolHourVolume: 2000},
        ],
        snapshot7days: "not_an_array", // Invalid array type - this will fail validation
      },
    ];

    // Mock both main and fallback queries to return the same malformed data
    vi.mocked(cachedSubsquidClient.query)
      .mockResolvedValueOnce({
        pools: poolDataWithMalformedSnapshots,
      })
      .mockResolvedValueOnce({
        pools: poolDataWithMalformedSnapshots,
      });

    await expect(statsService.fetchProtocolStats()).rejects.toThrow(
      "Unable to fetch protocol statistics"
    );
  });

  it("should warn about data inconsistencies", async () => {
    const {cachedSubsquidClient} = await import("../cached-graphql-client");
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Create data where 1-day volume > 7-day volume (inconsistent)
    const inconsistentPoolData: PoolData[] = [
      {
        poolTVL: 1000000,
        poolAlltimeVolume: 5000000,
        snapshot24hours: [{poolHourVolume: 10000}], // Higher 1-day volume
        snapshot7days: [{poolHourVolume: 5000}], // Lower 7-day volume
      },
    ];

    vi.mocked(cachedSubsquidClient.query).mockResolvedValue({
      pools: inconsistentPoolData,
    });

    const result = await statsService.fetchProtocolStats();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Data inconsistency: 7-day volume is less than 1-day volume"
    );
    expect(result.oneDayVolume).toBe(10000);
    expect(result.sevenDayVolume).toBe(5000);

    consoleSpy.mockRestore();
  });
});

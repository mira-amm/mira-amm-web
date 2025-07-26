import {ReadonlyMiraAmm} from "../../readonly_mira_amm";
import {PoolId, PoolMetadata} from "../../model";
import {CacheOptions} from "../types";
import {Provider} from "fuels";

// Mock the Provider and MiraAmmContract
jest.mock("fuels");
jest.mock("../../typegen/MiraAmmContract");

describe("ReadonlyMiraAmm - Cached Pool Metadata Fetching", () => {
  let readonlyAmm: ReadonlyMiraAmm;
  let mockProvider: jest.Mocked<Provider>;

  const mockPoolId: PoolId = [
    {bits: "0x1234567890abcdef"},
    {bits: "0xfedcba0987654321"},
    false,
  ];

  const mockPoolMetadata: PoolMetadata = {
    poolId: mockPoolId,
    reserve0: {toString: () => "1000000"} as any,
    reserve1: {toString: () => "2000000"} as any,
    liquidity: [{bits: "0xabcdef"}, {toString: () => "500000"}] as any,
    decimals0: 9,
    decimals1: 6,
  };

  beforeEach(() => {
    mockProvider = {
      // Add minimal provider mock
    } as any;

    readonlyAmm = new ReadonlyMiraAmm(mockProvider);

    // Mock the direct batch method to return test data
    jest
      .spyOn(readonlyAmm as any, "poolMetadataBatchDirect")
      .mockResolvedValue([mockPoolMetadata]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("poolMetadataBatch with caching", () => {
    it("should fetch from network when cache is empty", async () => {
      const options: CacheOptions = {useCache: true};
      const result = await readonlyAmm.poolMetadataBatch([mockPoolId], options);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockPoolMetadata);
      expect((readonlyAmm as any).poolMetadataBatchDirect).toHaveBeenCalledWith(
        [mockPoolId]
      );
    });

    it("should use cached data on second call", async () => {
      const options: CacheOptions = {useCache: true};

      // First call - should fetch from network
      await readonlyAmm.poolMetadataBatch([mockPoolId], options);

      // Second call - should use cache
      const result = await readonlyAmm.poolMetadataBatch([mockPoolId], options);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          poolId: mockPoolMetadata.poolId,
          reserve0: mockPoolMetadata.reserve0,
          reserve1: mockPoolMetadata.reserve1,
        })
      );

      // Should only call direct method once (first call)
      expect(
        (readonlyAmm as any).poolMetadataBatchDirect
      ).toHaveBeenCalledTimes(1);
    });

    it("should bypass cache when useCache is false", async () => {
      const options: CacheOptions = {useCache: false};

      // First call
      await readonlyAmm.poolMetadataBatch([mockPoolId], options);

      // Second call with cache disabled
      await readonlyAmm.poolMetadataBatch([mockPoolId], options);

      // Should call direct method twice
      expect(
        (readonlyAmm as any).poolMetadataBatchDirect
      ).toHaveBeenCalledTimes(2);
    });

    it("should refresh stale data when refreshStaleData is true", async () => {
      const options: CacheOptions = {
        useCache: true,
        refreshStaleData: true,
        cacheTTL: 100, // Very short TTL for testing
      };

      // First call
      await readonlyAmm.poolMetadataBatch([mockPoolId], options);

      // Wait for data to become stale
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Second call should refresh stale data
      await readonlyAmm.poolMetadataBatch([mockPoolId], options);

      // Should call direct method twice (initial + refresh)
      expect(
        (readonlyAmm as any).poolMetadataBatchDirect
      ).toHaveBeenCalledTimes(2);
    });

    it("should handle mixed cache hits and misses", async () => {
      const mockPoolId2: PoolId = [
        {bits: "0x9999999999999999"},
        {bits: "0x8888888888888888"},
        true,
      ];

      const mockPoolMetadata2: PoolMetadata = {
        ...mockPoolMetadata,
        poolId: mockPoolId2,
      };

      // Mock direct method to return both pools
      (readonlyAmm as any).poolMetadataBatchDirect.mockResolvedValue([
        mockPoolMetadata,
        mockPoolMetadata2,
      ]);

      const options: CacheOptions = {useCache: true};

      // First call - cache first pool
      await readonlyAmm.poolMetadataBatch([mockPoolId], options);

      // Second call - mix of cached and new pool
      const result = await readonlyAmm.poolMetadataBatch(
        [mockPoolId, mockPoolId2],
        options
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          poolId: mockPoolMetadata.poolId,
        })
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          poolId: mockPoolMetadata2.poolId,
        })
      );

      // Should call direct method twice: once for first pool, once for second pool
      expect(
        (readonlyAmm as any).poolMetadataBatchDirect
      ).toHaveBeenCalledTimes(2);
    });
  });

  describe("preloadPoolsForRoutes", () => {
    it("should preload unique pools from routes", async () => {
      const mockPoolId2: PoolId = [
        {bits: "0x9999999999999999"},
        {bits: "0x8888888888888888"},
        true,
      ];

      const routes: PoolId[][] = [
        [mockPoolId, mockPoolId2],
        [mockPoolId], // Duplicate pool should be deduplicated
      ];

      (readonlyAmm as any).poolMetadataBatchDirect.mockResolvedValue([
        mockPoolMetadata,
        {...mockPoolMetadata, poolId: mockPoolId2},
      ]);

      await readonlyAmm.preloadPoolsForRoutes(routes);

      // Should call direct method once with unique pools
      expect(
        (readonlyAmm as any).poolMetadataBatchDirect
      ).toHaveBeenCalledTimes(1);
      expect((readonlyAmm as any).poolMetadataBatchDirect).toHaveBeenCalledWith(
        expect.arrayContaining([mockPoolId, mockPoolId2])
      );
    });
  });

  describe("cache access", () => {
    it("should provide access to pool cache", () => {
      const cache = readonlyAmm.getPoolCache();
      expect(cache).toBeDefined();
      expect(typeof cache.getStats).toBe("function");
      expect(typeof cache.clear).toBe("function");
    });
  });
});

import React from "react";
import {renderHook} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {describe, it, expect, beforeEach, vi} from "vitest";

// Mock all external dependencies first
vi.mock("fuels", () => ({
  bn: vi.fn((value) => ({
    gt: vi.fn(() => true),
    toString: vi.fn(() => value.toString()),
  })),
}));

vi.mock("../get-swap-quotes-batch", () => ({
  getSwapQuotesBatch: vi.fn(),
  TradeType: {
    EXACT_IN: "EXACT_IN",
    EXACT_OUT: "EXACT_OUT",
  },
}));

vi.mock("@/src/hooks", () => ({
  useRoutablePools: vi.fn(),
  useReadonlyMira: vi.fn(),
}));

// Now import the components after mocking
import {useSwapRouter, SwapRouterCacheOptions} from "../useSwapRouter";
import {TradeType} from "../get-swap-quotes-batch";
import {useReadonlyMira} from "@/src/hooks";
import {useRoutablePools} from "@/src/hooks";
import {getSwapQuotesBatch} from "../get-swap-quotes-batch";
import {bn} from "fuels";

const mockAmm = {
  preloadPoolsForRoutes: vi.fn().mockResolvedValue(undefined),
};

// Mock coin data
const mockAssetIn = {
  assetId: "asset-in-id",
  name: "Asset In",
  symbol: "AIN",
  decimals: 9,
  icon: "",
};

const mockAssetOut = {
  assetId: "asset-out-id",
  name: "Asset Out",
  symbol: "AOUT",
  decimals: 9,
  icon: "",
};

const mockRoutes = [
  {
    pools: [{poolId: [{bits: "pool1-asset1"}, {bits: "pool1-asset2"}, false]}],
    assetIn: mockAssetIn,
    assetOut: mockAssetOut,
  },
];

describe("useSwapRouter with caching", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.mocked(useReadonlyMira).mockReturnValue(mockAmm);
    vi.mocked(useRoutablePools).mockReturnValue({
      routes: mockRoutes,
      isLoading: false,
      isRefetching: false,
    });
    vi.mocked(getSwapQuotesBatch).mockResolvedValue([]);

    vi.clearAllMocks();
  });

  const wrapper = ({children}: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should accept cache options parameter", () => {
    const cacheOptions: SwapRouterCacheOptions = {
      enableCaching: true,
      poolDataTTL: 60000,
      refreshInterval: 120000,
      preloadOnRouteChange: true,
    };

    const {result} = renderHook(
      () =>
        useSwapRouter(
          TradeType.EXACT_IN,
          bn(1000),
          mockAssetIn,
          mockAssetOut,
          cacheOptions
        ),
      {wrapper}
    );

    expect(result.current.tradeState).toBeDefined();
  });

  it("should work without cache options (backward compatibility)", () => {
    const {result} = renderHook(
      () =>
        useSwapRouter(TradeType.EXACT_IN, bn(1000), mockAssetIn, mockAssetOut),
      {wrapper}
    );

    expect(result.current.tradeState).toBeDefined();
  });

  it("should pass cache options to getSwapQuotesBatch when caching is enabled", async () => {
    const cacheOptions: SwapRouterCacheOptions = {
      enableCaching: true,
      poolDataTTL: 60000,
    };

    renderHook(
      () =>
        useSwapRouter(
          TradeType.EXACT_IN,
          bn(1000),
          mockAssetIn,
          mockAssetOut,
          cacheOptions
        ),
      {wrapper}
    );

    // Wait for the query to be called
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getSwapQuotesBatch).toHaveBeenCalledWith(
      expect.any(Object), // amount
      TradeType.EXACT_IN,
      mockRoutes,
      mockAmm,
      expect.objectContaining({
        useCache: true,
        preloadPools: true,
        cacheTTL: 60000,
        refreshStaleData: true,
      })
    );
  });

  it("should call preloadPoolsForRoutes when routes change and caching is enabled", async () => {
    const cacheOptions: SwapRouterCacheOptions = {
      enableCaching: true,
      preloadOnRouteChange: true,
    };

    renderHook(
      () =>
        useSwapRouter(
          TradeType.EXACT_IN,
          bn(1000),
          mockAssetIn,
          mockAssetOut,
          cacheOptions
        ),
      {wrapper}
    );

    // Wait for effects to run
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockAmm.preloadPoolsForRoutes).toHaveBeenCalledWith(
      [mockRoutes[0].pools.map((pool) => pool.poolId)],
      expect.objectContaining({
        useCache: true,
        preloadPools: true,
      })
    );
  });

  it("should not call preloadPoolsForRoutes when caching is disabled", async () => {
    const cacheOptions: SwapRouterCacheOptions = {
      enableCaching: false,
    };

    renderHook(
      () =>
        useSwapRouter(
          TradeType.EXACT_IN,
          bn(1000),
          mockAssetIn,
          mockAssetOut,
          cacheOptions
        ),
      {wrapper}
    );

    // Wait for effects to run
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockAmm.preloadPoolsForRoutes).not.toHaveBeenCalled();
  });

  it("should handle preloading errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockAmm.preloadPoolsForRoutes.mockRejectedValueOnce(
      new Error("Preload failed")
    );

    const cacheOptions: SwapRouterCacheOptions = {
      enableCaching: true,
      preloadOnRouteChange: true,
    };

    renderHook(
      () =>
        useSwapRouter(
          TradeType.EXACT_IN,
          bn(1000),
          mockAssetIn,
          mockAssetOut,
          cacheOptions
        ),
      {wrapper}
    );

    // Wait for effects to run
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to preload pools:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});

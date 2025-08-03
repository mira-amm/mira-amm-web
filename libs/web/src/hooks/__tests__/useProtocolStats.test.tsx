import React, {ReactNode} from "react";
import {renderHook, waitFor} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {useProtocolStats} from "../useProtocolStats";
import type {ProtocolStatsData} from "@/src/types/protocol-stats";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock data for testing
const mockProtocolStats: ProtocolStatsData = {
  allTimeVolume: 1000000,
  totalTVL: 500000,
  oneDayVolume: 50000,
  sevenDayVolume: 200000,
};

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
        gcTime: 0, // Disable caching for tests
      },
    },
  });

  return function Wrapper({children}: {children: ReactNode}) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useProtocolStats", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch protocol stats successfully", async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProtocolStats,
    });

    const wrapper = createWrapper();
    const {result} = renderHook(() => useProtocolStats(), {wrapper});

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isError).toBe(false);

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check successful result
    expect(result.current.data).toEqual(mockProtocolStats);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith("/api/protocol-stats");
  });

  it("should handle API errors correctly", async () => {
    const errorMessage = "Failed to fetch protocol stats";

    // Mock API error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: "API Error",
        message: errorMessage,
      }),
    });

    const wrapper = createWrapper();
    const {result} = renderHook(() => useProtocolStats(), {wrapper});

    // Wait for the query to complete
    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      {timeout: 3000}
    );

    // Check error state
    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle network errors correctly", async () => {
    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const wrapper = createWrapper();
    const {result} = renderHook(() => useProtocolStats(), {wrapper});

    // Wait for the query to complete
    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      {timeout: 3000}
    );

    // Check error state
    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toBe("Network error");
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should provide refetch functionality", async () => {
    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProtocolStats,
    });

    const wrapper = createWrapper();
    const {result} = renderHook(() => useProtocolStats(), {wrapper});

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear mock calls
    mockFetch.mockClear();

    // Call refetch
    result.current.refetch();

    // Wait for refetch to complete
    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    // Verify refetch was called
    expect(mockFetch).toHaveBeenCalledWith("/api/protocol-stats");
  });

  it("should have correct query configuration", async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProtocolStats,
    });

    const wrapper = createWrapper();
    const {result} = renderHook(() => useProtocolStats(), {wrapper});

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that the hook returns all expected properties
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("isError");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("refetch");
    expect(result.current).toHaveProperty("isFetching");

    // Check that refetch is a function
    expect(typeof result.current.refetch).toBe("function");
  });

  it("should handle malformed API response", async () => {
    // Mock API response with invalid JSON
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    const wrapper = createWrapper();
    const {result} = renderHook(() => useProtocolStats(), {wrapper});

    // Wait for the query to complete
    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      {timeout: 3000}
    );

    // Check error state
    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toBe("Invalid JSON");
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle API response without error message", async () => {
    // Mock API error response without message
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: "API Error",
        // No message field
      }),
    });

    const wrapper = createWrapper();
    const {result} = renderHook(() => useProtocolStats(), {wrapper});

    // Wait for the query to complete
    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      {timeout: 3000}
    );

    // Check error state with fallback message
    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toBe(
      "Failed to fetch protocol stats"
    );
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});

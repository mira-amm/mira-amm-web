import React from "react";
import {render, screen, fireEvent} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {vi} from "vitest";
import {ProtocolStatsContainer} from "../ProtocolStatsContainer";
import {useProtocolStats} from "../../../../hooks/useProtocolStats";

// Mock the useProtocolStats hook
vi.mock("../../../../hooks/useProtocolStats");
const mockUseProtocolStats = vi.mocked(useProtocolStats);

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Test wrapper with QueryClient
function TestWrapper({children}: {children: React.ReactNode}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("ProtocolStats Error Handling Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays error state when TanStack Query fails", () => {
    const mockRefetch = vi.fn();
    const mockError = new Error("API request failed");

    mockUseProtocolStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
      refetch: mockRefetch,
      isFetching: false,
    } as any);

    render(
      <TestWrapper>
        <ProtocolStatsContainer />
      </TestWrapper>
    );

    // Should show error message
    expect(screen.getByText("Failed to load protocol statistics")).toBeTruthy();
    expect(screen.getByText("API request failed")).toBeTruthy();

    // Should have retry button
    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeTruthy();

    // Test retry functionality
    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("shows error stat cards with proper layout", () => {
    const mockError = new Error("Network error");

    mockUseProtocolStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    render(
      <TestWrapper>
        <ProtocolStatsContainer />
      </TestWrapper>
    );

    // Should show all four stat titles even in error state
    expect(screen.getByText("All time volume")).toBeTruthy();
    expect(screen.getByText("Total TVL")).toBeTruthy();
    expect(screen.getByText("1D Volume")).toBeTruthy();
    expect(screen.getByText("7D Volume")).toBeTruthy();

    // Should show placeholder values
    const placeholders = screen.getAllByText("--");
    expect(placeholders.length).toBe(4);
  });

  it("handles error boundary with custom error handler", () => {
    const onError = vi.fn();

    // Mock a successful state to test that error boundary is properly set up
    mockUseProtocolStats.mockReturnValue({
      data: {
        allTimeVolume: 1000000,
        totalTVL: 500000,
        oneDayVolume: 50000,
        sevenDayVolume: 200000,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    render(
      <TestWrapper>
        <ProtocolStatsContainer onError={onError} />
      </TestWrapper>
    );

    // Should show successful data, not error state
    expect(
      screen.queryByText("Failed to load protocol statistics")
    ).toBeFalsy();
    expect(screen.getByText("All time volume")).toBeTruthy();
  });

  it("maintains proper styling in error state", () => {
    const mockError = new Error("Styling test error");

    mockUseProtocolStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    const {container} = render(
      <TestWrapper>
        <ProtocolStatsContainer className="custom-stats-class" />
      </TestWrapper>
    );

    // Should maintain the flexbox layout
    const flexContainer = container.querySelector(
      ".flex.flex-col.md\\:flex-row"
    );
    expect(flexContainer).toBeTruthy();

    // Should apply custom className
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("custom-stats-class");
  });
});

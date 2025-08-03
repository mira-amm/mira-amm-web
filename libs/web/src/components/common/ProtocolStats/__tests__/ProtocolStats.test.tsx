import React from "react";
import {render, screen, fireEvent} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {vi} from "vitest";
import {ProtocolStats} from "../ProtocolStats";
import {useProtocolStats} from "../../../../hooks/useProtocolStats";
import type {ProtocolStatsData} from "../../../../types/protocol-stats";

// Mock the useProtocolStats hook
vi.mock("../../../../hooks/useProtocolStats");
const mockUseProtocolStats = vi.mocked(useProtocolStats);

const mockStatsData: ProtocolStatsData = {
  allTimeVolume: 123456789.12,
  totalTVL: 45678901.23,
  oneDayVolume: 1234567.89,
  sevenDayVolume: 8765432.1,
};

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

describe("ProtocolStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all four stat cards with correct titles when data is loaded", () => {
    mockUseProtocolStats.mockReturnValue({
      data: mockStatsData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    render(
      <TestWrapper>
        <ProtocolStats />
      </TestWrapper>
    );

    expect(screen.getByText("All time volume")).toBeTruthy();
    expect(screen.getByText("Total TVL")).toBeTruthy();
    expect(screen.getByText("1D Volume")).toBeTruthy();
    expect(screen.getByText("7D Volume")).toBeTruthy();
  });

  it("displays formatted values correctly when data is loaded", () => {
    mockUseProtocolStats.mockReturnValue({
      data: mockStatsData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    render(
      <TestWrapper>
        <ProtocolStats />
      </TestWrapper>
    );

    expect(screen.getByText("$123.46M")).toBeTruthy(); // allTimeVolume
    expect(screen.getByText("$45.68M")).toBeTruthy(); // totalTVL
    expect(screen.getByText("$1.23M")).toBeTruthy(); // oneDayVolume
    expect(screen.getByText("$8.77M")).toBeTruthy(); // sevenDayVolume
  });

  it("shows loading skeletons when data is loading", () => {
    mockUseProtocolStats.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: true,
    } as any);

    render(
      <TestWrapper>
        <ProtocolStats />
      </TestWrapper>
    );

    // Check that titles are still shown
    expect(screen.getByText("All time volume")).toBeTruthy();
    expect(screen.getByText("Total TVL")).toBeTruthy();
    expect(screen.getByText("1D Volume")).toBeTruthy();
    expect(screen.getByText("7D Volume")).toBeTruthy();

    // Check that loading skeletons are present
    const skeletons = screen.getAllByRole("generic", {hidden: true});
    const loadingSkeletons = skeletons.filter((el) =>
      el.className.includes("animate-pulse")
    );
    expect(loadingSkeletons.length).toBeGreaterThan(0);
  });

  it("shows error state with retry button when there is an error", () => {
    const mockRefetch = vi.fn();
    const mockError = new Error("Failed to fetch data");

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
        <ProtocolStats />
      </TestWrapper>
    );

    expect(screen.getByText("Failed to load protocol statistics")).toBeTruthy();
    expect(screen.getByText("Failed to fetch data")).toBeTruthy();

    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeTruthy();

    // Test retry functionality
    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders with flexbox layout", () => {
    mockUseProtocolStats.mockReturnValue({
      data: mockStatsData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    const {container} = render(
      <TestWrapper>
        <ProtocolStats />
      </TestWrapper>
    );

    const flexContainer = container.querySelector(
      ".flex.flex-col.md\\:flex-row"
    );
    expect(flexContainer).toBeTruthy();
  });

  it("applies custom className when provided", () => {
    mockUseProtocolStats.mockReturnValue({
      data: mockStatsData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    const {container} = render(
      <TestWrapper>
        <ProtocolStats className="custom-class" />
      </TestWrapper>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("custom-class");
  });
});

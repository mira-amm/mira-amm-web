import React from "react";
import {render} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {vi} from "vitest";
import {ProtocolStatsContainer} from "../ProtocolStatsContainer";
import {useProtocolStats} from "../../../../hooks/useProtocolStats";

// Mock the useProtocolStats hook
vi.mock("../../../../hooks/useProtocolStats");
const mockUseProtocolStats = vi.mocked(useProtocolStats);

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

describe("ProtocolStatsContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the ProtocolStats component wrapped in error boundary", () => {
    mockUseProtocolStats.mockReturnValue({
      data: {
        allTimeVolume: 123456789.12,
        totalTVL: 45678901.23,
        oneDayVolume: 1234567.89,
        sevenDayVolume: 8765432.1,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    const {container} = render(
      <TestWrapper>
        <ProtocolStatsContainer />
      </TestWrapper>
    );

    // Should render the stats component
    expect(
      container.querySelector(".flex.flex-col.md\\:flex-row")
    ).toBeTruthy();
  });

  it("applies custom className", () => {
    mockUseProtocolStats.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: true,
    } as any);

    const {container} = render(
      <TestWrapper>
        <ProtocolStatsContainer className="custom-container-class" />
      </TestWrapper>
    );

    const wrapper = container.querySelector(".custom-container-class");
    expect(wrapper).toBeTruthy();
  });

  it("handles error boundary protection", () => {
    // Mock console.error to avoid noise in tests
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockUseProtocolStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    render(
      <TestWrapper>
        <ProtocolStatsContainer />
      </TestWrapper>
    );

    // Component should render without throwing
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

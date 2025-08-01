import React from "react";
import {render, screen, fireEvent} from "@testing-library/react";
import {vi} from "vitest";
import {ProtocolStatsContainer} from "../ProtocolStatsContainer";
import type {ProtocolStatsData} from "../../../../types/protocol-stats";

const mockStatsData: ProtocolStatsData = {
  allTimeVolume: 123456789.12,
  totalTVL: 45678901.23,
  oneDayVolume: 1234567.89,
  sevenDayVolume: 8765432.1,
};

describe("ProtocolStatsContainer", () => {
  it("renders loading state when isLoading is true and no data", () => {
    render(<ProtocolStatsContainer isLoading={true} />);

    // Should show skeleton loading
    expect(document.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("renders error state when error exists and no data", () => {
    const mockError = new Error("Failed to fetch data");
    const mockRetry = vi.fn();

    render(<ProtocolStatsContainer error={mockError} onRetry={mockRetry} />);

    expect(screen.getByText("Failed to load protocol statistics")).toBeTruthy();
    expect(screen.getByText("Failed to fetch data")).toBeTruthy();

    const retryButton = screen.getByText("Retry");
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("renders success state with data", () => {
    render(
      <ProtocolStatsContainer
        data={mockStatsData}
        lastUpdated={new Date("2024-01-01T12:00:00Z")}
      />
    );

    expect(screen.getByText("All time volume")).toBeTruthy();
    expect(screen.getByText("$123.46M")).toBeTruthy();
  });

  it("renders success state with data regardless of stale flag", () => {
    render(
      <ProtocolStatsContainer
        data={mockStatsData}
        lastUpdated={new Date("2024-01-01T12:00:00Z")}
        isStale={true}
      />
    );

    expect(screen.getByText("All time volume")).toBeTruthy();
    expect(screen.getByText("$123.46M")).toBeTruthy();
  });

  it("shows data even when there is an error (stale data scenario)", () => {
    const mockError = new Error("Network error");

    render(
      <ProtocolStatsContainer
        data={mockStatsData}
        lastUpdated={new Date("2024-01-01T12:00:00Z")}
        error={mockError}
        isStale={true}
      />
    );

    // Should show the data, not the error state
    expect(screen.getByText("All time volume")).toBeTruthy();
    expect(screen.getByText("$123.46M")).toBeTruthy();
    expect(screen.queryByText("Failed to load protocol statistics")).toBeNull();
  });

  it("renders loading state as fallback when no props provided", () => {
    render(<ProtocolStatsContainer />);

    expect(document.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("applies custom className", () => {
    const {container} = render(
      <ProtocolStatsContainer
        className="custom-container-class"
        isLoading={true}
      />
    );

    expect(
      container.firstChild?.classList.contains("custom-container-class")
    ).toBe(true);
  });
});

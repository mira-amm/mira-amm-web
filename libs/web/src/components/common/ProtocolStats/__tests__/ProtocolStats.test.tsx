import React from "react";
import {render, screen} from "@testing-library/react";
import {ProtocolStats} from "../ProtocolStats";
import type {ProtocolStatsData} from "../../../../types/protocol-stats";

const mockStatsData: ProtocolStatsData = {
  allTimeVolume: 123456789.12,
  totalTVL: 45678901.23,
  oneDayVolume: 1234567.89,
  sevenDayVolume: 8765432.1,
};

describe("ProtocolStats", () => {
  it("renders all four stat cards with correct titles", () => {
    render(
      <ProtocolStats
        stats={mockStatsData}
        lastUpdated={new Date("2024-01-01T12:00:00Z")}
      />
    );

    expect(screen.getByText("All Time Volume")).toBeTruthy();
    expect(screen.getByText("Total TVL")).toBeTruthy();
    expect(screen.getByText("24H Volume")).toBeTruthy();
    expect(screen.getByText("7D Volume")).toBeTruthy();
  });

  it("displays formatted values correctly", () => {
    render(
      <ProtocolStats
        stats={mockStatsData}
        lastUpdated={new Date("2024-01-01T12:00:00Z")}
      />
    );

    expect(screen.getByText("$123.46M")).toBeTruthy(); // allTimeVolume
    expect(screen.getByText("$45.68M")).toBeTruthy(); // totalTVL
    expect(screen.getByText("$1.23M")).toBeTruthy(); // oneDayVolume
    expect(screen.getByText("$8.77M")).toBeTruthy(); // sevenDayVolume
  });

  it("shows last updated time", () => {
    const lastUpdated = new Date("2024-01-01T12:00:00Z");
    render(<ProtocolStats stats={mockStatsData} lastUpdated={lastUpdated} />);

    expect(screen.getByText(/Last updated:/)).toBeTruthy();
  });

  it("displays stale data indicator when isStale is true", () => {
    render(
      <ProtocolStats
        stats={mockStatsData}
        lastUpdated={new Date("2024-01-01T12:00:00Z")}
        isStale={true}
      />
    );

    expect(screen.getByText("Stale Data")).toBeTruthy();
  });

  it("does not show stale data indicator when isStale is false", () => {
    render(
      <ProtocolStats
        stats={mockStatsData}
        lastUpdated={new Date("2024-01-01T12:00:00Z")}
        isStale={false}
      />
    );

    expect(screen.queryByText("Stale Data")).toBeNull();
  });

  it("renders component title", () => {
    render(
      <ProtocolStats
        stats={mockStatsData}
        lastUpdated={new Date("2024-01-01T12:00:00Z")}
      />
    );

    expect(screen.getByText("Protocol Statistics")).toBeTruthy();
  });
});

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
    render(<ProtocolStats stats={mockStatsData} />);

    expect(screen.getByText("All time volume")).toBeTruthy();
    expect(screen.getByText("Total TVL")).toBeTruthy();
    expect(screen.getByText("1D Volume")).toBeTruthy();
    expect(screen.getByText("7D Volume")).toBeTruthy();
  });

  it("displays formatted values correctly", () => {
    render(<ProtocolStats stats={mockStatsData} />);

    expect(screen.getByText("$123.46M")).toBeTruthy(); // allTimeVolume
    expect(screen.getByText("$45.68M")).toBeTruthy(); // totalTVL
    expect(screen.getByText("$1.23M")).toBeTruthy(); // oneDayVolume
    expect(screen.getByText("$8.77M")).toBeTruthy(); // sevenDayVolume
  });

  it("renders with flexbox layout", () => {
    const {container} = render(<ProtocolStats stats={mockStatsData} />);

    const flexContainer = container.querySelector(
      ".flex.flex-col.md\\:flex-row"
    );
    expect(flexContainer).toBeTruthy();
  });
});

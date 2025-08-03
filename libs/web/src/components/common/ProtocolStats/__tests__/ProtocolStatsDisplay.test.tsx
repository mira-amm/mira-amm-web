import React from "react";
import {render, screen} from "@testing-library/react";
import {ProtocolStatsDisplay} from "../ProtocolStatsDisplay";
import type {ProtocolStatsData} from "../../../../types/protocol-stats";

const mockStatsData: ProtocolStatsData = {
  allTimeVolume: 123456789.12,
  totalTVL: 45678901.23,
  oneDayVolume: 1234567.89,
  sevenDayVolume: 8765432.1,
};

describe("ProtocolStatsDisplay", () => {
  it("renders all four stat cards with correct titles", () => {
    render(<ProtocolStatsDisplay stats={mockStatsData} />);

    expect(screen.getByText("All time volume")).toBeTruthy();
    expect(screen.getByText("Total TVL")).toBeTruthy();
    expect(screen.getByText("1D Volume")).toBeTruthy();
    expect(screen.getByText("7D Volume")).toBeTruthy();
  });

  it("displays formatted values correctly", () => {
    render(<ProtocolStatsDisplay stats={mockStatsData} />);

    expect(screen.getByText("$123.46M")).toBeTruthy(); // allTimeVolume
    expect(screen.getByText("$45.68M")).toBeTruthy(); // totalTVL
    expect(screen.getByText("$1.23M")).toBeTruthy(); // oneDayVolume
    expect(screen.getByText("$8.77M")).toBeTruthy(); // sevenDayVolume
  });

  it("shows loading skeletons when isLoading is true", () => {
    render(<ProtocolStatsDisplay stats={mockStatsData} isLoading={true} />);

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

  it("handles undefined stats gracefully", () => {
    render(<ProtocolStatsDisplay stats={undefined} />);

    // Titles should still be shown
    expect(screen.getByText("All time volume")).toBeTruthy();
    expect(screen.getByText("Total TVL")).toBeTruthy();
    expect(screen.getByText("1D Volume")).toBeTruthy();
    expect(screen.getByText("7D Volume")).toBeTruthy();

    // Values should be empty or show default formatting
    const statCards = screen.getAllByRole("generic");
    expect(statCards.length).toBeGreaterThan(0);
  });

  it("applies custom className when provided", () => {
    const {container} = render(
      <ProtocolStatsDisplay
        stats={mockStatsData}
        className="custom-display-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("custom-display-class");
  });

  it("renders with flexbox layout", () => {
    const {container} = render(<ProtocolStatsDisplay stats={mockStatsData} />);

    const flexContainer = container.querySelector(
      ".flex.flex-col.md\\:flex-row"
    );
    expect(flexContainer).toBeTruthy();
  });
});

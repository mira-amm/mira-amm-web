import React from "react";
import {render, screen} from "@testing-library/react";
import {StatCard} from "../StatCard";
import {expect} from "vitest";
import {it} from "vitest";
import {describe} from "vitest";

describe("StatCard", () => {
  it("renders title and formatted currency value", () => {
    render(
      <StatCard title="Total TVL" value={1234567.89} formatAsCurrency={true} />
    );

    expect(screen.getByText("Total TVL")).toBeTruthy();
    expect(screen.getByText("$1.23M")).toBeTruthy();
  });

  it("renders non-currency values correctly", () => {
    render(
      <StatCard title="Active Pools" value={42} formatAsCurrency={false} />
    );

    expect(screen.getByText("Active Pools")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
  });

  it("handles large numbers with compact notation for non-currency", () => {
    render(
      <StatCard
        title="Total Transactions"
        value={1500000}
        formatAsCurrency={false}
      />
    );

    expect(screen.getByText("1.5M")).toBeTruthy();
  });

  it("handles zero values", () => {
    render(<StatCard title="New Pools" value={0} formatAsCurrency={true} />);

    expect(screen.getByText("$0.00")).toBeTruthy();
  });

  it("applies custom className", () => {
    const {container} = render(
      <StatCard title="Test" value={100} className="custom-class" />
    );

    expect(container.firstChild?.className).toContain("custom-class");
  });

  it("handles very large currency values with scientific notation", () => {
    render(
      <StatCard title="Massive Volume" value={1e18} formatAsCurrency={true} />
    );

    // Should use scientific notation for very large numbers
    const valueElement = screen.getByText("$1.000000E18");
    expect(valueElement).toBeTruthy();
  });
});

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

  describe("Loading States", () => {
    it("displays loading skeleton when isLoading is true", () => {
      render(
        <StatCard title="Total TVL" value={1234567.89} isLoading={true} />
      );

      expect(screen.getByText("Total TVL")).toBeTruthy();

      // Check for loading skeleton
      const skeleton = document.querySelector(".animate-pulse");
      expect(skeleton).toBeTruthy();
      expect(skeleton?.className).toContain("bg-gray-200");
      expect(skeleton?.className).toContain("h-[25.23px]");
      expect(skeleton?.className).toContain("w-20");
      expect(skeleton?.className).toContain("rounded");
    });

    it("does not display value when isLoading is true", () => {
      render(
        <StatCard title="Total TVL" value={1234567.89} isLoading={true} />
      );

      // Value should not be displayed during loading
      expect(screen.queryByText("$1.23M")).toBeFalsy();
    });

    it("handles undefined value gracefully", () => {
      render(<StatCard title="Total TVL" value={undefined} />);

      expect(screen.getByText("Total TVL")).toBeTruthy();
      // Should not crash and should not display any value
      expect(screen.queryByText("$")).toBeFalsy();
    });

    it("handles undefined value with loading state", () => {
      render(<StatCard title="Total TVL" value={undefined} isLoading={true} />);

      expect(screen.getByText("Total TVL")).toBeTruthy();

      // Should show loading skeleton
      const skeleton = document.querySelector(".animate-pulse");
      expect(skeleton).toBeTruthy();
    });

    it("transitions from loading to loaded state", () => {
      const {rerender} = render(
        <StatCard title="Total TVL" value={1234567.89} isLoading={true} />
      );

      // Initially should show loading skeleton
      expect(document.querySelector(".animate-pulse")).toBeTruthy();
      expect(screen.queryByText("$1.23M")).toBeFalsy();

      // After rerender with isLoading=false, should show value
      rerender(
        <StatCard title="Total TVL" value={1234567.89} isLoading={false} />
      );

      expect(document.querySelector(".animate-pulse")).toBeFalsy();
      expect(screen.getByText("$1.23M")).toBeTruthy();
    });

    it("preserves existing styles during loading", () => {
      const {container} = render(
        <StatCard
          title="Total TVL"
          value={1234567.89}
          isLoading={true}
          className="custom-class"
        />
      );

      // Container should preserve custom class
      expect(container.firstChild?.className).toContain("custom-class");
      expect(container.firstChild?.className).toContain(
        "flex flex-col gap-4 md:w-[206px]"
      );

      // Title should preserve styles
      const title = screen.getByText("Total TVL");
      expect(title.className).toContain(
        "text-gray-500 font-medium text-[17.72px] leading-none"
      );
    });
  });
});

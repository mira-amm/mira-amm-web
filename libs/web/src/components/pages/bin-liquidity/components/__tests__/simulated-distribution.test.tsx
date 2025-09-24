import React from "react";
import {render} from "@testing-library/react";
import {describe, it, expect} from "vitest";
import SimulatedDistribution from "../simulated-distribution";

function extractPriceRanges(container: HTMLElement) {
  const bars = Array.from(
    container.querySelectorAll("[title]")
  ) as HTMLDivElement[];
  // Titles are of form: "Price Range: <start> - <end>\n..."
  const ranges = bars
    .map((el) => el.getAttribute("title") || "")
    .map((t) => {
      const match = t.match(/Price Range: ([0-9.]+) - ([0-9.]+)/);
      if (!match) return null;
      return [parseFloat(match[1]), parseFloat(match[2])] as [number, number];
    })
    .filter(Boolean) as [number, number][];
  return ranges;
}

describe("SimulatedDistribution", () => {
  it("center bar range contains current price", () => {
    const minPrice = 100;
    const maxPrice = 200;
    const currentPrice = 150;
    const numBins = 101; // will be grouped to <= 50 in the component

    const {container} = render(
      <SimulatedDistribution
        liquidityShape="curve"
        minPrice={minPrice}
        maxPrice={maxPrice}
        currentPrice={currentPrice}
      />
    );

    const ranges = extractPriceRanges(container);
    expect(ranges.length).toBeGreaterThan(0);

    // Find the bar whose start is closest to currentPrice
    const closest = ranges.reduce((prev, cur) => {
      const prevDist = Math.abs((prev[0] + prev[1]) / 2 - currentPrice);
      const curDist = Math.abs((cur[0] + cur[1]) / 2 - currentPrice);
      return curDist < prevDist ? cur : prev;
    });

    expect(closest[0]).toBeLessThanOrEqual(currentPrice);
    expect(closest[1]).toBeGreaterThanOrEqual(currentPrice);
  });

  it("last bar ends exactly at maxPrice and first starts at minPrice", () => {
    const minPrice = 120;
    const maxPrice = 180;
    const currentPrice = 150;
    const numBins = 77;

    const {container} = render(
      <SimulatedDistribution
        liquidityShape="curve"
        minPrice={minPrice}
        maxPrice={maxPrice}
        currentPrice={currentPrice}
      />
    );

    const ranges = extractPriceRanges(container);
    expect(ranges.length).toBeGreaterThan(0);

    const first = ranges[0];
    const last = ranges[ranges.length - 1];

    // Allow tiny floating point differences
    const EPS = 1e-9;
    expect(Math.abs(first[0] - minPrice)).toBeLessThan(EPS);
    expect(Math.abs(last[1] - maxPrice)).toBeLessThan(EPS);
  });
});

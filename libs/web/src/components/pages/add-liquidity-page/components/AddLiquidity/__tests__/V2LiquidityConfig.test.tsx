import {render, screen, fireEvent} from "@testing-library/react";
import V2LiquidityConfig from "../V2LiquidityConfig";
import {expect} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {expect} from "vitest";
import {it} from "vitest";
import {beforeEach} from "vitest";
import {describe} from "vitest";

// Mock the dependencies
jest.mock("@/src/components/pages/bin-liquidity/trade-utils", () => ({
  TradeUtils: {
    calculateBinsFromPrices: jest.fn((minPrice, maxPrice, binStep) => {
      // Simple mock calculation
      return Math.max(1, Math.floor((maxPrice - minPrice) * 10));
    }),
    calculateMaxPriceFromBins: jest.fn((minPrice, binStep, numBins) => {
      // Simple mock calculation
      return minPrice + numBins * 0.1;
    }),
    calculateLiquidityBook: jest.fn(() => ({
      numberOfBins: 5,
      currentBinId: 10,
      actualMinPrice: 0.8,
      actualMaxPrice: 1.2,
    })),
  },
}));

jest.mock(
  "@/src/components/pages/bin-liquidity/components/double-slider",
  () => {
    return function MockDoubleSlider({value, onValueChange}: any) {
      return (
        <div data-testid="double-slider">
          <input
            data-testid="min-slider"
            type="range"
            value={value[0]}
            onChange={(e) =>
              onValueChange([parseFloat(e.target.value), value[1]])
            }
          />
          <input
            data-testid="max-slider"
            type="range"
            value={value[1]}
            onChange={(e) =>
              onValueChange([value[0], parseFloat(e.target.value)])
            }
          />
        </div>
      );
    };
  }
);

jest.mock(
  "@/src/components/pages/bin-liquidity/components/liquidity-shape",
  () => {
    return function MockLiquidityShapeSelector({
      liquidityShape,
      setLiquidityShape,
    }: any) {
      return (
        <div data-testid="liquidity-shape-selector">
          <button onClick={() => setLiquidityShape("spot")}>Spot</button>
          <button onClick={() => setLiquidityShape("curve")}>Curve</button>
          <button onClick={() => setLiquidityShape("bidask")}>Bid-Ask</button>
        </div>
      );
    };
  }
);

jest.mock(
  "@/src/components/pages/bin-liquidity/components/simulated-distribution",
  () => {
    return function MockSimulatedDistribution() {
      return <div data-testid="simulated-distribution">Distribution Chart</div>;
    };
  }
);

describe("V2LiquidityConfig", () => {
  const mockAssetMetadata = {
    name: "Test Token",
    symbol: "TEST",
    decimals: 18,
    isLoading: false,
  };

  const mockOnConfigChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all main sections", () => {
    render(
      <V2LiquidityConfig
        asset0Metadata={mockAssetMetadata}
        asset1Metadata={mockAssetMetadata}
        onConfigChange={mockOnConfigChange}
      />
    );

    expect(
      screen.getByText("Liquidity Distribution Strategy")
    ).toBeInTheDocument();
    expect(screen.getByText("Price Range")).toBeInTheDocument();
    expect(
      screen.getByText("Liquidity Distribution Preview")
    ).toBeInTheDocument();
  });

  it("updates number of bins when input changes", () => {
    render(
      <V2LiquidityConfig
        asset0Metadata={mockAssetMetadata}
        asset1Metadata={mockAssetMetadata}
        onConfigChange={mockOnConfigChange}
      />
    );

    const binsInput = screen.getByLabelText("Number of Bins");
    fireEvent.change(binsInput, {target: {value: "10"}});

    expect(binsInput).toHaveValue(10);
  });

  it("updates price range when min/max inputs change", () => {
    render(
      <V2LiquidityConfig
        asset0Metadata={mockAssetMetadata}
        asset1Metadata={mockAssetMetadata}
        onConfigChange={mockOnConfigChange}
      />
    );

    const minPriceInput = screen.getByLabelText("Min price");
    const maxPriceInput = screen.getByLabelText("Max price");

    fireEvent.change(minPriceInput, {target: {value: "0.5"}});
    fireEvent.change(maxPriceInput, {target: {value: "1.5"}});

    expect(minPriceInput).toHaveValue(0.5);
    expect(maxPriceInput).toHaveValue(1.5);
  });

  it("calls onConfigChange when configuration updates", () => {
    render(
      <V2LiquidityConfig
        asset0Metadata={mockAssetMetadata}
        asset1Metadata={mockAssetMetadata}
        onConfigChange={mockOnConfigChange}
      />
    );

    // Should be called on initial render
    expect(mockOnConfigChange).toHaveBeenCalled();

    const binsInput = screen.getByLabelText("Number of Bins");
    fireEvent.change(binsInput, {target: {value: "7"}});

    // Should be called again after change
    expect(mockOnConfigChange).toHaveBeenCalledTimes(2);
  });

  it("resets price range when reset button is clicked", () => {
    render(
      <V2LiquidityConfig
        asset0Metadata={mockAssetMetadata}
        asset1Metadata={mockAssetMetadata}
        onConfigChange={mockOnConfigChange}
      />
    );

    const resetButton = screen.getByText("Reset to default range");
    fireEvent.click(resetButton);

    const minPriceInput = screen.getByLabelText("Min price");
    const maxPriceInput = screen.getByLabelText("Max price");

    expect(minPriceInput).toHaveValue(0.8);
    expect(maxPriceInput).toHaveValue(1.2);
  });

  it("passes correct configuration data to onConfigChange callback", () => {
    render(
      <V2LiquidityConfig
        asset0Metadata={mockAssetMetadata}
        asset1Metadata={mockAssetMetadata}
        onConfigChange={mockOnConfigChange}
      />
    );

    // Check that the callback receives the expected configuration structure
    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        liquidityShape: expect.any(String),
        priceRange: expect.any(Array),
        numBins: expect.any(Number),
        binResults: expect.anything(),
        liquidityDistribution: expect.anything(),
      })
    );
  });

  it("updates liquidity distribution when inputs change", () => {
    render(
      <V2LiquidityConfig
        asset0Metadata={mockAssetMetadata}
        asset1Metadata={mockAssetMetadata}
        onConfigChange={mockOnConfigChange}
      />
    );

    // Change liquidity shape
    const spotButton = screen.getByText("Spot");
    fireEvent.click(spotButton);

    // Change number of bins
    const binsInput = screen.getByLabelText("Number of Bins");
    fireEvent.change(binsInput, {target: {value: "5"}});

    // Verify that onConfigChange was called with updated configuration
    const lastCall =
      mockOnConfigChange.mock.calls[mockOnConfigChange.mock.calls.length - 1];
    const config = lastCall[0];

    expect(config).toMatchObject({
      liquidityShape: expect.any(String),
      priceRange: expect.arrayContaining([
        expect.any(Number),
        expect.any(Number),
      ]),
      numBins: 5,
    });

    // Verify that liquidityDistribution is included (this connects inputs to simulation)
    expect(config.liquidityDistribution).toBeDefined();
  });
});

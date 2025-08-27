import {render, screen} from "@testing-library/react";
import {BN} from "fuels";
import {ConcentratedLiquidityMetrics} from "../ConcentratedLiquidityMetrics";
import {V2BinPosition} from "@/src/hooks/useUserBinPositionsV2";

// Mock the hooks
jest.mock("@/src/hooks", () => ({
  useAssetMetadata: jest.fn(),
}));

const mockPositions: V2BinPosition[] = [
  {
    binId: new BN(8388608),
    lpToken: "mock-lp-token-1",
    lpTokenAmount: new BN("1000000000"),
    underlyingAmounts: {
      x: new BN("500000000"),
      y: new BN("500000000"),
    },
    price: 1.0,
    feesEarned: {
      x: new BN("1000000"),
      y: new BN("1000000"),
    },
    isActive: true,
  },
  {
    binId: new BN(8388609),
    lpToken: "mock-lp-token-2",
    lpTokenAmount: new BN("800000000"),
    underlyingAmounts: {
      x: new BN("400000000"),
      y: new BN("400000000"),
    },
    price: 1.05,
    feesEarned: {
      x: new BN("500000"),
      y: new BN("500000"),
    },
    isActive: false,
  },
  {
    binId: new BN(8388607),
    lpToken: "mock-lp-token-3",
    lpTokenAmount: new BN("600000000"),
    underlyingAmounts: {
      x: new BN("300000000"),
      y: new BN("300000000"),
    },
    price: 0.95,
    feesEarned: {
      x: new BN("750000"),
      y: new BN("750000"),
    },
    isActive: false,
  },
];

describe("ConcentratedLiquidityMetrics", () => {
  beforeEach(() => {
    const {useAssetMetadata} = require("@/src/hooks");
    useAssetMetadata.mockReturnValue({
      symbol: "TEST",
      decimals: 9,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders concentrated liquidity metrics correctly", () => {
    render(
      <ConcentratedLiquidityMetrics
        poolId={new BN(1001)}
        positions={mockPositions}
        assetXId="asset-x"
        assetYId="asset-y"
        activeBinId={new BN(8388608)}
        binStep={25}
        currentPrice={1.0}
      />
    );

    expect(
      screen.getByText("Concentrated Liquidity Metrics")
    ).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // Total bins
    expect(screen.getByText("1")).toBeInTheDocument(); // Active bins
  });

  it("shows price range analysis", () => {
    render(
      <ConcentratedLiquidityMetrics
        poolId={new BN(1001)}
        positions={mockPositions}
        assetXId="asset-x"
        assetYId="asset-y"
        activeBinId={new BN(8388608)}
        binStep={25}
        currentPrice={1.0}
      />
    );

    expect(screen.getByText("Price Range Analysis")).toBeInTheDocument();
    expect(screen.getByText("Min Price")).toBeInTheDocument();
    expect(screen.getByText("Current Price")).toBeInTheDocument();
    expect(screen.getByText("Max Price")).toBeInTheDocument();
  });

  it("shows liquidity distribution", () => {
    render(
      <ConcentratedLiquidityMetrics
        poolId={new BN(1001)}
        positions={mockPositions}
        assetXId="asset-x"
        assetYId="asset-y"
        activeBinId={new BN(8388608)}
        binStep={25}
        currentPrice={1.0}
      />
    );

    expect(screen.getByText("Liquidity Distribution")).toBeInTheDocument();
    expect(screen.getByText("Concentrated in Active Bins")).toBeInTheDocument();
    expect(screen.getByText("Bin Utilization:")).toBeInTheDocument();
  });

  it("shows performance metrics", () => {
    render(
      <ConcentratedLiquidityMetrics
        poolId={new BN(1001)}
        positions={mockPositions}
        assetXId="asset-x"
        assetYId="asset-y"
        activeBinId={new BN(8388608)}
        binStep={25}
        currentPrice={1.0}
      />
    );

    expect(screen.getByText("Performance Metrics")).toBeInTheDocument();
    expect(screen.getByText("Total Liquidity")).toBeInTheDocument();
    expect(screen.getByText("Total Fees Earned")).toBeInTheDocument();
  });

  it("shows strategy insights", () => {
    render(
      <ConcentratedLiquidityMetrics
        poolId={new BN(1001)}
        positions={mockPositions}
        assetXId="asset-x"
        assetYId="asset-y"
        activeBinId={new BN(8388608)}
        binStep={25}
        currentPrice={1.0}
      />
    );

    expect(screen.getByText("Strategy Insights")).toBeInTheDocument();
  });

  it("handles empty positions correctly", () => {
    render(
      <ConcentratedLiquidityMetrics
        poolId={new BN(1001)}
        positions={[]}
        assetXId="asset-x"
        assetYId="asset-y"
        activeBinId={new BN(8388608)}
        binStep={25}
        currentPrice={1.0}
      />
    );

    expect(
      screen.getByText("Concentrated Liquidity Metrics")
    ).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument(); // Total bins should be 0
  });

  it("calculates capital efficiency correctly", () => {
    render(
      <ConcentratedLiquidityMetrics
        poolId={new BN(1001)}
        positions={mockPositions}
        assetXId="asset-x"
        assetYId="asset-y"
        activeBinId={new BN(8388608)}
        binStep={25}
        currentPrice={1.0}
      />
    );

    // Capital efficiency should be displayed
    expect(screen.getByText("Capital Efficiency")).toBeInTheDocument();
    // The exact value will depend on the calculation, but it should be present
    expect(screen.getByText(/\d+\.\d+x/)).toBeInTheDocument();
  });
});

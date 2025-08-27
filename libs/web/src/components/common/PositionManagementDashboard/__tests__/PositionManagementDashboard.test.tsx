import {render, screen, fireEvent} from "@testing-library/react";
import {BN} from "fuels";
import {PositionManagementDashboard} from "../PositionManagementDashboard";
import {V2BinPosition} from "@/src/hooks/useUserBinPositionsV2";

// Mock the hooks
jest.mock("@/src/hooks", () => ({
  useUserBinPositionsV2: jest.fn(),
  usePositionSummaryV2: jest.fn(),
  useAssetMetadata: jest.fn(),
}));

const mockPositions: V2BinPosition[] = [
  {
    binId: new BN(1001),
    lpToken: "mock-lp-token-1001",
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
    binId: new BN(1002),
    lpToken: "mock-lp-token-1002",
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
];

const mockSummary = {
  totalLiquidity: {x: new BN("900000000"), y: new BN("900000000")},
  totalFeesEarned: {x: new BN("1500000"), y: new BN("1500000")},
  totalBins: 2,
  activeBins: 1,
  inactiveBins: 1,
  averagePrice: 1.025,
  priceRange: {min: 1.0, max: 1.05},
};

describe("PositionManagementDashboard", () => {
  beforeEach(() => {
    const {
      useUserBinPositionsV2,
      usePositionSummaryV2,
      useAssetMetadata,
    } = require("@/src/hooks");

    useUserBinPositionsV2.mockReturnValue({
      data: mockPositions,
      isLoading: false,
      error: null,
    });

    usePositionSummaryV2.mockReturnValue(mockSummary);

    useAssetMetadata.mockReturnValue({
      symbol: "TEST",
      decimals: 9,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders dashboard with position data", () => {
    render(
      <PositionManagementDashboard
        poolId={new BN(1001)}
        assetXId="asset-x"
        assetYId="asset-y"
      />
    );

    expect(
      screen.getByText("Position Management Dashboard")
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // Total bins
    expect(screen.getByText("1")).toBeInTheDocument(); // Active bins
  });

  it("shows loading state", () => {
    const {useUserBinPositionsV2} = require("@/src/hooks");
    useUserBinPositionsV2.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(
      <PositionManagementDashboard
        poolId={new BN(1001)}
        assetXId="asset-x"
        assetYId="asset-y"
      />
    );

    expect(
      screen.getByText("Loading position dashboard...")
    ).toBeInTheDocument();
  });

  it("shows error state", () => {
    const {useUserBinPositionsV2} = require("@/src/hooks");
    useUserBinPositionsV2.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Test error"),
    });

    render(
      <PositionManagementDashboard
        poolId={new BN(1001)}
        assetXId="asset-x"
        assetYId="asset-y"
      />
    );

    expect(
      screen.getByText(/Failed to load position dashboard/)
    ).toBeInTheDocument();
  });

  it("shows empty state when no positions", () => {
    const {useUserBinPositionsV2} = require("@/src/hooks");
    useUserBinPositionsV2.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(
      <PositionManagementDashboard
        poolId={new BN(1001)}
        assetXId="asset-x"
        assetYId="asset-y"
      />
    );

    expect(
      screen.getByText("No liquidity positions found")
    ).toBeInTheDocument();
  });

  it("handles sorting by different fields", () => {
    render(
      <PositionManagementDashboard
        poolId={new BN(1001)}
        assetXId="asset-x"
        assetYId="asset-y"
      />
    );

    // Click on Price column header to sort
    const priceHeader = screen.getByText("Price");
    fireEvent.click(priceHeader);

    // Verify positions are displayed (specific order testing would require more complex setup)
    expect(screen.getByText("1001")).toBeInTheDocument();
    expect(screen.getByText("1002")).toBeInTheDocument();
  });

  it("handles bin selection and bulk actions", () => {
    const mockOnAddLiquidity = jest.fn();
    const mockOnRemoveLiquidity = jest.fn();

    render(
      <PositionManagementDashboard
        poolId={new BN(1001)}
        assetXId="asset-x"
        assetYId="asset-y"
        onAddLiquidity={mockOnAddLiquidity}
        onRemoveLiquidity={mockOnRemoveLiquidity}
      />
    );

    // Select a bin
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); // First position checkbox (index 0 is select all)

    // Verify bulk action buttons appear
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("toggles inactive bins visibility", () => {
    render(
      <PositionManagementDashboard
        poolId={new BN(1001)}
        assetXId="asset-x"
        assetYId="asset-y"
      />
    );

    // Find and click the toggle button
    const toggleButton = screen.getByText("Hide Inactive Bins");
    fireEvent.click(toggleButton);

    // Verify button text changes
    expect(screen.getByText("Show Inactive Bins")).toBeInTheDocument();
  });

  it("calls action handlers when buttons are clicked", () => {
    const mockOnAddLiquidity = jest.fn();
    const mockOnRemoveLiquidity = jest.fn();

    render(
      <PositionManagementDashboard
        poolId={new BN(1001)}
        assetXId="asset-x"
        assetYId="asset-y"
        onAddLiquidity={mockOnAddLiquidity}
        onRemoveLiquidity={mockOnRemoveLiquidity}
      />
    );

    // Click on individual Add button
    const addButtons = screen.getAllByText("Add");
    fireEvent.click(addButtons[0]);

    expect(mockOnAddLiquidity).toHaveBeenCalledWith(new BN(1001));

    // Click on individual Remove button
    const removeButtons = screen.getAllByText("Remove");
    fireEvent.click(removeButtons[0]);

    expect(mockOnRemoveLiquidity).toHaveBeenCalledWith(new BN(1001));
  });
});

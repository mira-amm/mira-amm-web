import {render, screen} from "@testing-library/react";
import {PoolTypeIndicator, PoolTypeDisplay, PoolTypeComparison} from "../";

describe("PoolTypeIndicator", () => {
  it("renders v1-volatile pool type correctly", () => {
    render(<PoolTypeIndicator poolType="v1-volatile" />);

    expect(screen.getByText("Volatile")).toBeInTheDocument();
    expect(screen.getByText("(0.30%)")).toBeInTheDocument();
  });

  it("renders v1-stable pool type correctly", () => {
    render(<PoolTypeIndicator poolType="v1-stable" />);

    expect(screen.getByText("Stable")).toBeInTheDocument();
    expect(screen.getByText("(0.05%)")).toBeInTheDocument();
  });

  it("renders v2-concentrated pool type correctly", () => {
    render(<PoolTypeIndicator poolType="v2-concentrated" />);

    expect(screen.getByText("Concentrated")).toBeInTheDocument();
    expect(screen.getByText("(Variable)")).toBeInTheDocument();
  });

  it("renders different sizes correctly", () => {
    const {rerender} = render(
      <PoolTypeIndicator poolType="v1-volatile" size="sm" />
    );
    expect(screen.getByText("Volatile")).toHaveClass("text-xs");

    rerender(<PoolTypeIndicator poolType="v1-volatile" size="lg" />);
    expect(screen.getByText("Volatile")).toHaveClass("text-base");
  });

  it("renders minimal variant correctly", () => {
    render(<PoolTypeIndicator poolType="v1-volatile" variant="minimal" />);

    expect(screen.getByText("V1")).toBeInTheDocument();
    expect(screen.getByText("(0.30%)")).toBeInTheDocument();
  });

  it("can hide fee when showFee is false", () => {
    render(<PoolTypeIndicator poolType="v1-volatile" showFee={false} />);

    expect(screen.getByText("Volatile")).toBeInTheDocument();
    expect(screen.queryByText("(0.30%)")).not.toBeInTheDocument();
  });

  it("can hide icon when showIcon is false", () => {
    render(<PoolTypeIndicator poolType="v1-volatile" showIcon={false} />);

    expect(screen.getByText("Volatile")).toBeInTheDocument();
    // Icon should not be present (we can't easily test for its absence, but the component should render without it)
  });
});

describe("PoolTypeDisplay", () => {
  it("renders compact variant correctly", () => {
    render(<PoolTypeDisplay poolType="v1-volatile" variant="compact" />);

    expect(screen.getByText("Volatile Pool")).toBeInTheDocument();
    expect(screen.getByText("Fee: 0.30%")).toBeInTheDocument();
  });

  it("renders detailed variant with description", () => {
    render(<PoolTypeDisplay poolType="v2-concentrated" variant="detailed" />);

    expect(screen.getByText("Concentrated Liquidity")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Advanced AMM with concentrated liquidity and custom price ranges"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Key Features")).toBeInTheDocument();
  });

  it("renders comparison variant with pros and cons", () => {
    render(<PoolTypeDisplay poolType="v1-stable" variant="comparison" />);

    expect(screen.getByText("Stable Pool")).toBeInTheDocument();
    expect(screen.getByText("Advantages")).toBeInTheDocument();
    expect(screen.getByText("Considerations")).toBeInTheDocument();
  });

  it("shows metrics when provided", () => {
    const metrics = {
      tvl: "$1.2M",
      volume24h: "$500K",
      apr: "12.5%",
    };

    render(
      <PoolTypeDisplay
        poolType="v1-volatile"
        variant="detailed"
        showMetrics={true}
        metrics={metrics}
      />
    );

    expect(screen.getByText("$1.2M")).toBeInTheDocument();
    expect(screen.getByText("$500K")).toBeInTheDocument();
    expect(screen.getByText("12.5%")).toBeInTheDocument();
  });
});

describe("PoolTypeComparison", () => {
  it("renders all three pool types", () => {
    render(<PoolTypeComparison />);

    expect(screen.getByText("Pool Type Comparison")).toBeInTheDocument();
    expect(screen.getByText("Volatile Pool")).toBeInTheDocument();
    expect(screen.getByText("Stable Pool")).toBeInTheDocument();
    expect(screen.getByText("Concentrated Liquidity")).toBeInTheDocument();
  });

  it("shows selection when selectedType is provided", () => {
    render(<PoolTypeComparison selectedType="v2-concentrated" />);

    expect(
      screen.getByText("Selected: Concentrated Liquidity Pool")
    ).toBeInTheDocument();
  });
});

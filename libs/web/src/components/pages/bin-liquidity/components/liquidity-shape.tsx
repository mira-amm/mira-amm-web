import {Dispatch} from "react";
import {LiquidityShape} from "./liquidity-manager";

type LiquidityShapeOptionProps = {
  shape: LiquidityShape;
  label: string;
  selected: boolean;
  onClick: () => void;
};

const LiquidityShapeOption = ({
  shape,
  label,
  selected,
  onClick,
}: LiquidityShapeOptionProps) => (
  <div
    className={`flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
      selected
        ? "border-background-primary bg-background-secondary"
        : "border-background-grey-light hover:border-content-tertiary"
    }`}
    onClick={onClick}
  >
    <div className="flex items-end gap-x-1 mb-2 h-12">
      {shape === "spot" && (
        <>
          <div className="w-2 h-2 bg-accent-primary rounded"></div>
          <div className="w-2 h-2 bg-accent-primary rounded"></div>
          <div className="w-2 h-2 bg-accent-primary rounded"></div>
          <div className="w-3 h-12 bg-accent-primary-2 rounded"></div>
          <div className="w-3 h-12 bg-accent-primary-2 rounded"></div>
          <div className="w-3 h-12 bg-accent-primary-2 rounded"></div>
          <div className="w-2 h-2 bg-accent-primary rounded"></div>
          <div className="w-2 h-2 bg-accent-primary rounded"></div>
          <div className="w-2 h-2 bg-accent-primary rounded"></div>
        </>
      )}
      {shape === "curve" && (
        <>
          <div className="w-2 h-2 bg-accent-primary rounded"></div>
          <div className="w-2 h-3 bg-accent-primary rounded"></div>
          <div className="w-2 h-5 bg-accent-primary rounded"></div>
          <div className="w-2 h-8 bg-accent-primary-1 rounded"></div>
          <div className="w-3 h-12 bg-accent-primary-2 rounded"></div>
          <div className="w-3 h-8 bg-accent-primary-1 rounded"></div>
          <div className="w-2 h-5 bg-accent-primary rounded"></div>
          <div className="w-2 h-4 bg-accent-primary rounded"></div>
          <div className="w-2 h-2 bg-accent-primary rounded"></div>
        </>
      )}
      {shape === "bidask" && (
        <>
          <div className="w-3 h-12 bg-accent-primary-2 rounded"></div>
          <div className="w-3 h-10 bg-accent-primary-1 rounded"></div>
          <div className="w-2 h-4 bg-accent-primary-1 rounded"></div>
          <div className="w-2 h-3 bg-accent-primary rounded"></div>
          <div className="w-2 h-2 bg-accent-primary rounded"></div>
          <div className="w-2 h-3 bg-accent-primary rounded"></div>
          <div className="w-2 h-5 bg-accent-primary-1 rounded"></div>
          <div className="w-3 h-10 bg-accent-primary-1 rounded"></div>
          <div className="w-3 h-12 bg-accent-primary-2 rounded"></div>
        </>
      )}
    </div>
    <span className="text-sm ">{label}</span>
  </div>
);

const LiquidityShapeSelector = ({
  liquidityShape,
  setLiquidityShape,
}: {
  liquidityShape: LiquidityShape;
  setLiquidityShape: Dispatch<React.SetStateAction<LiquidityShape>>;
}) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <LiquidityShapeOption
        shape="spot"
        label="Spot"
        selected={liquidityShape === "spot"}
        onClick={() => setLiquidityShape("spot")}
      />
      <LiquidityShapeOption
        shape="curve"
        label="Curve"
        selected={liquidityShape === "curve"}
        onClick={() => setLiquidityShape("curve")}
      />
      <LiquidityShapeOption
        shape="bidask"
        label="Bid-Ask"
        selected={liquidityShape === "bidask"}
        onClick={() => setLiquidityShape("bidask")}
      />
    </div>
  );
};

export default LiquidityShapeSelector;

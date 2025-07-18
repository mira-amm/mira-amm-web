import {Link, RotateCw} from "lucide-react";
import React, {useState, u} from "react";
import {DoubleRangeSlider} from "./double-range-slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/meshwave-ui/select";
import SimulatedDistribution from "./simulated-distribution";

type LiquidityShape = "spot" | "curve" | "bigask";

type SimulationDataPoint = {
  price: string;
  UNI: number;
  ETH: number;
};

type LiquidityShapeOptionProps = {
  shape: LiquidityShape;
  label: string;
  selected: boolean;
  onClick: () => void;
};

type PriceRange = {
  min: number;
  max: number;
};

const LiquidityManager = () => {
  const [liquidityShape, setLiquidityShape] = useState<LiquidityShape>("curve");
  const [minPrice, setMinPrice] = useState<number>(1200);
  const [maxPrice, setMaxPrice] = useState<number>(1600);
  const [numBins, setNumBins] = useState<number>(3);
  const [activeBin, setActiveBin] = useState<string>("1.05200458");

  const resetPrice = (): void => {
    setMinPrice(1200);
    setMaxPrice(1500);
  };

  const LiquidityShapeOption: React.FC<LiquidityShapeOptionProps> = ({
    shape,
    label,
    selected,
    onClick,
  }) => (
    <div
      className={`flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
        selected
          ? "border-background-primary bg-background-secondary"
          : "border-background-grey-light hover:border-content-tertiary"
      }`}
      onClick={onClick}
    >
      <div className="flex items-end space-x-1 mb-2">
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
        {shape === "bigask" && (
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
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-content-primary text-base">Liquidity shape</div>
        <button className="text-accent-primary-2 text-sm flex items-center">
          <Link className="mr-1 size-4" /> Learn more
        </button>
      </div>

      {/* Liquidity Shape Selection */}
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
          shape="bigask"
          label="Big-Ask"
          selected={liquidityShape === "bigask"}
          onClick={() => setLiquidityShape("bigask")}
        />
      </div>

      {/* Price Range Section */}
      <div className="flex flex-col">
        <div className="text-content-primary text-base mb-4">Price range</div>

        {/* Active Bin Display */}
        <div className="bg-background-primary text-page-background mx-auto px-3 py-2 rounded-lg text-sm mb-4 inline-block">
          Active Bin: {activeBin} avUSD per savUSD
        </div>

        {/* Price Range Slider */}
        <div className="mb-6">
          <DoubleRangeSlider
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinChange={setMinPrice}
            onMaxChange={setMaxPrice}
          />
        </div>

        {/* Price Input Fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2">Min price</label>
            <div className="relative">
              <input
                type="number"
                value={minPrice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMinPrice(Number(e.target.value))
                }
                className="w-full p-2 border border-content-tertiary rounded-lg text-sm"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">
                UNI per ETH
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">Max price</label>
            <div className="relative">
              <input
                type="number"
                value={maxPrice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMaxPrice(Number(e.target.value))
                }
                className="w-full p-2 border border-content-tertiary rounded-lg text-sm"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">
                UNI per ETH
              </span>
            </div>
          </div>
        </div>

        {/* Num Bins */}
        <div className="mb-4">
          <label className="block text-xs mb-2">Num Bins</label>
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" className="text-xs" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="apple">1</SelectItem>
                <SelectItem value="banana">2</SelectItem>
                <SelectItem value="blueberry">3</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={resetPrice}
          className="text-accent-primary-2 text-sm flex items-center self-end"
        >
          <RotateCw className="size-4 mr-1" /> Reset price
        </button>
      </div>

      {/* Simulated Distribution */}
      <div className="">
        <div className="flex justify-between items-center mb-4">
          <div className="text-content-primary text-base">
            Simulated distribution
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#F95465] rounded-full mr-2"></div>
              <span className="text-sm text-content-primary">UNI</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#72A2FF] rounded-full mr-2"></div>
              <span className="text-sm text-content-primary">ETH</span>
            </div>
          </div>
        </div>

        <SimulatedDistribution />
      </div>
    </div>
  );
};

export default LiquidityManager;

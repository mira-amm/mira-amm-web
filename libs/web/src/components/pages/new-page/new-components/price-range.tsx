import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/meshwave-ui/select";
import {RotateCw} from "lucide-react";
import React, {useState} from "react";
import {DoubleRangeSlider} from "./double-range-slider";

const PriceRange = () => {
  const [minPrice, setMinPrice] = useState<number>(1200);
  const [maxPrice, setMaxPrice] = useState<number>(1500);

  const resetPrice = (): void => {
    setMinPrice(1200);
    setMaxPrice(1500);
  };

  return (
    <div className="">
      {/* Price Range Section */}
      <div className="flex flex-col">
        <div className="mb-4 text-base font-medium">Price range</div>

        {/* Price Range Slider */}
        <div className="mb-6">
          <DoubleRangeSlider
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinChange={setMinPrice}
            onMaxChange={setMaxPrice}
          />
        </div>

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
                className="w-full p-2 border border-content-tertiary rounded-lg"
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
    </div>
  );
};

export default PriceRange;

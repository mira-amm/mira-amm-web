import {RotateCw} from "lucide-react";
import React, {useState} from "react";
import DoubleSlider from "./double-slider";

const PriceRange = () => {
  const [priceRange, setPriceRange] = useState<[number, number]>([1200, 1500]);
  const [numBins, setNumBins] = useState<number>(3);

  const resetPrice = (): void => {
    setPriceRange([1200, 1500]);
  };
  const sliderMin = 1;
  const sliderMax = 2000;

  const [minPrice, maxPrice] = priceRange;

  const handleSliderChange = (newRange: [number, number]) => {
    setPriceRange(newRange);
  };

  const handleMinPriceChange = (value: number) => {
    setPriceRange([value, maxPrice]);
  };

  const handleMaxPriceChange = (value: number) => {
    setPriceRange([minPrice, value]);
  };

  const handleNumBinsChange = (newNumBins: number) => {
    // const clampedBins = Math.max(1, Math.min(50, Math.round(newNumBins)));
    // setNumBins(clampedBins);

    setNumBins(newNumBins);
  };

  return (
    <div className="">
      {/* Price Range Section */}
      <div className="flex flex-col">
        <div className="mb-4 text-base">Price range</div>

        {/* Price Range Slider */}
        <div className="mb-6">
          <DoubleSlider
            min={sliderMin}
            max={sliderMax}
            value={priceRange}
            onValueChange={handleSliderChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2">Min price</label>
            <div className="relative">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => handleMinPriceChange(Number(e.target.value))}
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
                onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
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
          <label className="block text-sm mb-2">Num Bins</label>
          <input
            type="number"
            value={numBins}
            onChange={(e) => handleNumBinsChange(Number(e.target.value))}
            min="1"
            step="1"
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Enter number of bins"
          />
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

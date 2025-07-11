import React, {useState, useEffect, MouseEvent} from "react";

type DoubleRangeSliderProps = {
  minPrice: number;
  maxPrice: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
};

export const DoubleRangeSlider = ({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
}: DoubleRangeSliderProps) => {
  const [isDraggingMin, setIsDraggingMin] = useState(false);
  const [isDraggingMax, setIsDraggingMax] = useState(false);
  const sliderRef = React.useRef(null);

  const priceRange = {min: 800, max: 2000};
  const center = (minPrice + maxPrice) / 2;

  const getPercentage = (value: number) => {
    return ((value - priceRange.min) / (priceRange.max - priceRange.min)) * 100;
  };

  const getValueFromPercentage = (percentage: number) => {
    return (
      priceRange.min + (percentage / 100) * (priceRange.max - priceRange.min)
    );
  };

  const handleMouseDown = (
    type: "min" | "max",
    e: React.MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
  ) => {
    e.preventDefault();
    if (type === "min") setIsDraggingMin(true);
    else if (type === "max") setIsDraggingMax(true);
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (!sliderRef.current || (!isDraggingMin && !isDraggingMax)) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
    );
    const newValue = Math.round(getValueFromPercentage(percentage));

    if (isDraggingMin) {
      const newMin = Math.min(newValue, maxPrice - 10);
      onMinChange(Math.max(priceRange.min, newMin));
    } else if (isDraggingMax) {
      const newMax = Math.max(newValue, minPrice + 10);
      onMaxChange(Math.min(priceRange.max, newMax));
    }
  };

  const handleMouseUp = (): void => {
    setIsDraggingMin(false);
    setIsDraggingMax(false);
  };

  useEffect(() => {
    if (isDraggingMin || isDraggingMax) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDraggingMin, isDraggingMax, minPrice, maxPrice]);

  const minPercentage = getPercentage(minPrice);
  const maxPercentage = getPercentage(maxPrice);
  const centerPercentage = getPercentage(center);

  return (
    <div className="relative py-4">
      {/* Labels */}
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>Min price</span>
        <span>Max price</span>
      </div>

      {/* Slider Track */}
      <div
        ref={sliderRef}
        className="w-full h-1 bg-gray-300 rounded-full relative cursor-pointer select-none"
      >
        {/* Active range between handles */}
        <div
          className="absolute h-1 bg-accent-primary rounded-full"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`,
          }}
        />

        {/* Min price handle */}
        <div
          className={`absolute w-5 h-5 bg-accent-primary-2 border-2 border-white rounded-full shadow-lg cursor-grab transform -translate-y-2 transition-transform ${
            isDraggingMin ? "scale-110 cursor-grabbing" : "hover:scale-105"
          }`}
          style={{left: `${minPercentage}%`, marginLeft: "-10px"}}
          onMouseDown={(e) => handleMouseDown("min", e)}
        />

        {/* Max price handle */}
        <div
          className={`absolute w-5 h-5 bg-accent-primary-2 border-2 border-white rounded-full shadow-lg cursor-grab transform -translate-y-2 transition-transform ${
            isDraggingMax ? "scale-110 cursor-grabbing" : "hover:scale-105"
          }`}
          style={{left: `${maxPercentage}%`, marginLeft: "-10px"}}
          onMouseDown={(e) => handleMouseDown("max", e)}
        />

        <div className="absolute w-0.5 h-6 bg-background-primary left-1/2 -ml-[12px] flex items-center justify-center text-white text-xs font-bold transform -translate-y-2.5 pointer-events-none"></div>
      </div>

      {/* Price value labels */}
      <div className="flex justify-between mt-2">
        <div
          className="text-xs text-gray-700"
          style={{
            marginLeft: `${minPercentage}%`,
            transform: "translateX(-50%)",
          }}
        >
          {minPrice}
        </div>
        <div
          className="text-xs text-gray-700"
          style={{
            marginRight: `${100 - maxPercentage}%`,
            transform: "translateX(50%)",
          }}
        >
          {maxPrice}
        </div>
      </div>
    </div>
  );
};

import * as Slider from "@radix-ui/react-slider";

type DoubleSliderProps = {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  className?: string;
};

const DoubleSlider = ({
  min,
  max,
  step,
  value,
  onValueChange,
  className,
}: DoubleSliderProps) => {
  return (
    <div className={`relative py-4 ${className}`}>
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>Min price</span>
        <span>Max price</span>
      </div>

      <div className="relative">
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={value}
          onValueChange={onValueChange}
          max={max}
          min={min}
          step={step}
        >
          <Slider.Track className="bg-gray-300 relative grow rounded-full h-1">
            <Slider.Range className="absolute bg-green-500 rounded-full h-full" />
          </Slider.Track>

          <Slider.Thumb className="block w-5 h-5 bg-gray-600 border-2 border-white shadow-lg rounded-full hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-transform" />
          <Slider.Thumb className="block w-5 h-5 bg-gray-600 border-2 border-white shadow-lg rounded-full hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-transform" />
        </Slider.Root>

        <div className="absolute w-0.5 h-6 bg-gray-700 transform top-1/2 -translate-y-1/2 pointer-events-none left-1/2 -translate-x-1/2"></div>
      </div>
    </div>
  );
};

export default DoubleSlider;

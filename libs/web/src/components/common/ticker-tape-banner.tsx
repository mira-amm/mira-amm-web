import React from "react";

interface TickerTapeProps {
  text?: string;
  speed?: number; // Speed in seconds (default: 20)
  className?: string;
}

export const TickerTape: React.FC<TickerTapeProps> = ({
  text,
  speed = 20,
  className = "",
}) => {
  const style = {
    "--scroll-speed": `${speed}s`,
  } as React.CSSProperties;

  return (
    <div className={`w-full overflow-hidden bg-[hsl(0_0%_0%)] ${className}`}>
      <div
        className="whitespace-nowrap font-mono py-2 px-4 text-[hsl(348_89%_64%)] flex animate-[marquee_var(--scroll-speed)_linear_infinite]"
        style={style}
      >
        <span className="flex-shrink-0">{text}</span>
        <span className="flex-shrink-0 ml-32">{text}</span>
      </div>
    </div>
  );
};

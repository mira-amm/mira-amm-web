import React from 'react';

interface TickerTapeProps {
  text?: string;
  speed?: number; // Speed in seconds (default: 20)
  className?: string;
}

export const TickerTape: React.FC<TickerTapeProps> = ({ 
  text="🚀 BREAKING: MIRA IS NOW MICROCHAIN • COMING SOON: IMPROVED CAPITAL EFFICIENCY • ⛽ $FUEL COMMUNITY RALLIES IN ANTICIPATION", 
  speed = 20, 
  className = '' 
}) => {
  const style = {
    '--scroll-speed': `${speed}s`
  } as React.CSSProperties;

  return (
    <div className={`w-full overflow-hidden bg-[hsl(0_0%_0%)] ${className}`}>
      <div 
        className="whitespace-nowrap font-mono py-2 px-4 text-[hsl(348_89%_64%)] animate-[scroll-left_var(--scroll-speed)_linear_infinite]"
        style={style}
      >
        {text}
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { LAUNCH_DATE } from '@/lib/constants';

interface CountdownTimerProps {
  onReturn: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = ({ onReturn }: CountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const difference = LAUNCH_DATE.getTime() - now.getTime();
      
      if (difference <= 0) {
        // Launch time reached
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        });
        return;
      }
      
      // Calculate time components
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeRemaining({ days, hours, minutes, seconds });
    };
    
    // Calculate initial time remaining
    calculateTimeRemaining();
    
    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Format numbers to always have 2 digits
  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };
  
  return (
    <div className="countdown-timer">
      <div className="mb-6 border-b-4 border-double border-terminal-blue pb-2">
        <p className="text-terminal-blue text-xl mb-2 font-bold flex items-center">
          <span className="animate-pulse mr-2">▲▲</span>
          DLM-2000 PRODUCT LAUNCH COUNTDOWN
          <span className="animate-pulse ml-2">▲▲</span>
        </p>
        <p className="text-terminal-red font-bold text-lg">INITIATING SEQUENCE: T-MINUS</p>
      </div>
      
      {/* Digital Timer Display - 80s Style LCD */}
      <div className="timer-display text-center my-8 relative">
        <div className="absolute top-0 left-0 right-0 text-terminal-red font-bold text-xs mb-2">
          -- T-REX TECHNOLOGIES LAUNCH TIMER v4.2 --
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-4xl bg-black/20 p-4 border-4 border-terminal-blue">
          <div className="flex flex-col items-center">
            <div className="bg-terminal-bg border-2 border-terminal-green p-4 w-full text-terminal-green font-digital font-bold relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-terminal-green/20"></div>
              {formatNumber(timeRemaining.days)}
            </div>
            <div className="text-sm mt-2 text-terminal-blue font-bold">DAYS</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-terminal-bg border-2 border-terminal-green p-4 w-full text-terminal-green font-digital font-bold relative overflow-hidden animate-pulse">
              <div className="absolute top-0 left-0 right-0 h-1 bg-terminal-green/20"></div>
              {formatNumber(timeRemaining.hours)}
            </div>
            <div className="text-sm mt-2 text-terminal-blue font-bold">HOURS</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-terminal-bg border-2 border-terminal-green p-4 w-full text-terminal-green font-digital font-bold relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-terminal-green/20"></div>
              {formatNumber(timeRemaining.minutes)}
            </div>
            <div className="text-sm mt-2 text-terminal-blue font-bold">MINUTES</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-terminal-bg border-2 border-terminal-green p-4 w-full text-terminal-green font-digital font-bold relative overflow-hidden animate-pulse">
              <div className="absolute top-0 left-0 right-0 h-1 bg-terminal-green/20"></div>
              {formatNumber(timeRemaining.seconds)}
            </div>
            <div className="text-sm mt-2 text-terminal-blue font-bold">SECONDS</div>
          </div>
        </div>
      </div>
      
      <div className="text-center text-terminal-red mb-6 border p-2 border-terminal-red bg-terminal-red/10">
        <p className="font-bold">PREPARE FOR FINANCIAL EVOLUTION</p>
        <p className="text-terminal-blue font-bold text-sm mt-2 animate-pulse">[ SYNCHRONIZING WITH WALL STREET TRADING TERMINALS ]</p>
      </div>
      
      <div className="mt-6 border-t border-dashed border-terminal-blue pt-4 flex items-center">
        <div className="w-3 h-3 bg-terminal-green animate-ping mr-2"></div>
        <p className="text-terminal-green font-bold">{"> PRESS [ ENTER ] TO RETURN TO DLM-2000 COMMAND PROMPT"}</p>
      </div>
    </div>
  );
};

export default CountdownTimer;

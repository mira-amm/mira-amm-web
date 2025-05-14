import { useState, useEffect } from "react";
import { LAUNCH_DATE } from "../../lib/constants";

const getTimeRemaining = () => {
  const now = new Date();
  const diff = LAUNCH_DATE.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};

const formatNumber = (num: number): string => num.toString().padStart(2, "0");

const TimeBlock = ({
  label,
  value,
  pulse = false,
}: {
  label: string;
  value: number;
  pulse?: boolean;
}) => (
  <div className="flex flex-col items-center">
    <div
      className={`bg-terminal-bg border-2 border-terminal-green p-4 w-full text-terminal-green font-digital font-bold relative overflow-hidden ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-terminal-green/20" />
      {formatNumber(value)}
    </div>
    <div className="text-sm mt-2 text-terminal-blue font-bold">{label}</div>
  </div>
);

const CountdownTimer = ({ onReturn }: { onReturn: () => void }) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>(getTimeRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="mb-6 border-b-4 border-double border-terminal-blue pb-2">
        <p className="text-terminal-blue text-xl mb-2 font-bold flex items-center">
          <span className="animate-pulse mr-2">▲▲</span>
          DLM-2000 PRODUCT LAUNCH COUNTDOWN
          <span className="animate-pulse ml-2">▲▲</span>
        </p>
        <p className="text-terminal-red font-bold text-lg">
          INITIATING SEQUENCE: T-MINUS
        </p>
      </div>

      <div className="timer-display text-center my-8 relative">
        <div className="top-0 left-0 right-0 text-terminal-red font-bold text-md mb-2">
          -- T-REX TECHNOLOGIES LAUNCH TIMER v4.2 --
        </div>

        <div className="grid grid-cols-4 gap-4 text-4xl bg-black/20 p-4 border-4 border-terminal-blue">
          <TimeBlock label="DAYS" value={timeRemaining.days} />
          <TimeBlock label="HOURS" value={timeRemaining.hours} pulse />
          <TimeBlock label="MINUTES" value={timeRemaining.minutes} />
          <TimeBlock label="SECONDS" value={timeRemaining.seconds} pulse />
        </div>
      </div>

      <div className="text-center text-terminal-red mb-6 border p-2 border-terminal-red bg-terminal-red/10">
        <p className="font-bold">PREPARE FOR FINANCIAL EVOLUTION</p>
        <p className="text-terminal-blue font-bold text-sm mt-2 animate-pulse">
          [ SYNCHRONIZING WITH WALL STREET TRADING TERMINALS ]
        </p>
      </div>

      <div className="mt-6 border-t border-dashed border-terminal-blue pt-4 flex items-center">
        <div className="w-3 h-3 bg-terminal-green animate-ping mr-2" />
        <p className="text-terminal-green font-bold">
          {"> PRESS [ ENTER ] TO RETURN TO DLM-2000 COMMAND PROMPT"}
        </p>
      </div>
    </>
  );
};

export default CountdownTimer;

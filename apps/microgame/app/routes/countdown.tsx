import {useState, useEffect} from "react";
import {useNavigate} from "react-router";

type Time = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const LAUNCH_DATE = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

const getTimeRemaining = (): Time => {
  const diff = LAUNCH_DATE.getTime() - Date.now();

  return diff > 0
    ? {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      }
    : {days: 0, hours: 0, minutes: 0, seconds: 0};
};

const formatNumber = (n: number) => n.toString().padStart(2, "0");

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
      className={`bg-terminal-bg border border-6 border-terminal-green p-4 w-full text-terminal-green font-digital font-bold relative overflow-hidden ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-terminal-green/20" />
      {formatNumber(value)}
    </div>
    <div className="text-sm mt-2 text-terminal-blue font-bold">{label}</div>
  </div>
);

export default function Countdown() {
  const [timeRemaining, setTimeRemaining] = useState<Time>(getTimeRemaining);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const {days, hours, minutes, seconds} = timeRemaining;

  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        navigate("/menu");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate]);

  return (
    <>
      {/* Header */}
      <div className="mb-6 border-b border-double border-b-6 border-b-terminal-blue pb-2">
        <p className="text-terminal-blue text-xl mb-2 font-bold flex items-center">
          <span className="animate-pulse mr-2">▲▲</span>
          DLM-2000 PRODUCT LAUNCH COUNTDOWN
          <span className="animate-pulse ml-2">▲▲</span>
        </p>
        <p className="text-terminal-red font-bold text-lg">
          INITIATING SEQUENCE: T-MINUS
        </p>
      </div>

      {/* Timer Blocks */}
      <div className="text-center my-8 relative">
        <div className="top-0 left-0 right-0 text-terminal-red font-bold text-md mb-2">
          -- T-REX TECHNOLOGIES LAUNCH TIMER v4.2 --
        </div>

        <div className="grid grid-cols-4 gap-4 text-4xl bg-black/20 p-4 border border-6 border-terminal-blue">
          <TimeBlock label="DAYS" value={days} />
          <TimeBlock label="HOURS" value={hours} pulse />
          <TimeBlock label="MINUTES" value={minutes} />
          <TimeBlock label="SECONDS" value={seconds} pulse />
        </div>
      </div>

      {/* Footer Status */}
      <div className="text-center text-terminal-red mb-6 border p-2 border-terminal-red bg-terminal-red/10">
        <p className="font-bold">PREPARE FOR FINANCIAL EVOLUTION</p>
        <p className="text-terminal-blue font-bold text-sm mt-2 animate-pulse">
          [ SYNCHRONIZING WITH WALL STREET TRADING TERMINALS ]
        </p>
      </div>

      {/* Return Prompt */}
      <div className="mt-6 border-t border-dashed border-terminal-blue pt-4 flex items-center">
        <div className="w-3 h-3 bg-terminal-green animate-ping mr-2" />
        <p className="text-terminal-green font-bold">
          {"> PRESS [ ENTER ] TO RETURN TO DLM-2000 COMMAND PROMPT"}
        </p>
      </div>
    </>
  );
}

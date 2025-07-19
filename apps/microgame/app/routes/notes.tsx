import {useEffect} from "react";
import {useNavigate} from "react-router";
import clsx from "clsx";

export default function Notes() {
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
      <div className="mb-4 border-b border-terminal-red/50 pb-2">
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-terminal-red animate-pulse mr-2" />
          <p className="text-terminal-red font-bold text-lg">
            DEREK DINO'S CONFIDENTIAL PROJECT FILES
          </p>
        </div>
        <p className="text-terminal-blue text-sm font-bold">
          TOP SECRET // T-REX EXECUTIVE ACCESS // CLEARANCE LEVEL: CEO
        </p>
      </div>

      <div className="space-y-6">
        {[
          {
            date: "1985-03-12",
            content:
              "President Reagan's Digital Assets Deregulation Act is working in our favor. The freedom to operate without government intervention gives us a clear advantage. The DLM-2000 prototype is progressing ahead of schedule. Fossil Frank has outdone himself again.",
          },
          {
            date: "1985-06-24",
            content:
              "Met with the Velociraptor hedge fund managers today. They're eager to be early adopters of the DLM-2000. Their aggressive trading style makes them perfect beta testers. Brian Bronto's connections continue to pay dividends - his disco-era networking is unmatched.",
          },
          {
            date: "1985-09-18",
            content:
              "Breakthrough on the permissionless trading algorithm! Our tests show zero slippage even with Brontosaurus-sized trades. This will revolutionize Wall Street. The traditional Dino exchanges won't know what hit them. Keeping this TOP SECRET until launch.",
          },
          {
            date: "1985-11-03",
            content:
              "URGENT: Possible corporate espionage detected. Suspicious T-Rex footprints found near R&D lab. Rival Dino firms getting desperate as our launch approaches. Implementing additional security protocols. TRUST NO ONE OUTSIDE THE CORE TEAM!",
            isHighlighted: true,
          },
        ].map((note, index) => (
          <div
            key={index}
            className={clsx(
              "note p-3 border-l border-l-6",
              note.isHighlighted
                ? "border-l-terminal-red bg-terminal-red/10 text-terminal-red"
                : "border-l-terminal-blue bg-terminal-blue/5"
            )}
          >
            {note.date && (
              <p className="text-terminal-green font-bold mb-1 flex items-center">
                <span className="mr-2">▲</span>
                <span>MEMO DATE: {note.date}</span>
              </p>
            )}
            <p className="pl-5 font-mono">{note.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-dashed border-terminal-blue pt-4 flex items-center">
        <div className="w-3 h-3 bg-terminal-green animate-ping mr-2" />
        <p className="text-terminal-green font-bold">
          {"> PRESS [ ENTER ] TO RETURN TO DLM-2000 COMMAND PROMPT"}
        </p>
      </div>
    </>
  );
}

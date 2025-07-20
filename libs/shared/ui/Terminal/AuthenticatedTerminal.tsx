import {useState, useRef, useEffect, useCallback} from "react";
import {userFlowActor} from "@/engine/actors/user";
import {useNavigate} from "react-router";

const INITIAL_OUTPUTS = [
  "Authentication successful. Welcome to MICROCHAIN SYSTEMS.",
  "Type 'help' to see available commands.",
  "> SYSTEM READY",
  "> ENTER COMMAND TO BEGIN",
];

const HELP_TEXT = [
  "AVAILABLE COMMANDS - T-REX EXECUTIVE ACCESS:",
  "- notes: Access Derek Dino's confidential project files",
  "- timer: View DLM-2000 product launch countdown",
  "- game: Test the Decentralized Market Simulator",
  "- clear: Purge screen data [CLASSIFIED]",
  "- logout: Engage T-REX security lockdown",
];

export const AuthenticatedTerminal = () => {
  const [commandInput, setCommandInput] = useState("");
  const [outputs, setOutputs] = useState<string[]>(INITIAL_OUTPUTS);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleCommand = useCallback((rawCommand: string) => {
    const trimmed = rawCommand.trim();
    const lower = trimmed.toLowerCase();
    const echo = `> ${trimmed.toUpperCase()}`;

    setOutputs((prev) => [...prev, echo]);

    if (lower === "help") {
      setOutputs((prev) => [...prev, ...HELP_TEXT]);
      return;
    }

    if (lower === "clear") {
      setOutputs(INITIAL_OUTPUTS);
      return;
    }

    const validStateCommands = ["notes", "timer", "game", "logout"];

    if (validStateCommands.includes(lower)) {
      userFlowActor.send({type: lower.toUpperCase()});
      /* navigate('/notes');
       * navigate('/timer');
       * navigate('/game'); */
      return navigate("/logout");
    }

    setOutputs((prev) => [...prev, "> COMMAND NOT RECOGNIZED"]);
  }, []);

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && commandInput.trim()) {
      handleCommand(commandInput);
      setCommandInput("");
    }
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputs]);

  return (
    <>
      {renderHeader()}
      {renderMenu()}
      {renderOutput(outputs, outputRef)}
      {renderPrompt(commandInput, setCommandInput, handleKeyUp, inputRef)}
    </>
  );
};

// ─── Render Sections ───────────────────────────────────────────
const renderHeader = () => (
  <div className="mb-6 border-b border-terminal-green/30 pb-2">
    <p className="text-terminal-green mb-2 animate-text-glow font-bold">
      CEO ACCESS GRANTED - WELCOME TO DLM-2000, UNKNOWN USER
    </p>
    <p className="text-terminal-blue">
      {"> Last login: 4/20/2025, 4:20:00 PM on T-REX SECURE NETWORK"}
    </p>
  </div>
);

const renderMenu = () => (
  <div className="mb-6">
    <p className="text-terminal-red font-bold mb-2">
      == EXECUTIVE COMMAND OPTIONS ==
    </p>
    <ul className="space-y-1 ml-4">
      <li>
        {"> "}
        <span className="text-terminal-green font-bold">notes</span> - Access
        confidential project files
      </li>
      <li>
        {"> "}
        <span className="text-terminal-green font-bold">timer</span> - View
        DLM-2000 product launch countdown
      </li>
      <li>
        {"> "}
        <span className="text-terminal-green font-bold">game</span> - Test the
        Decentralized Market Simulator
      </li>
      <li>
        {"> "}
        <span className="text-terminal-green font-bold">help</span> - Show T-REX
        command options
      </li>
      <li>
        {"> "}
        <span className="text-terminal-green font-bold">clear</span> - Purge
        screen data [CLASSIFIED]
      </li>
      <li>
        {"> "}
        <span className="text-terminal-green font-bold">logout</span> - Engage
        T-REX security lockdown
      </li>
    </ul>
  </div>
);

const renderOutput = (
  outputs: string[],
  ref: React.RefObject<HTMLDivElement>
) => (
  <div ref={ref} className="mt-4 space-y-1 max-h-96 overflow-y-auto">
    {outputs.map((line, index) => (
      <p key={index}>{line}</p>
    ))}
  </div>
);

const renderPrompt = (
  value: string,
  onChange: (val: string) => void,
  onKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void,
  ref: React.RefObject<HTMLInputElement>
) => (
  <div className="mt-4">
    <div className="flex items-center border-t border-b border-terminal-blue py-1">
      <span className="text-terminal-blue font-bold mr-2">{"T-REX://"}</span>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyUp={onKeyUp}
        className="bg-transparent focus:outline-none w-full text-terminal-green font-bold uppercase"
        placeholder="ENTER COMMAND..."
      />
      <span className="animate-cursor-blink text-terminal-green">█</span>
    </div>
  </div>
);

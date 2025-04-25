import { KeyboardEvent, useState } from 'react';
import { useEffect, useRef } from 'react';

export const AuthenticatedTerminal = ({ terminal }: any) => {
  const { state, commandInputRef, processCommand } = terminal;
  const outputRef = useRef<HTMLDivElement>(null);
  const [commandInput, setCommandInput] = useState('');
  
  // Scroll to bottom whenever outputs change
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [state.commandOutputs]);
  
  const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && commandInput.trim()) {
      processCommand(commandInput);
      setCommandInput('');
    }
  };
  
  return (
    <div className="authenticated-terminal">
      {/* Terminal Header after authentication */}
      <div className="mb-6 border-b border-terminal-green/30 pb-2">
        <p className="text-terminal-green mb-2 animate-text-glow font-bold">CEO ACCESS GRANTED - WELCOME TO DLM-2000, DEREK DINO</p>
        <p className="text-terminal-blue">{"> Last login: " + new Date().toLocaleString() + " on T-REX SECURE NETWORK"}</p>
      </div>
      
      {/* Navigation Menu */}
      <div className="mb-6">
        <p className="text-terminal-red font-bold mb-2">== EXECUTIVE COMMAND OPTIONS ==</p>
        <ul className="space-y-1 ml-4">
          <li>{"> "}<span className="text-terminal-green font-bold">notes</span> - Access confidential project files</li>
          <li>{"> "}<span className="text-terminal-green font-bold">timer</span> - View DLM-2000 product launch countdown</li>
          <li>{"> "}<span className="text-terminal-green font-bold">game</span> - Test the Decentralized Market Simulator</li>
          <li>{"> "}<span className="text-terminal-green font-bold">help</span> - Show T-REX command options</li>
          <li>{"> "}<span className="text-terminal-green font-bold">clear</span> - Purge screen data [CLASSIFIED]</li>
          <li>{"> "}<span className="text-terminal-green font-bold">logout</span> - Engage T-REX security lockdown</li>
        </ul>
      </div>
      
      {/* Command Output Area */}
      <div ref={outputRef} className="command-output mt-4 space-y-1 max-h-96 overflow-y-auto">
        {state.commandOutputs.map((output: string, index: number) => (
          <p key={index}>{output}</p>
        ))}
      </div>
      
      {/* Command Prompt */}
      <div className="command-prompt mt-4">
        <div className="flex items-center border-t border-b border-terminal-blue py-1">
          <span className="text-terminal-blue font-bold mr-2">{"T-REX://"}</span>
          <input
            ref={commandInputRef}
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyUp={handleKeyUp}
            className="bg-transparent focus:outline-none w-full text-terminal-green font-bold uppercase"
            placeholder="ENTER COMMAND..."
          />
          <span className="animate-cursor-blink text-terminal-green">█</span>
        </div>
      </div>
    </div>
  );
};

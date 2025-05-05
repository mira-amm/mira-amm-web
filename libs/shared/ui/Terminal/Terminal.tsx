"use client";

import { useEffect, useState } from "react";
import { useTerminal } from "../../hooks/useTerminal";
import TerminalHeader from "./TerminalHeader";
import BootSequence from "./BootSequence";
import PasswordPrompt from "./PasswordPrompt";
import AuthenticatedTerminal from "./AuthenticatedTerminal";
import SecretNotes from "./SecretNotes";
import CountdownTimer from "./CountdownTimer";
import MiniGame from "./MiniGame";
import { cn } from "../../utils/cn";

const Terminal = () => {
  const terminal = useTerminal();
  const { state, validatePassword, processCommand, returnToTerminal } = terminal;
  const [passwordError, setPasswordError] = useState(false);

  // Handle keydown events globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key to return to main terminal from game
      if (e.key === "Escape" && state.currentView === "game") {
        returnToTerminal();
      }

      // Handle Enter key to return to main terminal from notes or timer
      if (e.key === "Enter" && (state.currentView === "notes" || state.currentView === "timer")) {
        returnToTerminal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.currentView, returnToTerminal]);

  const handlePasswordSubmit = (password: string) => {
    const isValid = validatePassword(password);
    setPasswordError(!isValid);
    return isValid;
  };

  return (
    <div className="relative w-full h-full max-w-6xl mx-auto flex items-center justify-center p-4">
      {/* Terminal Window */}
      <div className="terminal-window relative w-full h-[calc(100vh-2rem)] md:w-[800px] md:h-[600px] bg-terminal-bg rounded-md border border-terminal-text/30 overflow-hidden shadow-2xl shadow-terminal-green/20">
        {/* Terminal Header */}
        <TerminalHeader />

        {/* Main Terminal Content */}
        <div className="scanlines relative h-[calc(100%-2rem)] overflow-hidden">
          {/* Animated scanline effect */}
          <div className="absolute top-0 left-0 w-full h-full bg-terminal-green/5 opacity-30 animate-scanline pointer-events-none z-10"></div>

          {/* Terminal content area */}
          <div
            className={cn("terminal-content h-full p-4 text-terminal-text text-lg", {
              "overflow-y-auto": !state.gameActive,
            })}
          >
            {state.currentView === "boot" && <BootSequence />}

            {state.currentView === "passwordPrompt" && (
              <PasswordPrompt onSubmit={handlePasswordSubmit} error={passwordError} />
            )}

            {state.currentView === "authenticated" && <AuthenticatedTerminal terminal={terminal} />}

            {state.currentView === "notes" && <SecretNotes onReturn={returnToTerminal} />}

            {state.currentView === "timer" && <CountdownTimer onReturn={returnToTerminal} />}

            {state.currentView === "game" && <MiniGame terminal={terminal} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terminal;

"use client";

import {useEffect, useState} from "react";
import {useTerminal} from "../../hooks/useTerminal";
import {BootSequence} from "@/shared/ui/Terminal/BootSequence";
import {PasswordPrompt} from "@/shared/ui/Terminal/PasswordPrompt";
import {AuthenticatedTerminal} from "@/shared/ui/Terminal/AuthenticatedTerminal";
// import {SecretNotes} from "@/shared/ui/Terminal/SecretNotes";
// import {CountdownTimer} from "@/shared/ui/Terminal/CountdownTimer";
import {MiniGame} from "@/shared/ui/Terminal/MiniGame";
import {cn} from "@/shadcn-ui/utils";

export function Terminal() {
  const terminal = useTerminal();
  const {state, validatePassword, returnToTerminal} = terminal;
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.currentView === "game") {
        returnToTerminal();
      }

      if (
        e.key === "Enter" &&
        (state.currentView === "notes" || state.currentView === "timer")
      ) {
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
    <div
      className={cn("h-full p-4 text-terminal-text text-lg", {
        "overflow-y-auto": !state.gameActive,
      })}
    >
      {state.currentView === "login" && (
        <>
          <BootSequence />
          <PasswordPrompt
            onSubmit={handlePasswordSubmit}
            error={passwordError}
          />
        </>
      )}

      {state.currentView === "authenticated" && (
        <AuthenticatedTerminal terminal={terminal} />
      )}

      {/* {state.currentView === "notes" && <SecretNotes onReturn={returnToTerminal} />} */}

      {/* {state.currentView === "timer" && <CountdownTimer onReturn={returnToTerminal} />} */}

      {state.currentView === "game" && <MiniGame terminal={terminal} />}
    </div>
  );
}

import {useNavigate} from "react-router";
import {useState, KeyboardEvent, useRef, useEffect} from "react";
import {userFlowActor} from "@/engine/actors/user";

export const PasswordPrompt = () => {
  const [password, setPassword] = useState("microchain");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (password === "microchain") {
        userFlowActor.send({type: "LOGIN"});
        setError(false);
        navigate("/menu");
      } else {
        setPassword("");
        setError(true);
      }
    }
  };

  return (
    <div className="password-prompt mt-6">
      <p className="text-terminal-yellow mb-2">T-REX SECURITY SYSTEM:</p>
      <div className="flex items-center">
        <span className="mr-2 animate-pulse">{"▲"}</span>
        <input
          ref={inputRef}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyUp={handleKeyUp}
          className="bg-transparent border-b border-terminal-green focus:outline-none focus:border-terminal-light-green w-full text-terminal-green"
        />
      </div>
      {error && (
        <p className="text-terminal-red mt-2">
          SECURITY BREACH DETECTED. INVALID EXECUTIVE CREDENTIALS.
        </p>
      )}
      <p className="text-terminal-text/50 mt-6 text-sm">
        HINT: The DLM-2000 infrastructure is built on this technology...Rhymes
        with 'blockchain'
      </p>
    </div>
  );
};

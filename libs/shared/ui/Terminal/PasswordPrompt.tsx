import Link from 'next/link';
import { useState, KeyboardEvent, useRef, useEffect } from 'react';

interface PasswordPromptProps {
  onSubmit: (password: string) => boolean;
  error: boolean;
}

const PasswordPrompt = ({ onSubmit, error }: PasswordPromptProps) => {
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const success = onSubmit(password);
      if (!success) {
        setPassword('');
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
        <p className="text-terminal-red mt-2">SECURITY BREACH DETECTED. INVALID EXECUTIVE CREDENTIALS.</p>
      )}
      <p className="text-terminal-text/50 mt-6 text-sm">HINT: The DLM-2000 infrastructure is built on this technology...</p>

    <Link href="/api/users/oauth/twitter"
      className="flex bg-black max-w-sm items-center p-4 border border-white rounded-lg my-6 justify-center mx-auto"
    >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png"
          alt="Twitter(X) Login"
          width="24"
          height="24"
        />
    </Link>
    </div>
  );
};

export default PasswordPrompt;

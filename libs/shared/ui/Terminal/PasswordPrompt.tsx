import Link from 'next/link';
import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import {useConnectUI, useIsConnected} from "@fuels/react";

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

  const {connect} = useConnectUI();
  const {isConnected} = useIsConnected();

  console.log(isConnected)
  
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

      <section className="flex justify-around">
    <Link href="/api/users/oauth/twitter"
      className="flex bg-black w-sm items-center p-4 border border-white rounded-lg my-6 justify-center mx-auto"
    >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png"
          alt="Twitter(X) Login"
          width="24"
          height="24"
        />
    </Link>

        <button className="flex bg-black w-sm space-x-4 items-center p-4 border border-white rounded-lg my-6 justify-center mx-auto hover:cursor-pointer"
          onClick={connect}
        >
          <img className="size-8" src="https://verified-assets.fuel.network/images/fuel.svg"/>
          <img className="size-8" src="https://avatars.githubusercontent.com/u/178423058?s=48&v=4"/>
          <img className="size-8" src="https://docs.fuelet.app/~gitbook/image?url=https%3A%2F%2F2435339766-files.gitbook.io%2F~%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FT65XO2RJ6uispplU4cJT%252Fuploads%252F3W8rR7UgMOQrtslELoKu%252FFuelet%2520Logo%2520White.svg%3Falt%3Dmedia%26token%3Dd94170ce-168d-4ad8-8c81-5b10ced92afa&width=300&dpr=2&quality=100&sign=cf822ef8&sv=2"/>
        </button>
    </section>
    </div>
  );
};

export default PasswordPrompt;

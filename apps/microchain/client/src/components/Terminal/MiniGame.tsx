import { useState, useEffect } from 'react';
import { GAME_INSTRUCTIONS } from '@/lib/constants';

interface MiniGameProps {
  terminal: any;
}

interface LeaderboardEntry {
  wallet: string;
  score: number;
}

const MiniGame = ({ terminal }: MiniGameProps) => {
  const { state, startGame, updateGameScore, endGame, submitWalletAddress } = terminal;
  const [walletInput, setWalletInput] = useState('');
  const [showWalletInput, setShowWalletInput] = useState(false);
  const [walletError, setWalletError] = useState('');
  
  // Handle spacebar to start the game
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.code === 'Space' && !state.gameActive && !showWalletInput) {
        e.preventDefault(); // Prevent page scrolling
        startGame();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.gameActive, startGame, showWalletInput]);
  
  // Simple game logic for the placeholder
  useEffect(() => {
    if (state.gameActive) {
      // Simulated game playing - just increment score periodically
      const gameLoop = setInterval(() => {
        // Add random points between 10-100
        updateGameScore(Math.floor(Math.random() * 90) + 10);
      }, 1000);
      
      // End game after 10 seconds
      const gameTimer = setTimeout(() => {
        clearInterval(gameLoop);
        endGame();
        // Show wallet input if score is high enough (for demo purposes, always show)
        setShowWalletInput(true);
      }, 10000);
      
      return () => {
        clearInterval(gameLoop);
        clearTimeout(gameTimer);
      };
    }
  }, [state.gameActive, updateGameScore, endGame]);
  
  const handleWalletSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const isValid = submitWalletAddress(walletInput);
      if (isValid) {
        setWalletError('');
        setShowWalletInput(false);
      } else {
        setWalletError('Invalid wallet address. Must start with 0x and be at least 10 characters.');
      }
    }
  };
  
  const handleButtonSubmit = () => {
    const isValid = submitWalletAddress(walletInput);
    if (isValid) {
      setWalletError('');
      setShowWalletInput(false);
    } else {
      setWalletError('Invalid wallet address. Must start with 0x and be at least 10 characters.');
    }
  };
  
  return (
    <div className="mini-game">
      <div className="mb-4 border-b-4 border-double border-terminal-blue pb-2">
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-terminal-blue animate-pulse mr-2"></div>
          <p className="text-terminal-blue text-xl font-bold">DECENTRALIZED MARKET SIMULATOR</p>
          <div className="w-4 h-4 bg-terminal-blue animate-pulse ml-2"></div>
        </div>
        <p className="text-terminal-red font-bold">DLM-2000 PROTOTYPE TESTING ENVIRONMENT</p>
      </div>
      
      {/* Game Instructions */}
      <div className="game-instructions mb-6 bg-black/20 p-3 border-2 border-terminal-green">
        <p className="text-terminal-green font-bold mb-2 underline">TRADING INSTRUCTIONS:</p>
        <ul className="space-y-1 ml-4 text-terminal-green font-mono">
          {GAME_INSTRUCTIONS.map((instruction, index) => (
            <li key={index} className="animate-flicker-slow">{instruction}</li>
          ))}
        </ul>
      </div>
      
      {/* Game Canvas Placeholder - 80s Terminal Style */}
      <div className="game-canvas-container border-4 border-terminal-blue h-64 flex items-center justify-center mb-6 bg-black/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-terminal-blue/20"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-terminal-blue/20"></div>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-terminal-blue/20"></div>
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-terminal-blue/20"></div>
        
        {state.gameActive ? (
          <div className="text-center">
            <p className="text-terminal-red text-xl mb-4 font-bold animate-pulse">MARKETS ENGAGED!</p>
            <div className="text-terminal-green font-bold">
              <div className="mb-2 animate-flicker-slow">TRADING BLOCKCHAIN ASSETS...</div>
              <pre className="text-xs animate-pulse">
         __
       /` ,\__
      |    ).-'
     / .--'
    / /
 _.'  \_            ___
`-,__.-'     ___   / _ \  $$$
        \\  / _ \\ | | | | $$$
         \\| |_| |/ /_\\ \\ $$$
          \\| ._,/ ____| |
            \\_/  \\/     \\/
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-terminal-red text-xl mb-4 font-bold animate-flicker-slow">
              {showWalletInput ? 'TRADING SESSION COMPLETE' : 'MARKET SIMULATOR READY - AWAITING INPUT'}
            </p>
            {!showWalletInput && (
              <pre className="text-terminal-green font-bold animate-pulse">
  ________________________
 /                        \
|   PRESS TRANSACTION KEY  |
|   TO BEGIN SIMULATION    |
 \________________________/
             .---.
            /     \
            \.@-@./
            /`\_/`\
           //  _  \\
              </pre>
            )}
          </div>
        )}
      </div>
      
      {/* Score Display - 80s Terminal Style */}
      <div className="score-display mb-6 border-2 border-terminal-red bg-terminal-red/10">
        <div className="flex justify-between p-2">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-terminal-green animate-ping mr-2"></div>
            <p className="text-terminal-green font-bold">TRADE PROFIT: <span className="text-terminal-green animate-pulse">${state.currentScore}</span></p>
          </div>
          <div className="flex items-center">
            <p className="text-terminal-green font-bold">COMMISSION: <span className="text-terminal-blue animate-pulse">x{state.multiplier}</span></p>
            <div className="w-2 h-2 bg-terminal-green animate-ping ml-2"></div>
          </div>
        </div>
      </div>
      
      {/* Wallet Input (shown after game over) - Styled as 80s terminal interface */}
      {showWalletInput && (
        <div className="wallet-input mt-8 border-2 border-terminal-blue p-4 bg-black/20">
          <p className="text-terminal-red font-bold mb-2 animate-pulse">EXCEPTIONAL TRADING PERFORMANCE! ENTER YOUR T-REX WALLET:</p>
          <div className="flex items-center">
            <span className="text-terminal-blue font-bold mr-2">{"DINO-ID://"}</span>
            <input
              type="text"
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              onKeyUp={handleWalletSubmit}
              className="bg-transparent border-b-2 border-terminal-green focus:outline-none focus:border-terminal-blue w-full text-terminal-green font-bold uppercase"
              placeholder="0x..."
              autoFocus
            />
          </div>
          {walletError && <p className="text-terminal-red mt-2 font-bold">{walletError}</p>}
          <button
            onClick={handleButtonSubmit}
            className="mt-4 border-2 border-terminal-blue px-4 py-2 font-bold text-terminal-blue hover:bg-terminal-blue hover:text-black animate-pulse"
          >
            RECORD TRADE IN LEDGER
          </button>
        </div>
      )}
      
      {/* Leaderboard - 80s Highscore Table */}
      <div className="leaderboard mt-8 border-2 border-terminal-green p-2 bg-black/10">
        <p className="text-terminal-green font-bold mb-2 text-center border-b border-terminal-green pb-1">== TOP TRADERS LEADERBOARD ==</p>
        {state.leaderboard.map((entry: LeaderboardEntry, index: number) => (
          <div key={index} className="leaderboard-entry flex justify-between border-b border-dashed border-terminal-green/30 py-2">
            <div className="flex">
              <span className="text-terminal-blue font-bold mr-2">{index + 1}.</span>
              <span className="text-terminal-red font-bold truncate animate-flicker-slow" title={entry.wallet}>
                {entry.wallet}
              </span>
            </div>
            <span className="text-terminal-green font-bold">${entry.score}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 border-t border-dashed border-terminal-blue pt-4 flex items-center">
        <div className="w-3 h-3 bg-terminal-green animate-ping mr-2"></div>
        <p className="text-terminal-green font-bold">{"> PRESS [ ESC ] TO EXIT SIMULATOR"}</p>
      </div>
    </div>
  );
};

export default MiniGame;

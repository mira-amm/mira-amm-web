import {useState, useEffect} from "react";
import {GAME_INSTRUCTIONS} from "../../lib/constants";
import {PaginationContextProvider} from "../Pagination/PaginationContextProvider";
import {Pagination} from "../Pagination/Pagination";
import {Input} from "../input";
import {Game} from "../Game/Game";
import useWeb3React from "../../hooks/use-web3-react";

interface MiniGameProps {
  terminal: any;
}

interface LeaderboardEntry {
  wallet: string;
  score: number;
}

const MiniGame = ({terminal}: MiniGameProps) => {
  const {state, startGame, updateGameScore, endGame, submitWalletAddress} =
    terminal;
  const [walletInput, setWalletInput] = useState("");
  const [showWalletInput, setShowWalletInput] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const {connect, account, disconnect, isConnected, isWalletLoading} =
    useWeb3React();

  useEffect(() => {
    if (account) setWalletInput(account);
    else setWalletInput("");
  }, [account]);

  useEffect(() => {
    if (
      !state.gameActive &&
      !showWalletInput &&
      state.highScore &&
      state.currentScore === state.highScore
    ) {
      // Show wallet input if score is high enough
      setShowWalletInput(true);
    }
  }, [state.currentScore, state.highScore, state.gameActive, showWalletInput]);

  const handleWalletSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const isValid = submitWalletAddress(walletInput);
      if (isValid) {
        setWalletError("");
        setShowWalletInput(false);
      } else {
        setWalletError(
          "Invalid wallet address. Must start with 0x and be at least 10 characters.",
        );
      }
    }
  };

  const handleButtonSubmit = () => {
    const isValid = submitWalletAddress(walletInput);
    if (isValid) {
      setWalletError("");
      setShowWalletInput(false);
    } else {
      setWalletError(
        "Invalid wallet address. Must start with 0x and be at least 10 characters.",
      );
    }
  };

  const handleWalletConnection = () => {
    if (isWalletLoading) return;
    if (isConnected) return disconnect();
    return connect();
  };

  return (
    <div className="mini-game">
      {!state.gameActive && (
        <>
          <div className="mb-4 border-b-4 border-double border-terminal-blue pb-2">
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 bg-terminal-blue animate-pulse mr-2"></div>
              <p className="text-terminal-blue text-xl font-bold">
                DECENTRALIZED MARKET SIMULATOR
              </p>
              <div className="w-4 h-4 bg-terminal-blue animate-pulse ml-2"></div>
            </div>
            <p className="text-terminal-red font-bold">
              DLM-2000 PROTOTYPE TESTING ENVIRONMENT
            </p>
          </div>

          {/* Game Instructions */}
          <div className="game-instructions mb-6 bg-black/20 p-3 border-2 border-terminal-green">
            <p className="text-terminal-green font-bold mb-2 underline">
              GAME INSTRUCTIONS:
            </p>
            <ul className="space-y-1 ml-4 text-terminal-green font-mono">
              {GAME_INSTRUCTIONS.map((instruction, index) => (
                <li key={index} className="animate-flicker-slow">
                  {instruction}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Game Canvas Placeholder - 80s Terminal Style */}
      <div className="game-canvas-container border-4 border-terminal-blue flex items-center justify-center mb-6 bg-black/30 relative overflow-hidden">
        {/* {/* <div className="absolute top-0 left-0 right-0 h-1 bg-terminal-blue/20"></div> */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-terminal-blue/20"></div>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-terminal-blue/20"></div>
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-terminal-blue/20"></div>

        <Game
          onStart={startGame}
          onChangScore={updateGameScore}
          onExit={endGame}
          onOver={endGame}
        />
      </div>

      {/* Wallet Input (shown after game over) - Styled as 80s terminal interface */}
      {showWalletInput && (
        <div className="wallet-input mt-8 border-2 border-terminal-blue p-4 bg-black/20">
          <p className="text-terminal-red font-bold mb-2 animate-pulse">
            EXCEPTIONAL GAMINIG PERFORMANCE! ENTER YOUR T-REX WALLET:
          </p>
          <div className="flex items-center">
            <span className="text-terminal-blue font-bold mr-2">
              {"DINO-ID://"}
            </span>
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
          {walletError && (
            <p className="text-terminal-red mt-2 font-bold">{walletError}</p>
          )}
          <div className="flex justify-between">
            <button
              onClick={handleButtonSubmit}
              className="mt-4 bg-terminal-blue border-2 border-terminal-blue px-4 py-2 font-bold text-black hover:bg-black hover:text-terminal-blue animate-pulse cursor-pointer"
            >
              SAVE YOUR HIGH SCORE
            </button>
            <button
              onClick={handleWalletConnection}
              disabled={isWalletLoading}
              className="mt-4 bg-terminal-blue border-2 border-terminal-blue px-4 py-2 font-bold text-black hover:bg-black hover:text-terminal-blue animate-pulse cursor-pointer"
            >
              {isConnected ? "DISCONNECT WALLET" : "CONNECT WALLET"}
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard - 80s Highscore Table */}
      <PaginationContextProvider
        initialPage={1}
        fetchData={async () => {}}
        pageSize={50}
      >
        {({currentPage, setCurrentPage}) => (
          <>
            <div className="leaderboard mt-8 border-2 border-terminal-green p-2 bg-black/10">
              <div className="text-terminal-green font-bold mb-2 text-center border-b border-terminal-green pb-2 flex items-center justify-between relative">
                <div />
                <p>== TOP PLAYERS LEADERBOARD == </p>
                <div className="flex items-center">
                  <Input
                    className="h-8 w-48 absolute right-0 border-terminal-green/50 hover:border-terminal-green focus:border-terminal-green focus:ring-0"
                    placeholder="Search..."
                    onChange={(e) => setSearchInput(e.target.value)}
                    value={searchInput}
                  />
                </div>
              </div>
              {state.leaderboard.map(
                (entry: LeaderboardEntry, index: number) => (
                  <div
                    key={index}
                    className="leaderboard-entry flex justify-between border-b border-dashed border-terminal-green/30 py-2"
                  >
                    <div className="flex">
                      <span className="text-terminal-blue font-bold mr-2">
                        {index + 1}.
                      </span>
                      <span
                        className="text-terminal-red font-bold truncate animate-flicker-slow"
                        title={entry.wallet}
                      >
                        {entry.wallet}
                      </span>
                    </div>
                    <span className="text-terminal-green font-bold">
                      {entry.score}
                    </span>
                  </div>
                ),
              )}
            </div>
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                onChange={setCurrentPage}
                totalPages={100}
              />
            </div>
          </>
        )}
      </PaginationContextProvider>

      <div className="mt-6 border-t border-dashed border-terminal-blue pt-4 flex items-center">
        <div className="w-3 h-3 bg-terminal-green animate-ping mr-2"></div>
        <p className="text-terminal-green font-bold">
          {"> PRESS [ ESC ] TO EXIT SIMULATOR"}
        </p>
      </div>
    </div>
  );
};

export default MiniGame;

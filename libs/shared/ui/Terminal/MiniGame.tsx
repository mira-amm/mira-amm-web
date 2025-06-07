import { useState, useEffect } from "react";
import { useNavigate } from 'react-router';
import { PaginationContextProvider } from "@/shared/ui/Pagination/PaginationContextProvider";
import { Pagination } from "@/shared/ui/Pagination/Pagination";
import { Input } from "@/shared/ui/input";
import { Game } from "@/shared/ui/Game/Game";
import { queryClient } from '@/shared/lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'

interface LeaderboardEntry {
  player: { name: string; walletAddress: string };
  id: number;
  score: number;
}

const MOCK_LEADERBOARD = [
  {
    id: 34,
    player: {
      name: "Derek Dino",
      walletAddress: "0x4e8d5D93E8Efa7cB6a22f8Fa728Dcb16eB6D9D5A",
    },
    score: 3100,
  },
  {
    id: 2,
    player: {
      name: "Mattias Lightstone",
      walletAddress: "0xD93fEb0D9Bd8cBBc38E51F3C03CcDcFec5A49c35",
    },
    score: 3000,
  },
  {
    id: 25,
    player: {
      name: "Mumtahin Farabi",
      walletAddress: "0x0b7A0EDAfCDE2c7B93f8c1b44A85c167aFE4C654",
    },
    score: 2800,
  },
  {
    id: 1,
    player: {
      name: "Kate Kharitonova",
      walletAddress: "0xA3f91eC0B5a14cBc8f9a6CdbAf7B6E1eF6A8F1B3",
    },
    score: 2000,
  },
  {
    id: 20,
    player: {
      name: "Derek Dino",
      walletAddress: "0x4e8d5D93E8Efa7cB6a22f8Fa728Dcb16eB6D9D5A",
    },
    score: 1750,
  },
  /* {
*   id: 46,
*   player: {
*     name: "Mumtahin Farabi",
*     walletAddress: "0x0b7A0EDAfCDE2c7B93f8c1b44A85c167aFE4C654",
*   },
*   score: 1550,
* },
* {
*   id: 24,
*   player: {
*     name: "Fossil Frank",
*     walletAddress: "0x9cC0F3a77EfAe92F2Be57d47fCb9FbB23c45e9Fd",
*   },
*   score: 1330,
* },
* {
*   id: 41,
*   player: {
*     name: "Derek Dino",
*     walletAddress: "0x4e8d5D93E8Efa7cB6a22f8Fa728Dcb16eB6D9D5A",
*   },
*   score: 1150,
* },
* {
*   id: 11,
*   player: {
*     name: "Mumtahin Farabi",
*     walletAddress: "0x0b7A0EDAfCDE2c7B93f8c1b44A85c167aFE4C654",
*   },
*   score: 1100,
* },
* {
*   id: 48,
*   player: {
*     name: "Derek Dino",
*     walletAddress: "0x4e8d5D93E8Efa7cB6a22f8Fa728Dcb16eB6D9D5A",
*   },
*   score: 1010,
* }, */
];

export const MiniGame = () => {
  const [searchInput, setSearchInput] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/menu');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  return (
        <QueryClientProvider client={queryClient}>
      {/* Title & Instructions */}
      <div className="mb-4 border-b border-b-6 border-double border-b-terminal-blue pb-2">
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-terminal-blue animate-pulse mr-2" />
          <p className="text-terminal-blue text-xl font-bold">
            DECENTRALIZED MARKET SIMULATOR
          </p>
          <div className="w-4 h-4 bg-terminal-blue animate-pulse ml-2" />
        </div>
        <p className="text-terminal-red font-bold">
          DLM-2000 PROTOTYPE TESTING ENVIRONMENT
        </p>
      </div>

      <div className="mb-6 bg-black/20 p-3 border border-6 border-terminal-green">
        <p className="text-terminal-green font-bold mb-2 underline">
          GAME INSTRUCTIONS:
        </p>
        <ul className="space-y-1 ml-4 text-terminal-green font-mono">
          {[
  "> USE ARROW KEYS TO NAVIGATE YOUR SPACE SHIP",
  `> USE "SPACE" TO SHOOT ENEMIES`,
  "> PICK UP SPECIAL ITEMS BY FLYING INTO THEM",
  "> HIGHEST SCORING PLAYERS MIGHT GET A SURPRISE",
].map((instruction, index) => (
            <li key={index} className="animate-flicker-slow">
              {instruction}
            </li>
          ))}
        </ul>
      </div>

      {/* Game Canvas Placeholder */}
      <div className="border border-6 border-terminal-blue flex items-center justify-center mb-6 bg-black/30 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-terminal-blue/20" />
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-terminal-blue/20" />
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-terminal-blue/20" />
        <Game
          onStart={() => {}}
          onChangScore={() => {}}
          onExit={() => {}}
          onOver={() => {}}
        />
      </div>

      {/* Leaderboard */}
      <PaginationContextProvider
        initialPage={1}
        fetchData={async () => {}}
        pageSize={50}
      >
        {({ currentPage, setCurrentPage }) => (
          <>
            <div className="mt-8 border border-6 border-terminal-green p-2 bg-black/10">
              <div className="text-terminal-green font-bold mb-2 text-center border-b border-b-terminal-green pb-2 flex items-center justify-between relative">
                <div />
                <p>== TOP PLAYERS LEADERBOARD ==</p>
                <div className="flex items-center">
                  <Input
                    className="h-8 w-48 absolute right-0 border border-terminal-green/50 hover:border-terminal-green focus:border-terminal-green bg-terminal-bg text-terminal-green placeholder:text-terminal-green focus:ring-0"
                    placeholder="Search..."
                    onChange={(e) => setSearchInput(e.target.value)}
                    value={searchInput}
                  />
                </div>
              </div>

              {MOCK_LEADERBOARD.map((entry, index) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-4 items-center gap-4 border-b border-dashed border-terminal-green/30 py-2"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-terminal-blue font-bold">
                      {index + 1}.
                    </span>
                    <span className="text-terminal-red font-bold truncate animate-flicker-slow">
                      {entry.player.name}
                    </span>
                  </div>
                  <span className="text-terminal-blue font-bold truncate animate-flicker-slow">
                    {entry.player.walletAddress}
                  </span>
                  <span className="text-terminal-green font-bold text-right col-start-4 justify-self-end">
                    {entry.score}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                onChange={setCurrentPage}
                totalPages={1}
              />
            </div>
          </>
        )}
      </PaginationContextProvider>

      <div className="mt-6 border-t border-dashed border-terminal-blue pt-4 flex items-center">
        <div className="w-3 h-3 bg-terminal-green animate-ping mr-2" />
        <p className="text-terminal-green font-bold">
          {"> PRESS [ ESC ] TO EXIT SIMULATOR"}
        </p>
      </div>
        </QueryClientProvider>
  );
};

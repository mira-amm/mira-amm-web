import { RainbowButton } from "@/magic-ui/rainbow-button";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router';
import { PaginationContextProvider } from "@/shared/ui/Pagination/PaginationContextProvider";
import { Pagination } from "@/shared/ui/Pagination/Pagination";
import { Input } from "@/shared/ui/input";
import { Game } from "@/shared/ui/Game/Game";
import { queryClient } from '@/shared/lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'

export const MiniGame = () => {
  const [searchInput, setSearchInput] = useState("");
  const [score, setScore] = useState(0);

  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/users/me', {
      credentials: 'include',
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => setUser(null));
  }, []);

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
          onChangeScore={(newScore) => {
             setScore(newScore);
            return newScore;
          }}
          onExit={() => {}}
          onOver={() => {}}
        />
      </div>

      <div className="flex justify-center mb-2">
        <div className="bg-black px-3 py-1 border border-terminal-green text-terminal-green font-mono font-bold">
          CURRENT SCORE: {score}
        <div className="text-right text-xs font-mono text-terminal-green mb-2">

        {user ? (
          <div className="flex items-center justify-end space-x-2 mb-4">
            {user.avatar?.url && (
              <img
                src={user.avatar.url}
                alt={user.avatar.alt || user.name || "User"}
                className="w-8 h-8 rounded-full border border-terminal-green"
              />
            )}
            <span className="text-terminal-green text-sm font-mono">
              {user.name || user.email}
            </span>
          </div>
        ):
      <RainbowButton
        size="lg"
        className="hover:scale-110"
        onClick={() => {
          const returnTo = encodeURIComponent(window.location.pathname);
          window.location.href = `http://localhost:8000/api/users/oauth/twitter?returnTo=${returnTo}`;
        }}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png"
          alt="Twitter(X) Login"
          width="24"
          height="24"
        />
      </RainbowButton>
        }

        <RainbowButton
          size="lg"
          className="hover:scale-110"
        >
          <img className="size-8" src="https://verified-assets.fuel.network/images/fuel.svg" />
          <img className="size-8" src="https://avatars.githubusercontent.com/u/178423058?s=48&v=4" />
          <img className="size-8" src="https://docs.fuelet.app/~gitbook/image?url=https%3A%2F%2F2435339766-files.gitbook.io%2F~%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FT65XO2RJ6uispplU4cJT%252Fuploads%252F3W8rR7UgMOQrtslELoKu%252FFuelet%2520Logo%2520White.svg%3Falt%3Dmedia%26token%3Dd94170ce-168d-4ad8-8c81-5b10ced92afa&width=300&dpr=2&quality=100&sign=cf822ef8&sv=2" />
        </RainbowButton>
          </div>
        </div>
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


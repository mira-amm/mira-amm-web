import { RainbowButton } from "@/magic-ui/rainbow-button";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router';
import { PaginationContextProvider } from "@/shared/ui/Pagination/PaginationContextProvider";
import { Pagination } from "@/shared/ui/Pagination/Pagination";
import { Input } from "@/shared/ui/input";
import { Game } from "@/shared/ui/Game/Game";
import { queryClient } from '@/shared/lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { cn } from "@/shadcn-ui/utils";

const API_URL = process.env.NODE_ENV === 'development'
? "http://localhost:8000"
: "https://admin.mira.ly";

export const MiniGame = () => {

  const [searchInput, setSearchInput] = useState("");
  const [score, setScore] = useState(0);


const [leaderboard, setLeaderboard] = useState<{
  player: { name: string; walletAddress: string };
  id: number;
  score: number;
}[]>([]);
const [totalPages, setTotalPages] = useState(1);

const fetchLeaderboardPage = async (page = 1) => {
  try {
    /* TODO: use idiomatic react-router 7 functions such loaders and actions instead to take advantage of SSR */
    const res = await fetch(`${API_URL}/api/games?page=${page}&limit=10`, {
      credentials: "include",
    });
    const data = await res.json();
    setLeaderboard(data.docs);
    setTotalPages(data.totalPages || 1);
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
  }
};

  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
   fetch(`${API_URL}/api/users/me`, {
      credentials: "include",
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

  const [shouldNotOverflow, setShouldNotOverflow] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const status = localStorage.getItem("game-status");
      if (status === "true") {
        setShouldNotOverflow(true);
      } else {
        setShouldNotOverflow(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
        <QueryClientProvider client={queryClient}>
      <div className={cn("h-full pr-4", shouldNotOverflow && "overflow-y-hidden")}>
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

      <div className="flex flex-row justify-center mb-2">
        <div className="flex bg-black px-3 py-1 border border-terminal-green text-terminal-green font-mono font-bold">
          CURRENT SCORE: {score}

        <RainbowButton
          size="lg"
          className="hover:scale-110 text-white"
          onClick={() => {
            if (!user) {
              alert("You must be logged in to submit a score.");
              return;
            }

        fetch(`${API_URL}/api/games`, {
          credentials: 'include',
          method: 'POST',
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            player: user.id,
            score: score,
          })
        })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to submit score");
          return res.json();
        })
        .then((data) => {
          console.log("Score submitted successfully:", data);
          alert("Score submitted!");
        })
        .catch((err) => {
          console.error("Error submitting score:", err);
          alert("Error submitting score.");
        });
      }}
      >
        Submit Score
      </RainbowButton>

        <div className="flex text-right text-xs font-mono text-terminal-green mb-2">

        {user ? (
          <div className="flex items-center justify-end space-x-2 mb-4">
            {user.avatar?.url && (
              <img
                src={`${process.env.NODE_ENV === 'development' ? '' : API_URL}${user.avatar.url}`}
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
          window.location.href = `${API_URL}/api/users/oauth/twitter?returnTo=${returnTo}`;
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
          pageSize={10}
          fetchData={async (page) => {
            await fetchLeaderboardPage(page);
          }}
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

                {leaderboard
                  .filter((entry) =>
                    entry.player.name.toLowerCase().includes(searchInput.toLowerCase())
                  )
                  .map((entry, index) => (
                    <div
                      key={entry.id}
                      className="grid grid-cols-4 items-center gap-4 border-b border-dashed border-terminal-green/30 py-2"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-terminal-blue font-bold">{index + 1}.</span>
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
                onChange={(page) => {
                  setCurrentPage(page);
                  fetchLeaderboardPage(page);
                }}
                totalPages={totalPages}
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
        </div>
        </QueryClientProvider>
  );
};


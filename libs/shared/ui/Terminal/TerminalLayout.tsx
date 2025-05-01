import { ReactNode } from "react";
import { stringify } from "qs-esm";
import type { Where } from "payload";

const getTitle = async (): Promise<string> => {
  const query: Where = {
    "microgame.login.text.name": {
      equals: "title",
    },
  };

  const stringifiedQuery = stringify(
    {
      where: query,
      depth: 3,
    },
    { addQueryPrefix: true },
  );

  try {
    const res = await fetch(`${process.env.NODE_ENV==='development' ? process.env.MICROGAME_LOCAL_URL : process.env.MICROGAME_PROD_URL}
/api/globals/constants${stringifiedQuery}`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const data = await res.json();

    const title =
      data?.microgame?.login?.text?.find((item: any) => item.name === "title")?.text ||
      "T-REX TECHNOLOGIES: DLM-2000 PROTOTYPE v0.8.5b";

    console.log("Fetched title:", title);
    return title;
  } catch (err) {
    console.error("Error fetching title:", err);
    return "T-REX TECHNOLOGIES: DLM-2000 PROTOTYPE v0.8.5b";
  }
};

interface TerminalLayoutProps {
  children: ReactNode;
}

export const TerminalLayout = async ({ children }: TerminalLayoutProps) => {
  const title = await getTitle();

  return (
    <div className="relative w-full h-full max-w-6xl mx-auto flex items-center justify-center p-4">
      <div className="relative w-full h-[calc(100vh-2rem)] md:w-[800px] md:h-[600px] bg-terminal-bg rounded-md border border-terminal-text/30 overflow-hidden shadow-2xl shadow-terminal-green/20">
        <header className="h-8 bg-terminal-bg border-b border-terminal-text/30 flex items-center px-4">
          <div className="flex space-x-2 items-center">
            <span className="h-3 w-3 rounded-full bg-terminal-red" />
            <span className="h-3 w-3 rounded-full bg-terminal-yellow" />
            <span className="h-3 w-3 rounded-full bg-terminal-green" />
          </div>
          <div className="flex-1 text-center text-terminal-text text-sm">
            {title}
          </div>
        </header>
        <div className="relative h-[calc(100%-2rem)] overflow-hidden">
          <div className="absolute inset-0 bg-terminal-green/5 opacity-30 animate-scanline pointer-events-none z-10" />
          <main className="h-full overflow-y-auto p-4 text-terminal-text text-lg">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

import {Prompt} from "next/font/google";
import type {ReactNode} from "react";
import {TerminalHeader} from "@/shared/ui/Terminal/TerminalHeader"

import "@/meshwave-ui/global.css";

const prompt = Prompt({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export default function Layout({children}: {children: ReactNode}) {
  return (
    <html lang="en" className={prompt.className} suppressHydrationWarning>
      <body className="flex h-screen justify-center items-center bg-black text-terminal-green font-['VT323',monospace]">
      {/* Terminal Window */}
      <div className="relative w-full max-w-7xl h-[calc(100vh-20rem)] bg-terminal-bg rounded-md border border-terminal-text/30 overflow-hidden shadow-[0_35px_35px_rgba(27,254,174,0.15)] ">
        <TerminalHeader/>
          {/* Animated scanline effect */}
        <div className="scanlines relative h-[calc(100%-2rem)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-terminal-green/5 opacity-30 animate-scanline pointer-events-none z-10"></div>
        {/* Main Terminal Content */}
          <main className="h-full overflow-y-auto p-4 text-terminal-text text-lg">
            {children}
          </main>
        </div>
    </div>
      </body>
    </html>
  );
}

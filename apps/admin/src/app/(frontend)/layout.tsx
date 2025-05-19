import {Prompt} from "next/font/google";
import type {ReactNode} from "react";
/* import {TerminalHeader} from "@/shared/ui/Terminal/TerminalHeader" */

import "@/meshwave-ui/global.css";

const prompt = Prompt({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export default function Layout({children}: {children: ReactNode}) {
  return (
    <html lang="en" className={prompt.className} suppressHydrationWarning>
      <body className="flex h-screen justify-center items-center bg-black text-terminal-green font-['VT323',monospace]">
            {children}
      </body>
    </html>
  );
}

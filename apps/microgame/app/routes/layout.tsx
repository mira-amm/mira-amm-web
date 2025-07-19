import type { Route } from './+types/home';
import {TerminalHeader} from "@/shared/ui/Terminal/TerminalHeader"
import { userFlowActor } from '@/engine/actors/user';
import { Outlet } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Microchain Systems' },
    { name: 'description', content: 'Welcome to Microchain Systems' },
  ];
}

export default function Layout() {

if (typeof window !== 'undefined') {
    userFlowActor.start()
}

  return (
      <div className="flex dark:bg-black h-screen justify-center items-center text-terminal-green font-['VT323',monospace]">
      <div className="relative w-full max-w-7xl h-[calc(100vh-20rem)] bg-terminal-bg rounded-md border border-terminal-text/30 overflow-hidden shadow-[0_35px_35px_rgba(27,254,174,0.15)] ">
        <TerminalHeader/>
        <div className="scanlines relative h-[calc(100%-2rem)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-terminal-green/5 opacity-30 animate-scanline pointer-events-none z-10"/>
          <main className="h-full p-8 text-terminal-text text-lg overflow-y-auto">
              <Outlet />
          </main>
        </div>
      </div>
      </div>
  );
}

import {Terminal} from "@/shared/ui/Terminal/Terminal";

import "@/shared/ui/index.css"

export default function Home() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black font-['VT323',monospace]">
      <Terminal />
    </div>
  );
}

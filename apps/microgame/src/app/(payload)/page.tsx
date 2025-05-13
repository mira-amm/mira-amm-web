import TerminalPage from "@/shared/ui/Terminal/TerminalPage";

import "@/shared/ui/index.css";

export default function Home() {
  return <TerminalDataWrapper />;
}

async function TerminalDataWrapper() {
  return <TerminalPage />;
}

import TerminalPage from "@/shared/ui/Terminal/TerminalPage";
import {getLeaderboard} from "@/api/microgame/leaderboard";

import "@/shared/ui/index.css";

export default function Home() {
  return <TerminalDataWrapper />;
}

async function TerminalDataWrapper() {
  const leaderboard = await getLeaderboard();
  return <TerminalPage leaderBoardData={leaderboard} />;
}

import { Boosts } from "@/src/components/pages/liquidity-page/components/Boosts/Boosts";
import PointsRankTable from "@/src/components/pages/points-page/PointsRankTable/PointsRankTable";

export default function Page() {
  return (
    <main className="flex flex-col w-full max-w-6xl p-8 mx-auto space-y-4">
      <Boosts />
      <section>
        <p className="text-4xl font-semibold mb-2">Leaderboard</p>
        <div>
          <h4 className="text-base text-gray-300">
            See the top participants of the points program.
          </h4>
          <h4 className="text-sm text-yellow-400 mt-1">
            The leaderboard is updated every hour.
          </h4>
        </div>
      </section>
      <PointsRankTable />
    </main>
  );
};
